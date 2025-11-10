/**
 * Scratch採点エンジン v2.3
 *
 * 意味的等価性を判定し、詳細なフィードバックを提供する新しい採点システム
 *
 * v2.1の改善点: 変数名を無視し、変数の使用パターンで比較
 * v2.2の改善点:
 *   - 全ブロックタイプ（制御、見た目、音、イベント等）の値判別を実装
 *   - 値の誤差判定を改善（大幅な誤りでも「値が間違っている」と明確に指摘）
 *   - 余分なブロック・変数の検出機能を追加
 *   - 点数に応じたきめ細かいメッセージ（85点で「あともう少し」等）
 * v2.3の改善点（見やすさ重視）:
 *   - エラーの優先度付け（重要な問題から表示）
 *   - 正解している部分は表示しない（間違いに集中）
 *   - カテゴリ別サマリー（問題の多いカテゴリを強調、3個以上のエラーがある場合）
 *   - ヒントは最大3個まで（優先度順、重複削除）
 *   - すべてのエラーを表示（制限なし）
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
  'event_whenbroadcastreceived': '○を受け取ったとき',
  'event_broadcast': '○を送る',
  'event_broadcastandwait': '○を送って待つ',
  'event_whenstageclicked': 'ステージがクリックされたとき',
  'event_whenbackdropswitchesto': '背景が○になったとき',

  // 動き
  'motion_movesteps': '○歩動かす',
  'motion_turnright': '右に○度回す',
  'motion_turnleft': '左に○度回す',
  'motion_gotoxy': 'x:○ y:○へ行く',
  'motion_goto': '○へ行く',
  'motion_glidesecstoxy': '○秒で x:○ y:○へ行く',
  'motion_glideto': '○秒で○へ行く',
  'motion_pointindirection': '○度に向ける',
  'motion_pointtowards': '○へ向ける',
  'motion_changexby': 'xを○ずつ変える',
  'motion_setx': 'xを○にする',
  'motion_changeyby': 'yを○ずつ変える',
  'motion_sety': 'yを○にする',
  'motion_ifonedgebounce': 'もし端に着いたら、跳ね返る',
  'motion_setrotationstyle': '回転方法を○にする',

  // 見た目
  'looks_say': '○と言う',
  'looks_sayforsecs': '○と○秒言う',
  'looks_think': '○と考える',
  'looks_thinkforsecs': '○と○秒考える',
  'looks_show': '表示する',
  'looks_hide': '隠す',
  'looks_switchcostumeto': 'コスチュームを○にする',
  'looks_nextcostume': '次のコスチュームにする',
  'looks_switchbackdropto': '背景を○にする',
  'looks_nextbackdrop': '次の背景にする',
  'looks_changesizeby': '大きさを○ずつ変える',
  'looks_setsizeto': '大きさを○%にする',
  'looks_changeeffectby': '○の効果を○ずつ変える',
  'looks_seteffectto': '○の効果を○にする',
  'looks_cleargraphiceffects': '画像効果をなくす',
  'looks_gotofrontback': '最前面へ移動する / 最背面へ移動する',
  'looks_goforwardbackwardlayers': '○層○へ移動する',

  // 音
  'sound_play': '○の音を鳴らす',
  'sound_playuntildone': '○の音を最後まで鳴らす',
  'sound_stopallsounds': 'すべての音を止める',
  'sound_changeeffectby': '○の効果を○ずつ変える',
  'sound_seteffectto': '○の効果を○にする',
  'sound_cleareffects': '音の効果をなくす',
  'sound_changevolumeby': '音量を○ずつ変える',
  'sound_setvolumeto': '音量を○%にする',

  // 制御
  'control_repeat': '○回繰り返す',
  'control_forever': 'ずっと',
  'control_if': 'もし○なら',
  'control_if_else': 'もし○なら、でなければ',
  'control_wait': '○秒待つ',
  'control_wait_until': '○まで待つ',
  'control_repeat_until': '○まで繰り返す',
  'control_stop': '○を止める',
  'control_start_as_clone': 'クローンされたとき',
  'control_create_clone_of': '○のクローンを作る',
  'control_delete_this_clone': 'このクローンを削除する',

  // 調べる
  'sensing_touchingobject': '○に触れた',
  'sensing_touchingcolor': '○色に触れた',
  'sensing_coloristouchingcolor': '○色が○色に触れた',
  'sensing_distanceto': '○までの距離',
  'sensing_askandwait': '○と聞いて待つ',
  'sensing_answer': '答え',
  'sensing_keypressed': '○キーが押された',
  'sensing_mousedown': 'マウスが押された',
  'sensing_mousex': 'マウスのx座標',
  'sensing_mousey': 'マウスのy座標',
  'sensing_setdragmode': 'ドラッグを○にする',
  'sensing_loudness': '音量',
  'sensing_timer': 'タイマー',
  'sensing_resettimer': 'タイマーをリセット',
  'sensing_of': '○の○',
  'sensing_current': '現在の○',
  'sensing_dayssince2000': '2000年からの日数',
  'sensing_username': 'ユーザー名',

  // 演算
  'operator_add': '○+○',
  'operator_subtract': '○-○',
  'operator_multiply': '○×○',
  'operator_divide': '○÷○',
  'operator_random': '○から○までの乱数',
  'operator_gt': '○>○',
  'operator_lt': '○<○',
  'operator_equals': '○=○',
  'operator_and': '○かつ○',
  'operator_or': '○または○',
  'operator_not': '○ではない',
  'operator_join': '○と○',
  'operator_letter_of': '○の○番目の文字',
  'operator_length': '○の長さ',
  'operator_contains': '○に○が含まれる',
  'operator_mod': '○を○で割った余り',
  'operator_round': '○を四捨五入',
  'operator_mathop': '○の○',

  // データ
  'data_setvariableto': '○を○にする',
  'data_changevariableby': '○を○ずつ変える',
  'data_hidevariable': '○を隠す',
  'data_showvariable': '○を表示する',
  'data_addtolist': '○を○に追加する',
  'data_deleteoflist': '○の○番目を削除する',
  'data_deletealloflist': '○をすべて削除する',
  'data_insertatlist': '○を○の○番目に挿入する',
  'data_replaceitemoflist': '○の○番目を○で置き換える',
  'data_itemoflist': '○の○番目',
  'data_itemnumoflist': '○の中の○の位置',
  'data_lengthoflist': '○の長さ',
  'data_listcontainsitem': '○に○が含まれる',
  'data_showlist': '○を表示する',
  'data_hidelist': '○を隠す',

  // ペン
  'pen_penDown': 'ペンを下ろす',
  'pen_penUp': 'ペンを上げる',
  'pen_clear': '消す',
  'pen_stamp': 'スタンプ',
  'pen_setPenColorToColor': 'ペンの色を○にする',
  'pen_changePenColorParamBy': 'ペンの○を○ずつ変える',
  'pen_setPenColorParamTo': 'ペンの○を○にする',
  'pen_changePenSizeBy': 'ペンの太さを○ずつ変える',
  'pen_setPenSizeTo': 'ペンの太さを○にする',

  // 音楽拡張
  'music_playDrumForBeats': '○の音を○拍鳴らす',
  'music_restForBeats': '○拍休む',
  'music_playNoteForBeats': '○の音符を○拍鳴らす',
  'music_setInstrument': '楽器を○にする',
  'music_setTempo': 'テンポを○にする',
  'music_changeTempo': 'テンポを○ずつ変える'
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
 * プログラムから特定のブロックを検索（値は後で別途チェック）
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
          // opcodeだけで検索（値のチェックはせず、全て返す）
          found.push(block);
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
        // opcodeだけで検索（値のチェックはせず、全て返す）
        found.push(block);
      }

      // 再帰的にサブスタックを検索
      if (block.substack) {
        searchInSubstack(block.substack, opcode, inputs, found);
      }
    }
  }
}

/**
 * 入力値が一致するかチェック（詳細情報を返す）
 * @returns {object} { exactMatch: boolean, closeMatch: boolean, details: array }
 */
function checkInputMatch(actualInputs, expectedInputs) {
  const result = {
    exactMatch: true,
    closeMatch: true,
    details: []
  };

  for (const [key, expectedValue] of Object.entries(expectedInputs)) {
    const actualValue = actualInputs[key];

    // 数値の場合
    if (typeof expectedValue === 'number' && typeof actualValue === 'number') {
      const diff = Math.abs(actualValue - expectedValue);
      const tolerance = Math.abs(expectedValue) * 0.1; // ±10%

      if (diff === 0) {
        // 完全一致
        result.details.push({
          key,
          status: 'exact',
          expected: expectedValue,
          actual: actualValue
        });
      } else if (diff <= tolerance) {
        // 許容範囲内（近い値）
        result.exactMatch = false;
        result.details.push({
          key,
          status: 'close',
          expected: expectedValue,
          actual: actualValue,
          diff: diff
        });
      } else {
        // 許容範囲外（大幅に違う）
        result.exactMatch = false;
        result.closeMatch = false;
        result.details.push({
          key,
          status: 'wrong',
          expected: expectedValue,
          actual: actualValue,
          diff: diff
        });
      }
    } else if (actualValue === expectedValue) {
      // 文字列等の完全一致
      result.details.push({
        key,
        status: 'exact',
        expected: expectedValue,
        actual: actualValue
      });
    } else {
      // 不一致
      result.exactMatch = false;
      result.closeMatch = false;
      result.details.push({
        key,
        status: 'wrong',
        expected: expectedValue,
        actual: actualValue
      });
    }
  }

  return result;
}

/**
 * ブロック要件をチェック（改善版：ブロックの存在と値を分離してチェック）
 */
function checkBlockRequirements(program, requiredBlocks) {
  const results = [];

  for (const requirement of requiredBlocks) {
    // Step 1: opcodeだけでブロックを検索
    const foundBlocks = findBlocks(program, requirement.opcode);

    const result = {
      requirement,
      found: foundBlocks,
      passed: false,
      score: 0,
      feedback: null
    };

    // Step 2: ブロックが見つからない場合
    if (foundBlocks.length === 0) {
      result.feedback = `「${requirement.label}」ブロックがありません`;
      results.push(result);
      continue;
    }

    // Step 3: ブロックは見つかった。値をチェック
    const hasInputs = Object.keys(requirement.inputs).length > 0;

    if (!hasInputs) {
      // 値のチェックが不要な場合（例: 表示する、隠す など）
      if (foundBlocks.length === requirement.count) {
        result.passed = true;
        result.score = requirement.points;
      } else if (foundBlocks.length < requirement.count) {
        result.score = Math.round(requirement.points * 0.5);
        result.feedback = `「${requirement.label}」ブロックが${foundBlocks.length}個ありますが、${requirement.count}個必要です`;
      } else {
        result.score = Math.round(requirement.points * 0.8);
        result.feedback = `「${requirement.label}」ブロックが${foundBlocks.length}個ありますが、${requirement.count}個で十分です（余分なブロック）`;
      }
    } else {
      // 値のチェックが必要な場合
      let bestMatch = null;
      let bestMatchScore = -1;

      // 各ブロックの値をチェックして、最も一致度が高いものを選ぶ
      for (const block of foundBlocks) {
        const matchResult = checkInputMatch(block.inputs, requirement.inputs);

        if (matchResult.exactMatch) {
          bestMatch = { block, matchResult, score: 1.0 };
          break; // 完全一致が見つかったら終了
        } else if (matchResult.closeMatch && bestMatchScore < 0.8) {
          bestMatch = { block, matchResult, score: 0.8 };
          bestMatchScore = 0.8;
        } else if (!bestMatch || (bestMatchScore < 0.3)) {
          bestMatch = { block, matchResult, score: 0.3 };
          bestMatchScore = 0.3;
        }
      }

      if (bestMatch) {
        if (bestMatch.matchResult.exactMatch) {
          // 完全一致
          result.passed = true;
          result.score = requirement.points;
        } else if (bestMatch.matchResult.closeMatch) {
          // 近い値
          result.score = Math.round(requirement.points * 0.8);

          const wrongDetails = bestMatch.matchResult.details
            .filter(d => d.status === 'close')
            .map(d => `${getInputLabel(d.key)}の値が少し違います（正解: ${d.expected}、あなた: ${d.actual}）`)
            .join('、');

          result.feedback = `「${requirement.label}」ブロックはありますが、${wrongDetails}`;
        } else {
          // 値が大幅に違う
          result.score = Math.round(requirement.points * 0.3);

          const wrongDetails = bestMatch.matchResult.details
            .filter(d => d.status === 'wrong')
            .map(d => `${getInputLabel(d.key)}の値が間違っています（正解: ${d.expected}、あなた: ${d.actual}）`)
            .join('、');

          result.feedback = `「${requirement.label}」ブロックはありますが、${wrongDetails}`;
        }
      }
    }

    results.push(result);
  }

  return results;
}

/**
 * 入力パラメータの名前をわかりやすく表示
 */
function getInputLabel(inputKey) {
  const labels = {
    'STEPS': '歩数',
    'DEGREES': '角度',
    'X': 'x座標',
    'Y': 'y座標',
    'SECS': '秒数',
    'MESSAGE': 'メッセージ',
    'TIMES': '回数',
    'VALUE': '値',
    'DURATION': '長さ',
    'VOLUME': '音量',
    'SIZE': '大きさ',
    'CHANGE': '変化量'
  };

  return labels[inputKey] || inputKey;
}

// ========================================
// 5. 余分なブロック・変数の検出
// ========================================

/**
 * 全ブロックを収集
 */
function collectAllBlocks(program) {
  const allBlocks = [];

  for (const sprite of program.sprites) {
    for (const script of sprite.scripts) {
      // イベントブロック
      if (script.eventBlock) {
        allBlocks.push({
          opcode: script.eventBlock.type,
          category: getBlockCategory(script.eventBlock.type),
          label: getBlockLabel(script.eventBlock.type)
        });
      }

      // 通常のブロック
      for (const block of script.blocks) {
        allBlocks.push({
          opcode: block.opcode,
          category: getBlockCategory(block.opcode),
          label: getBlockLabel(block.opcode)
        });

        // サブスタック内も収集
        collectBlocksFromSubstack(block.substack, allBlocks);
      }
    }
  }

  return allBlocks;
}

/**
 * サブスタック内のブロックを収集
 */
function collectBlocksFromSubstack(substack, allBlocks) {
  for (const [key, blocks] of Object.entries(substack)) {
    for (const block of blocks) {
      allBlocks.push({
        opcode: block.opcode,
        category: getBlockCategory(block.opcode),
        label: getBlockLabel(block.opcode)
      });

      // 再帰的にサブスタックを収集
      if (block.substack) {
        collectBlocksFromSubstack(block.substack, allBlocks);
      }
    }
  }
}

/**
 * 余分なブロックを検出
 */
function detectExtraBlocks(submittedProgram, correctProgram) {
  const submittedBlocks = collectAllBlocks(submittedProgram);
  const correctBlocks = collectAllBlocks(correctProgram);

  // 正解に含まれるブロックのopcodeをカウント
  const correctBlockCounts = {};
  for (const block of correctBlocks) {
    correctBlockCounts[block.opcode] = (correctBlockCounts[block.opcode] || 0) + 1;
  }

  // 提出されたブロックをカウント
  const submittedBlockCounts = {};
  for (const block of submittedBlocks) {
    submittedBlockCounts[block.opcode] = (submittedBlockCounts[block.opcode] || 0) + 1;
  }

  // 余分なブロックを検出
  const extraBlocks = [];
  for (const [opcode, count] of Object.entries(submittedBlockCounts)) {
    const correctCount = correctBlockCounts[opcode] || 0;
    if (count > correctCount) {
      extraBlocks.push({
        opcode,
        label: getBlockLabel(opcode),
        category: getBlockCategory(opcode),
        extraCount: count - correctCount
      });
    }
  }

  return extraBlocks;
}

/**
 * 余分な変数を検出
 */
function detectExtraVariables(submittedProgram, correctProgram) {
  const submittedVars = new Set();
  const correctVars = new Set();

  // 正解の変数を収集
  for (const sprite of correctProgram.sprites) {
    for (const varKey of Object.keys(sprite.variables)) {
      correctVars.add(varKey);
    }
  }

  // 提出された変数を収集
  for (const sprite of submittedProgram.sprites) {
    for (const varKey of Object.keys(sprite.variables)) {
      submittedVars.add(varKey);
    }
  }

  // 余分な変数
  const extraVars = [];
  for (const varKey of submittedVars) {
    if (!correctVars.has(varKey)) {
      extraVars.push(varKey);
    }
  }

  return extraVars;
}

// ========================================
// 6. 順序制約のチェック
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
 * フィードバックを生成（見やすさ重視版 - 複雑な問題でも分かりやすく）
 */
function generateFeedback(blockResults, orderResults, score, extraBlocks = [], extraVars = []) {
  const allDetails = [];
  const allHints = [];

  // エラーの優先度を定義
  const PRIORITY = {
    CRITICAL: 3,  // ブロックが完全に欠けている
    HIGH: 2,      // 値が大幅に間違っている
    MEDIUM: 1,    // 値が少し違う、余分な要素
    SUCCESS: 0    // 成功
  };

  // ブロック要件のフィードバック収集
  for (const result of blockResults) {
    if (result.passed) {
      allDetails.push({
        type: 'success',
        icon: '✓',
        message: `「${result.requirement.label}」ブロックがあります`,
        priority: PRIORITY.SUCCESS,
        category: result.requirement.category
      });
    } else if (result.score > 0) {
      // 値が間違っているが、ブロックはある
      const priority = result.score >= 50 ? PRIORITY.MEDIUM : PRIORITY.HIGH;
      allDetails.push({
        type: 'warning',
        icon: '△',
        message: result.feedback,
        priority: priority,
        category: result.requirement.category
      });

      // ヒント生成
      allHints.push({
        message: `「${result.requirement.category}」カテゴリを確認してください`,
        priority: priority,
        category: result.requirement.category
      });
    } else {
      // ブロックが完全に欠けている
      allDetails.push({
        type: 'error',
        icon: '✗',
        message: result.feedback,
        priority: PRIORITY.CRITICAL,
        category: result.requirement.category
      });

      // 具体的なヒント
      allHints.push({
        message: `「${result.requirement.category}」カテゴリから「${result.requirement.label}」ブロックを追加してみましょう`,
        priority: PRIORITY.CRITICAL,
        category: result.requirement.category
      });
    }
  }

  // 順序制約のフィードバック
  let orderCorrectCount = 0;
  for (const result of orderResults) {
    if (result.passed) {
      orderCorrectCount++;
    } else if (result.feedback) {
      allDetails.push({
        type: 'error',
        icon: '✗',
        message: result.feedback,
        priority: PRIORITY.HIGH,
        category: '順序'
      });

      allHints.push({
        message: 'ブロックを正しい順番に並べ替えてみましょう',
        priority: PRIORITY.HIGH,
        category: '順序'
      });
    }
  }

  // 順序が全て正しい場合
  if (orderResults.length > 0 && orderCorrectCount === orderResults.length) {
    allDetails.push({
      type: 'success',
      icon: '✓',
      message: 'ブロックの順序が正しいです',
      priority: PRIORITY.SUCCESS,
      category: '順序'
    });
  }

  // 余分なブロックの警告
  if (extraBlocks.length > 0) {
    // 余分なブロックが多い場合はまとめる
    if (extraBlocks.length <= 2) {
      for (const extra of extraBlocks) {
        allDetails.push({
          type: 'warning',
          icon: '⚠',
          message: `余分な「${extra.label}」ブロックが${extra.extraCount}個含まれています`,
          priority: PRIORITY.MEDIUM,
          category: '余分な要素'
        });
      }
    } else {
      // 3個以上の場合はまとめて表示
      const totalExtra = extraBlocks.reduce((sum, b) => sum + b.extraCount, 0);
      allDetails.push({
        type: 'warning',
        icon: '⚠',
        message: `余分なブロックが${totalExtra}個含まれています`,
        priority: PRIORITY.MEDIUM,
        category: '余分な要素'
      });
    }

    allHints.push({
      message: '不要なブロックを削除すると、よりシンプルになります',
      priority: PRIORITY.MEDIUM,
      category: '余分な要素'
    });
  }

  // 余分な変数の警告
  if (extraVars.length > 0) {
    allDetails.push({
      type: 'warning',
      icon: '⚠',
      message: `余分な変数が${extraVars.length}個含まれています`,
      priority: PRIORITY.MEDIUM,
      category: '余分な要素'
    });

    allHints.push({
      message: '不要な変数を削除してください',
      priority: PRIORITY.MEDIUM,
      category: '余分な要素'
    });
  }

  // エラーと警告のみを優先度順にソート（成功メッセージは表示しない）
  const errorsAndWarnings = allDetails.filter(d => d.type !== 'success');

  errorsAndWarnings.sort((a, b) => b.priority - a.priority);

  // 詳細メッセージを構築（すべてのエラーと警告を表示）
  const details = [...errorsAndWarnings];

  // スコアが高い場合（90-99点）で、エラーが少ない場合は励ましのメッセージを追加
  if (score >= 90 && score < 100 && errorsAndWarnings.length <= 2 && errorsAndWarnings.length > 0) {
    details.unshift({
      type: 'info',
      icon: '👍',
      message: 'ほとんどのブロックが正しいです！あと少しで完璧です'
    });
  }

  // ヒントを優先度順にソート、重複を削除、最大3個まで
  const uniqueHints = [];
  const seenMessages = new Set();

  allHints.sort((a, b) => b.priority - a.priority);

  for (const hint of allHints) {
    if (!seenMessages.has(hint.message) && uniqueHints.length < 3) {
      uniqueHints.push(hint.message);
      seenMessages.add(hint.message);
    }
  }

  // カテゴリ別サマリーを生成（エラーが3個以上ある場合）
  let categorySummary = null;
  if (errorsAndWarnings.length >= 3) {
    const categoryCount = {};
    for (const detail of errorsAndWarnings) {
      if (detail.category) {
        categoryCount[detail.category] = (categoryCount[detail.category] || 0) + 1;
      }
    }

    const sortedCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);  // 最大3カテゴリまで表示

    if (sortedCategories.length > 0) {
      categorySummary = '問題の多いカテゴリ: ' +
        sortedCategories.map(([cat, count]) => `${cat}(${count}個)`).join('、');
    }
  }

  // サマリー生成（カテゴリサマリーも含める）
  let summary;
  if (score === 100) {
    summary = '完璧です！プログラムが正解と完全に一致しています。';
  } else if (score >= 90) {
    summary = '素晴らしい！ほぼ完璧です。';
    if (categorySummary) {
      summary += ` ${categorySummary}`;
    }
  } else if (score >= 85) {
    summary = 'あともう少しで完璧です！';
    if (categorySummary) {
      summary += ` ${categorySummary}`;
    }
  } else if (score >= 80) {
    summary = '正解です！よくできました。';
    if (categorySummary) {
      summary += ` ${categorySummary}`;
    }
  } else if (score >= 70) {
    summary = 'いい感じです！もう少し頑張りましょう。';
    if (categorySummary) {
      summary += ` ${categorySummary}`;
    }
  } else if (score >= 60) {
    summary = 'あと少しで正解です！もう一息です。';
    if (categorySummary) {
      summary += ` ${categorySummary}`;
    }
  } else if (score >= 40) {
    summary = 'まだいくつか修正が必要です。';
    if (categorySummary) {
      summary += ` ${categorySummary}`;
    }
  } else {
    summary = 'もう一度確認してみましょう。';
    if (categorySummary) {
      summary += ` ${categorySummary}`;
    }
  }

  return {
    summary,
    details,
    hints: uniqueHints  // 優先度順、重複削除、最大3個
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

  // Step 7: 余分なブロック・変数を検出
  const extraBlocks = detectExtraBlocks(normalizedSubmitted, normalizedCorrect);
  const extraVars = detectExtraVariables(normalizedSubmitted, normalizedCorrect);

  console.log('=== Extra Elements Detection ===');
  console.log('Extra blocks:', extraBlocks);
  console.log('Extra variables:', extraVars);
  console.log('================================');

  // Step 8: スコア計算
  const score = calculateScore(blockResults, orderResults);

  // Step 9: フィードバック生成（余分なブロック・変数の情報を含む）
  const feedback = generateFeedback(blockResults, orderResults, score, extraBlocks, extraVars);

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
