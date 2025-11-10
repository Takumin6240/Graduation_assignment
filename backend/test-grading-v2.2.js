/**
 * 採点エンジン v2.2 のテストスクリプト
 *
 * 以下の改善点をテスト：
 * 1. 全ブロックタイプの値判別
 * 2. 値の誤差判定（大幅な誤りでも「値が間違っている」と指摘）
 * 3. 余分なブロック・変数の検出
 * 4. 点数に応じたメッセージ
 */

const { evaluateScratchProgram } = require('./src/services/scratchGradingEngine');

console.log('=== 採点エンジン v2.2 テスト ===\n');

// テストケース1: 値が大幅に間違っている場合
console.log('テスト1: 値が大幅に間違っている場合');
const correctProgram1 = {
  targets: [
    {
      isStage: false,
      name: 'Sprite1',
      variables: {},
      blocks: {
        'block1': {
          opcode: 'event_whenflagclicked',
          topLevel: true,
          next: 'block2'
        },
        'block2': {
          opcode: 'motion_movesteps',
          inputs: {
            STEPS: [1, [4, '10']]
          },
          next: null
        }
      }
    }
  ]
};

const submittedProgram1 = {
  targets: [
    {
      isStage: false,
      name: 'Sprite1',
      variables: {},
      blocks: {
        'block1': {
          opcode: 'event_whenflagclicked',
          topLevel: true,
          next: 'block2'
        },
        'block2': {
          opcode: 'motion_movesteps',
          inputs: {
            STEPS: [1, [4, '100']]  // 正解は10だが、100になっている
          },
          next: null
        }
      }
    }
  ]
};

const result1 = evaluateScratchProgram(submittedProgram1, correctProgram1);
console.log('スコア:', result1.score);
console.log('サマリー:', result1.feedback.summary);
console.log('詳細:');
result1.feedback.details.forEach(d => console.log(`  ${d.icon} ${d.message}`));
console.log('ヒント:', result1.feedback.hints);
console.log('\n---\n');

// テストケース2: 余分なブロックがある場合
console.log('テスト2: 余分なブロックがある場合');
const correctProgram2 = {
  targets: [
    {
      isStage: false,
      name: 'Sprite1',
      variables: {},
      blocks: {
        'block1': {
          opcode: 'event_whenflagclicked',
          topLevel: true,
          next: 'block2'
        },
        'block2': {
          opcode: 'motion_movesteps',
          inputs: {
            STEPS: [1, [4, '10']]
          },
          next: null
        }
      }
    }
  ]
};

const submittedProgram2 = {
  targets: [
    {
      isStage: false,
      name: 'Sprite1',
      variables: {},
      blocks: {
        'block1': {
          opcode: 'event_whenflagclicked',
          topLevel: true,
          next: 'block2'
        },
        'block2': {
          opcode: 'motion_movesteps',
          inputs: {
            STEPS: [1, [4, '10']]
          },
          next: 'block3'
        },
        'block3': {
          opcode: 'looks_say',
          inputs: {
            MESSAGE: [1, [10, 'こんにちは']]
          },
          next: null
        }
      }
    }
  ]
};

const result2 = evaluateScratchProgram(submittedProgram2, correctProgram2);
console.log('スコア:', result2.score);
console.log('サマリー:', result2.feedback.summary);
console.log('詳細:');
result2.feedback.details.forEach(d => console.log(`  ${d.icon} ${d.message}`));
console.log('ヒント:', result2.feedback.hints);
console.log('\n---\n');

// テストケース3: 85点前後の場合（メッセージ確認）
console.log('テスト3: 85点前後のメッセージ確認（擬似テスト）');
console.log('100点:', '完璧です！プログラムが正解と完全に一致しています。');
console.log('90点:', '素晴らしい！ほぼ完璧です。');
console.log('85点:', 'あともう少しで完璧です！');
console.log('80点:', '正解です！よくできました。');
console.log('70点:', 'いい感じです！もう少し頑張りましょう。');
console.log('\n---\n');

// テストケース4: 制御ブロックの値判別
console.log('テスト4: 制御ブロックの値判別');
const correctProgram4 = {
  targets: [
    {
      isStage: false,
      name: 'Sprite1',
      variables: {},
      blocks: {
        'block1': {
          opcode: 'event_whenflagclicked',
          topLevel: true,
          next: 'block2'
        },
        'block2': {
          opcode: 'control_repeat',
          inputs: {
            TIMES: [1, [6, '10']]  // 10回繰り返す
          },
          next: null
        }
      }
    }
  ]
};

const submittedProgram4 = {
  targets: [
    {
      isStage: false,
      name: 'Sprite1',
      variables: {},
      blocks: {
        'block1': {
          opcode: 'event_whenflagclicked',
          topLevel: true,
          next: 'block2'
        },
        'block2': {
          opcode: 'control_repeat',
          inputs: {
            TIMES: [1, [6, '5']]  // 5回繰り返す（間違い）
          },
          next: null
        }
      }
    }
  ]
};

const result4 = evaluateScratchProgram(submittedProgram4, correctProgram4);
console.log('スコア:', result4.score);
console.log('サマリー:', result4.feedback.summary);
console.log('詳細:');
result4.feedback.details.forEach(d => console.log(`  ${d.icon} ${d.message}`));
console.log('ヒント:', result4.feedback.hints);
console.log('\n---\n');

console.log('=== テスト完了 ===');
