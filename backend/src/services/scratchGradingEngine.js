/**
 * Scratch採点エンジン v2.1
 *
 * 意味的等価性を判定し、詳細なフィードバックを提供する新しい採点システム
 * v2.1の改善点: 変数名を無視し、変数の使用パターンで比較
 */

// ========================================
// 1. 正規化ユーティリティ
// ========================================

/**
 * ひらがなをカタカナに変換
 */
function hiraganaToKatakana(str) {
  return str.replace(/[\u3041-\u3096]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

/**
 * 変数名を正規化（カタカナに統一、空白・記号を削除）
 */
function normalizeVariableName(name) {
  if (!name) return '';

  // 空白と一部の記号を削除
  let normalized = name.trim().replace(/[\s\-_]/g, '');

  // ひらがなをカタカナに変換
  normalized = hiraganaToKatakana(normalized);

  return normalized;
}

/**
 * 数値を正規化（文字列の数値も数値型に変換）
 */
function normalizeNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? value : num;
  }
  return value;
}

/**
 * 文字列を正規化（トリム、カタカナ化）
 */
function normalizeString(str) {
  if (typeof str !== 'string') return str;
  return hiraganaToKatakana(str.trim());
}

// ========================================
// 1.5. 変数マッピング（v2.1 新機能）
// ========================================

/**
 * 変数の使用パターンを抽出
 *
 * 変数がどのブロックでどのように使われているかを記録
 * 例: 変数「カウンター」が以下で使われている:
 *   - data_setvariableto (値: 0)
 *   - data_changevariableby (値: 1)
 *   - data_showvariable
 */
function buildVariableUsagePattern(scratchData) {
  const variableUsage = {}; // { variableId: [{ opcode, operation, value, position }] }

  if (!scratchData || !scratchData.targets) {
    return variableUsage;
  }

  for (const target of scratchData.targets) {
    if (target.isStage) continue;

    // 変数定義を取得
    const variables = target.variables || {};

    // 各変数のIDと名前をマッピング
    const variableMap = {}; // { variableId: variableName }
    for (const [varId, varData] of Object.entries(variables)) {
      if (Array.isArray(varData) && varData.length >= 1) {
        variableMap[varId] = varData[0]; // 変数名
      }
    }

    // ブロックを走査して変数の使用箇所を記録
    if (target.blocks) {
      let position = 0;
      for (const [blockId, block] of Object.entries(target.blocks)) {
        if (!block || !block.opcode) continue;

        // 変数を使用するブロックを検出
        if (block.opcode.startsWith('data_')) {
          const varField = block.fields?.VARIABLE;
          if (varField && Array.isArray(varField) && varField.length >= 2) {
            const varName = varField[0];
            const varId = varField[1]; // 変数ID

            // 使用パターンを記録
            if (!variableUsage[varId]) {
              variableUsage[varId] = {
                name: varName,
                usages: []
              };
            }

            // 操作の詳細を記録
            const usage = {
              opcode: block.opcode,
              position: position++
            };

            // 値を取得（set, changeなどの場合）
            if (block.inputs?.VALUE) {
              usage.value = getInputValue(block, 'VALUE');
            }

            variableUsage[varId].usages.push(usage);
          }
        }
      }
    }
  }

  return variableUsage;
}

/**
 * 2つのプログラムの変数をマッピング
 *
 * 変数名が違っても、使用パターンが同じであればマッピングする
 * 例:
 *   正解: 変数「カウンター」を0にする → 1ずつ変える
 *   生徒: 変数「りんご」を0にする → 1ずつ変える
 *   → 「カウンター」と「りんご」をマッピング
 */
function mapVariables(correctUsage, submittedUsage) {
  const mapping = {}; // { submittedVarId: correctVarId }
  const usedCorrectVars = new Set();

  // 各提出変数に対して、最も類似した正解変数を見つける
  for (const [submittedVarId, submittedPattern] of Object.entries(submittedUsage)) {
    let bestMatch = null;
    let bestScore = -1;

    for (const [correctVarId, correctPattern] of Object.entries(correctUsage)) {
      // 既にマッピング済みの変数はスキップ
      if (usedCorrectVars.has(correctVarId)) continue;

      // 使用パターンの類似度を計算
      const score = calculatePatternSimilarity(
        submittedPattern.usages,
        correctPattern.usages
      );

      if (score > bestScore) {
        bestScore = score;
        bestMatch = correctVarId;
      }
    }

    // 類似度が一定以上ならマッピング
    if (bestMatch && bestScore > 0.5) {
      mapping[submittedVarId] = bestMatch;
      usedCorrectVars.add(bestMatch);
    }
  }

  return mapping;
}

/**
 * 変数使用パターンの類似度を計算
 */
function calculatePatternSimilarity(pattern1, pattern2) {
  if (pattern1.length === 0 && pattern2.length === 0) return 1;
  if (pattern1.length === 0 || pattern2.length === 0) return 0;

  let matchCount = 0;
  const maxLength = Math.max(pattern1.length, pattern2.length);

  // 各使用箇所を比較
  for (let i = 0; i < Math.min(pattern1.length, pattern2.length); i++) {
    const usage1 = pattern1[i];
    const usage2 = pattern2[i];

    // opcodeが一致
    if (usage1.opcode === usage2.opcode) {
      matchCount += 0.5;

      // 値も一致（または両方ともnull）
      if (usage1.value === usage2.value ||
          (usage1.value === null && usage2.value === null) ||
          (typeof usage1.value === 'number' && typeof usage2.value === 'number' &&
           Math.abs(usage1.value - usage2.value) < 0.01)) {
        matchCount += 0.5;
      }
    }
  }

  return matchCount / maxLength;
}

// ========================================
// 2. ブロック解析
// ========================================

/**
 * ブロックの入力値を取得
 */
function getInputValue(block, inputName) {
  if (!block || !block.inputs || !block.inputs[inputName]) {
    return null;
  }

  const input = block.inputs[inputName];

  // 形式1: [shadowType, [type, value]]
  if (Array.isArray(input) && input.length >= 2) {
    const shadowOrBlock = input[1];

    if (Array.isArray(shadowOrBlock) && shadowOrBlock.length >= 2) {
      // [type, value] 形式
      const value = shadowOrBlock[1];
      return normalizeNumber(value);
    }
  }

  // 形式2: {shadow: [type, value], block: blockId}
  if (typeof input === 'object' && input.shadow) {
    if (Array.isArray(input.shadow) && input.shadow.length >= 2) {
      const value = input.shadow[1];
      return normalizeNumber(value);
    }
  }

  return null;
}

/**
 * ブロックのフィールド値を取得
 */
function getFieldValue(block, fieldName) {
  if (!block || !block.fields || !block.fields[fieldName]) {
    return null;
  }

  const field = block.fields[fieldName];

  // [value, id?] 形式
  if (Array.isArray(field) && field.length > 0) {
    return field[0];
  }

  return field;
}

/**
 * スクリプトを抽出（トップレベルブロックから開始）
 */
function extractScripts(blocks, variableMapping = null) {
  const scripts = [];
  const blockMap = {};
  const visited = new Set();

  // ブロックマップを作成
  for (const [id, block] of Object.entries(blocks)) {
    blockMap[id] = { ...block, id };
  }

  // トップレベルブロックを探す
  for (const [id, block] of Object.entries(blockMap)) {
    if (block.topLevel && !visited.has(id)) {
      const script = traverseScript(id, blockMap, visited, variableMapping);
      if (script.blocks.length > 0 || script.eventBlock) {
        scripts.push(script);
      }
    }
  }

  return scripts;
}

/**
 * ブロックチェーンを辿る（変数マッピング対応版）
 */
function traverseScript(startId, blockMap, visited, variableMapping = null) {
  const script = {
    eventBlock: null,
    blocks: []
  };

  let currentId = startId;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const block = blockMap[currentId];

    if (!block) break;

    // イベントブロック
    if (block.opcode && block.opcode.startsWith('event_')) {
      script.eventBlock = {
        type: block.opcode,
        id: currentId
      };
    } else {
      // 通常のブロック
      const normalizedBlock = {
        id: currentId,
        opcode: block.opcode,
        inputs: extractInputs(block),
        fields: extractFields(block, variableMapping),
        substack: extractSubstacks(block, blockMap, visited, variableMapping)
      };
      script.blocks.push(normalizedBlock);
    }

    currentId = block.next;
  }

  return script;
}

/**
 * ブロックの入力を抽出
 */
function extractInputs(block) {
  const inputs = {};

  if (block.inputs) {
    for (const [key, value] of Object.entries(block.inputs)) {
      // SUBSTACKは別途処理するのでスキップ
      if (key.startsWith('SUBSTACK')) continue;

      const inputValue = getInputValue(block, key);
      if (inputValue !== null) {
        inputs[key] = inputValue;
      }
    }
  }

  return inputs;
}

/**
 * ブロックのフィールドを抽出（変数マッピング対応版）
 */
function extractFields(block, variableMapping = null) {
  const fields = {};

  if (block.fields) {
    for (const [key, value] of Object.entries(block.fields)) {
      const fieldValue = getFieldValue(block, key);
      if (fieldValue !== null) {
        // 変数名やリスト名の処理
        if (key === 'VARIABLE' || key === 'LIST') {
          // 変数マッピングがある場合は、変数IDを使用
          if (variableMapping && Array.isArray(value) && value.length >= 2) {
            const varId = value[1]; // 変数ID
            const mappedVarId = variableMapping[varId] || varId;
            fields[key] = `__VAR_${mappedVarId}__`; // 変数IDで統一
          } else {
            // マッピングがない場合は、変数名を正規化（後方互換性）
            fields[key] = normalizeVariableName(fieldValue);
          }
        } else {
          fields[key] = fieldValue;
        }
      }
    }
  }

  return fields;
}

/**
 * サブスタック（制御ブロック内のブロック）を抽出（変数マッピング対応版）
 */
function extractSubstacks(block, blockMap, visited, variableMapping = null) {
  const substacks = {};

  if (block.inputs) {
    for (const [key, value] of Object.entries(block.inputs)) {
      if (key.startsWith('SUBSTACK') && value) {
        // valueは [shadowType, blockId] 形式または {block: blockId} 形式
        let substackStartId = null;

        if (Array.isArray(value) && value.length >= 2) {
          substackStartId = value[1];
        } else if (typeof value === 'object' && value.block) {
          substackStartId = value.block;
        }

        if (substackStartId && !visited.has(substackStartId)) {
          const substackBlocks = [];
          let currentId = substackStartId;

          while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const subBlock = blockMap[currentId];
            if (!subBlock) break;

            substackBlocks.push({
              id: currentId,
              opcode: subBlock.opcode,
              inputs: extractInputs(subBlock),
              fields: extractFields(subBlock, variableMapping),
              // 再帰的にサブスタックを処理
              substack: extractSubstacks(subBlock, blockMap, visited, variableMapping)
            });

            currentId = subBlock.next;
          }

          substacks[key] = substackBlocks;
        }
      }
    }
  }

  return substacks;
}

/**
 * プログラム全体を正規化（変数マッピング対応版）
 */
function normalizeProgram(scratchData, variableMapping = null) {
  if (!scratchData || !scratchData.targets) {
    return { sprites: [] };
  }

  const normalized = {
    sprites: []
  };

  for (const target of scratchData.targets) {
    // ステージはスキップ
    if (target.isStage) continue;

    const sprite = {
      name: target.name,
      variables: normalizeVariables(target.variables || {}, variableMapping),
      lists: normalizeVariables(target.lists || {}, variableMapping),
      scripts: target.blocks ? extractScripts(target.blocks, variableMapping) : []
    };

    normalized.sprites.push(sprite);
  }

  return normalized;
}

/**
 * 変数・リストを正規化（変数マッピング対応版）
 */
function normalizeVariables(variables, variableMapping = null) {
  const normalized = {};

  for (const [id, data] of Object.entries(variables)) {
    if (Array.isArray(data) && data.length >= 2) {
      const [name, value] = data;

      // 変数マッピングがある場合は、マッピング後のIDを使用
      if (variableMapping) {
        const mappedId = variableMapping[id] || id;
        const varKey = `__VAR_${mappedId}__`;
        normalized[varKey] = {
          originalName: name,
          value: value,
          id: mappedId
        };
      } else {
        // マッピングがない場合は、変数名を正規化（後方互換性）
        const normalizedName = normalizeVariableName(name);
        normalized[normalizedName] = {
          originalName: name,
          value: value
        };
      }
    }
  }

  return normalized;
}

// ========================================
// 3. 要件抽出（正解データから）
// ========================================

/**
 * ブロックのラベルを取得
 */
const BLOCK_LABELS = {
  // イベント
  'event_whenflagclicked': '緑の旗がクリックされたとき',
  'event_whenkeypressed': 'キーが押されたとき',
  'event_whenthisspriteclicked': 'このスプライトがクリックされたとき',

  // 動き
  'motion_movesteps': '○歩動かす',
  'motion_turnright': '右に○度回す',
  'motion_turnleft': '左に○度回す',
  'motion_gotoxy': 'x:○ y:○へ行く',
  'motion_glidesecstoxy': '○秒で x:○ y:○へ行く',

  // 見た目
  'looks_say': '○と言う',
  'looks_sayforsecs': '○と○秒言う',
  'looks_think': '○と考える',
  'looks_thinkforsecs': '○と○秒考える',
  'looks_show': '表示する',
  'looks_hide': '隠す',

  // 音
  'sound_play': '○の音を鳴らす',
  'sound_playuntildone': '○の音を最後まで鳴らす',

  // 制御
  'control_repeat': '○回繰り返す',
  'control_forever': 'ずっと',
  'control_if': 'もし○なら',
  'control_if_else': 'もし○なら、でなければ',
  'control_wait': '○秒待つ',
  'control_wait_until': '○まで待つ',

  // データ
  'data_setvariableto': '○を○にする',
  'data_changevariableby': '○を○ずつ変える',
  'data_hidevariable': '○を隠す',
  'data_showvariable': '○を表示する',

  // ペン
  'pen_penDown': 'ペンを下ろす',
  'pen_penUp': 'ペンを上げる',
  'pen_clear': '消す'
};

function getBlockLabel(opcode) {
  return BLOCK_LABELS[opcode] || opcode;
}

/**
 * ブロックのカテゴリを取得
 */
function getBlockCategory(opcode) {
  if (!opcode) return 'その他';

  if (opcode.startsWith('event_')) return 'イベント';
  if (opcode.startsWith('motion_')) return '動き';
  if (opcode.startsWith('looks_')) return '見た目';
  if (opcode.startsWith('sound_')) return '音';
  if (opcode.startsWith('control_')) return '制御';
  if (opcode.startsWith('sensing_')) return '調べる';
  if (opcode.startsWith('operator_')) return '演算';
  if (opcode.startsWith('data_')) return 'データ';
  if (opcode.startsWith('pen_')) return 'ペン';

  return 'その他';
}

/**
 * 正解データから要件を自動抽出
 */
function extractRequirements(normalizedCorrect) {
  const requirements = {
    requiredBlocks: [],
    orderConstraints: []
  };

  for (const sprite of normalizedCorrect.sprites) {
    for (const script of sprite.scripts) {
      // イベントブロック
      if (script.eventBlock) {
        requirements.requiredBlocks.push({
          opcode: script.eventBlock.type,
          label: getBlockLabel(script.eventBlock.type),
          category: getBlockCategory(script.eventBlock.type),
          count: 1,
          points: 10,
          required: true,
          inputs: {},
          fields: {}
        });
      }

      // 各ブロック
      for (const block of script.blocks) {
        addBlockRequirement(requirements.requiredBlocks, block);

        // サブスタック内のブロック
        for (const [substackKey, substackBlocks] of Object.entries(block.substack)) {
          for (const subBlock of substackBlocks) {
            addBlockRequirement(requirements.requiredBlocks, subBlock);
          }
        }
      }

      // 順序制約（隣接するブロックの順序）
      for (let i = 0; i < script.blocks.length - 1; i++) {
        const currentBlock = script.blocks[i];
        const nextBlock = script.blocks[i + 1];

        requirements.orderConstraints.push({
          type: 'before',
          blockA: {
            opcode: currentBlock.opcode,
            label: getBlockLabel(currentBlock.opcode)
          },
          blockB: {
            opcode: nextBlock.opcode,
            label: getBlockLabel(nextBlock.opcode)
          },
          points: 5
        });
      }
    }
  }

  return requirements;
}

/**
 * ブロック要件を追加
 */
function addBlockRequirement(requiredBlocks, block) {
  // 既に同じopcodeの要件があるかチェック
  const existingReq = requiredBlocks.find(req =>
    req.opcode === block.opcode &&
    JSON.stringify(req.inputs) === JSON.stringify(block.inputs)
  );

  if (existingReq) {
    // カウントを増やす
    existingReq.count++;
  } else {
    // 新規追加
    requiredBlocks.push({
      opcode: block.opcode,
      label: getBlockLabel(block.opcode),
      category: getBlockCategory(block.opcode),
      count: 1,
      points: 10,
      required: true,
      inputs: block.inputs,
      fields: block.fields
    });
  }
}

// ========================================
// 4. ブロック要件のチェック
// ========================================

/**
 * プログラムから特定のブロックを検索
 */
function findBlocks(program, opcode, inputs = null) {
  const found = [];

  for (const sprite of program.sprites) {
    for (const script of sprite.scripts) {
      // イベントブロックもチェック
      if (script.eventBlock && script.eventBlock.type === opcode) {
        found.push({ opcode: script.eventBlock.type, id: script.eventBlock.id, inputs: {}, fields: {}, substack: {} });
      }

      // 通常のブロック
      for (const block of script.blocks) {
        if (block.opcode === opcode) {
          if (!inputs || inputsMatch(block.inputs, inputs)) {
            found.push(block);
          }
        }

        // サブスタック内も検索
        searchInSubstack(block.substack, opcode, inputs, found);
      }
    }
  }

  return found;
}

/**
 * サブスタック内を再帰的に検索
 */
function searchInSubstack(substack, opcode, inputs, found) {
  for (const [key, blocks] of Object.entries(substack)) {
    for (const block of blocks) {
      if (block.opcode === opcode) {
        if (!inputs || inputsMatch(block.inputs, inputs)) {
          found.push(block);
        }
      }

      // 再帰的にサブスタックを検索
      if (block.substack) {
        searchInSubstack(block.substack, opcode, inputs, found);
      }
    }
  }
}

/**
 * 入力値が一致するかチェック
 */
function inputsMatch(actualInputs, expectedInputs) {
  for (const [key, expectedValue] of Object.entries(expectedInputs)) {
    const actualValue = actualInputs[key];

    // 数値は許容範囲でチェック（±10%）
    if (typeof expectedValue === 'number' && typeof actualValue === 'number') {
      const tolerance = Math.abs(expectedValue) * 0.1;
      if (Math.abs(actualValue - expectedValue) > tolerance) {
        return false;
      }
    } else if (actualValue !== expectedValue) {
      return false;
    }
  }

  return true;
}

/**
 * ブロック要件をチェック
 */
function checkBlockRequirements(program, requiredBlocks) {
  const results = [];

  for (const requirement of requiredBlocks) {
    const found = findBlocks(program, requirement.opcode, requirement.inputs);

    const result = {
      requirement,
      found,
      passed: false,
      score: 0,
      feedback: null
    };

    // 数量チェック
    if (found.length === requirement.count) {
      result.passed = true;
      result.score = requirement.points;
    } else if (found.length > 0) {
      // 部分点
      result.score = Math.round(requirement.points * 0.5);

      if (found.length < requirement.count) {
        result.feedback = `「${requirement.label}」ブロックが${found.length}個ありますが、${requirement.count}個必要です`;
      } else {
        result.feedback = `「${requirement.label}」ブロックが${found.length}個ありますが、${requirement.count}個で十分です`;
      }
    } else {
      result.feedback = `「${requirement.label}」ブロックがありません`;
    }

    // パラメータの詳細チェック
    if (found.length > 0 && Object.keys(requirement.inputs).length > 0) {
      const paramCheck = checkParameters(found[0], requirement.inputs);
      if (!paramCheck.allMatch) {
        result.passed = false;
        result.score = Math.round(requirement.points * paramCheck.matchRatio);
        result.feedback = paramCheck.feedback;
      }
    }

    results.push(result);
  }

  return results;
}

/**
 * パラメータをチェック
 */
function checkParameters(block, expectedInputs) {
  const matches = [];
  const mismatches = [];

  for (const [key, expectedValue] of Object.entries(expectedInputs)) {
    const actualValue = block.inputs[key];

    if (actualValue === expectedValue) {
      matches.push(key);
    } else {
      mismatches.push({
        key,
        expected: expectedValue,
        actual: actualValue
      });
    }
  }

  const totalParams = Object.keys(expectedInputs).length;
  const matchRatio = totalParams > 0 ? matches.length / totalParams : 1;

  let feedback = null;
  if (mismatches.length > 0) {
    const details = mismatches.map(m =>
      `${m.key}は「${m.expected}」であるべきですが、「${m.actual}」になっています`
    ).join('、');
    feedback = `パラメータが正しくありません: ${details}`;
  }

  return {
    allMatch: mismatches.length === 0,
    matchRatio,
    feedback
  };
}

// ========================================
// 5. 順序制約のチェック
// ========================================

/**
 * 順序制約をチェック
 */
function checkOrderConstraints(program, constraints) {
  const results = [];

  for (const constraint of constraints) {
    const result = {
      constraint,
      passed: false,
      score: 0,
      feedback: null
    };

    if (constraint.type === 'before') {
      const orderCorrect = checkBlockOrder(
        program,
        constraint.blockA.opcode,
        constraint.blockB.opcode
      );

      if (orderCorrect) {
        result.passed = true;
        result.score = constraint.points;
      } else {
        result.feedback = `「${constraint.blockA.label}」は「${constraint.blockB.label}」の前にある必要があります`;
      }
    }

    results.push(result);
  }

  return results;
}

/**
 * ブロックの順序をチェック（隣接するブロック間のみ）
 */
function checkBlockOrder(program, opcodeA, opcodeB) {
  // すべてのスクリプトで隣接するブロックペアを探す
  for (const sprite of program.sprites) {
    for (const script of sprite.scripts) {
      for (let i = 0; i < script.blocks.length - 1; i++) {
        const currentBlock = script.blocks[i];
        const nextBlock = script.blocks[i + 1];

        // 隣接するブロックがopcodeA→opcodeBの順序か確認
        if (currentBlock.opcode === opcodeA && nextBlock.opcode === opcodeB) {
          return true;
        }
      }
    }
  }

  return false;
}

// ========================================
// 6. スコア計算とフィードバック
// ========================================

/**
 * スコアを計算
 */
function calculateScore(blockResults, orderResults) {
  let totalScore = 0;
  let maxScore = 0;

  // ブロック要件のスコア
  for (const result of blockResults) {
    totalScore += result.score;
    maxScore += result.requirement.points;
  }

  // 順序制約のスコア
  for (const result of orderResults) {
    totalScore += result.score;
    maxScore += result.constraint.points;
  }

  // 100点満点にスケーリング
  if (maxScore > 0) {
    totalScore = Math.round((totalScore / maxScore) * 100);
  }

  return Math.min(totalScore, 100);
}

/**
 * フィードバックを生成
 */
function generateFeedback(blockResults, orderResults, score) {
  const details = [];
  const hints = [];

  // ブロック要件のフィードバック
  for (const result of blockResults) {
    if (result.passed) {
      details.push({
        type: 'success',
        icon: '✓',
        message: `「${result.requirement.label}」ブロックがあります`
      });
    } else if (result.score > 0) {
      details.push({
        type: 'warning',
        icon: '△',
        message: result.feedback
      });

      // ヒント生成
      hints.push(`「${result.requirement.category}」カテゴリを確認してください`);
    } else {
      details.push({
        type: 'error',
        icon: '✗',
        message: result.feedback
      });

      // 具体的なヒント
      hints.push(`「${result.requirement.category}」カテゴリから「${result.requirement.label}」ブロックを追加してみましょう`);
    }
  }

  // 順序制約のフィードバック
  let orderCorrectCount = 0;
  for (const result of orderResults) {
    if (result.passed) {
      orderCorrectCount++;
    } else if (result.feedback) {
      details.push({
        type: 'error',
        icon: '✗',
        message: result.feedback
      });

      hints.push('ブロックを正しい順番に並べ替えてみましょう');
    }
  }

  // 順序が全て正しい場合のみ成功メッセージ
  if (orderResults.length > 0 && orderCorrectCount === orderResults.length) {
    details.push({
      type: 'success',
      icon: '✓',
      message: 'ブロックの順序が正しいです'
    });
  }

  // サマリー生成
  let summary;
  if (score === 100) {
    summary = '完璧です！プログラムが正解と完全に一致しています。';
  } else if (score >= 80) {
    summary = '正解です！よくできました。';
  } else if (score >= 60) {
    summary = 'あと少しで正解です！もう一息です。';
  } else if (score >= 40) {
    summary = 'いい感じです！まだいくつか修正が必要です。';
  } else {
    summary = 'もう一度確認してみましょう。下のヒントを参考にしてください。';
  }

  return {
    summary,
    details,
    hints: [...new Set(hints)]  // 重複削除
  };
}

// ========================================
// 7. メイン評価関数
// ========================================

/**
 * Scratchプログラムを評価（v2.1: 変数マッピング対応）
 */
function evaluateScratchProgram(submittedData, correctData, customConfig = null) {
  // 入力チェック
  if (!submittedData || !correctData) {
    return {
      score: 0,
      isCorrect: false,
      feedback: {
        summary: 'データが不正です',
        details: [],
        hints: []
      }
    };
  }

  // Step 1: 変数使用パターンを抽出
  const correctVarUsage = buildVariableUsagePattern(correctData);
  const submittedVarUsage = buildVariableUsagePattern(submittedData);

  // Step 2: 変数をマッピング（変数名が違っても使用パターンで対応付け）
  const variableMapping = mapVariables(correctVarUsage, submittedVarUsage);

  // デバッグログ
  console.log('=== Variable Mapping (v2.1) ===');
  console.log('Correct variables:', Object.keys(correctVarUsage).map(id => ({
    id,
    name: correctVarUsage[id].name,
    usages: correctVarUsage[id].usages.length
  })));
  console.log('Submitted variables:', Object.keys(submittedVarUsage).map(id => ({
    id,
    name: submittedVarUsage[id].name,
    usages: submittedVarUsage[id].usages.length
  })));
  console.log('Variable mapping:', variableMapping);
  console.log('===============================');

  // Step 3: 正規化（変数マッピングを適用）
  const normalizedSubmitted = normalizeProgram(submittedData, variableMapping);
  const normalizedCorrect = normalizeProgram(correctData);

  // Step 4: 要件抽出（カスタム設定がなければ自動抽出）
  const requirements = customConfig || extractRequirements(normalizedCorrect);

  // Step 5: ブロック要件のチェック
  const blockResults = checkBlockRequirements(
    normalizedSubmitted,
    requirements.requiredBlocks
  );

  // Step 6: 順序制約のチェック
  const orderResults = checkOrderConstraints(
    normalizedSubmitted,
    requirements.orderConstraints
  );

  // Step 7: スコア計算
  const score = calculateScore(blockResults, orderResults);

  // Step 8: フィードバック生成
  const feedback = generateFeedback(blockResults, orderResults, score);

  return {
    score,
    isCorrect: score >= 80,
    feedback
  };
}

module.exports = {
  evaluateScratchProgram,
  normalizeProgram,
  extractRequirements,
  getBlockLabel,
  getBlockCategory
};
