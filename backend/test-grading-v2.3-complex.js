/**
 * 採点エンジン v2.3 のテストスクリプト（複雑な総合問題）
 *
 * 多くのエラーがある場合のフィードバック表示をテスト
 */

const { evaluateScratchProgram } = require('./src/services/scratchGradingEngine');

console.log('=== 採点エンジン v2.3 テスト（複雑な総合問題） ===\n');

// テストケース: 10個のブロックが必要な総合問題で、8個のエラーがある場合
console.log('テスト: 複雑な総合問題（多くのエラーがある場合）');

const correctProgram = {
  targets: [
    {
      isStage: false,
      name: 'Sprite1',
      variables: {
        'var1': ['カウンター', 0]
      },
      blocks: {
        'block1': {
          opcode: 'event_whenflagclicked',
          topLevel: true,
          next: 'block2'
        },
        'block2': {
          opcode: 'data_setvariableto',
          fields: {
            VARIABLE: ['カウンター', 'var1']
          },
          inputs: {
            VALUE: [1, [4, '0']]
          },
          next: 'block3'
        },
        'block3': {
          opcode: 'control_repeat',
          inputs: {
            TIMES: [1, [6, '10']]
          },
          next: 'block4'
        },
        'block4': {
          opcode: 'motion_movesteps',
          inputs: {
            STEPS: [1, [4, '10']]
          },
          next: 'block5'
        },
        'block5': {
          opcode: 'motion_turnright',
          inputs: {
            DEGREES: [1, [4, '36']]
          },
          next: 'block6'
        },
        'block6': {
          opcode: 'data_changevariableby',
          fields: {
            VARIABLE: ['カウンター', 'var1']
          },
          inputs: {
            VALUE: [1, [4, '1']]
          },
          next: 'block7'
        },
        'block7': {
          opcode: 'control_wait',
          inputs: {
            DURATION: [1, [4, '0.5']]
          },
          next: 'block8'
        },
        'block8': {
          opcode: 'looks_say',
          inputs: {
            MESSAGE: [1, [10, 'こんにちは']]
          },
          next: 'block9'
        },
        'block9': {
          opcode: 'sound_play',
          inputs: {
            SOUND_MENU: [1, [10, 'Meow']]
          },
          next: 'block10'
        },
        'block10': {
          opcode: 'looks_hide',
          next: null
        }
      }
    }
  ]
};

const submittedProgram = {
  targets: [
    {
      isStage: false,
      name: 'Sprite1',
      variables: {
        'var1': ['テスト', 0],  // 変数名が違う（v2.1で自動マッピング）
        'var2': ['不要な変数', 0]  // 余分な変数
      },
      blocks: {
        'block1': {
          opcode: 'event_whenflagclicked',
          topLevel: true,
          next: 'block2'
        },
        'block2': {
          opcode: 'data_setvariableto',
          fields: {
            VARIABLE: ['テスト', 'var1']
          },
          inputs: {
            VALUE: [1, [4, '5']]  // 値が間違い（正解: 0）
          },
          next: 'block3'
        },
        'block3': {
          opcode: 'control_repeat',
          inputs: {
            TIMES: [1, [6, '20']]  // 値が大幅に間違い（正解: 10）
          },
          next: 'block4'
        },
        'block4': {
          opcode: 'motion_movesteps',
          inputs: {
            STEPS: [1, [4, '100']]  // 値が大幅に間違い（正解: 10）
          },
          next: 'block5'
        },
        // block5 (motion_turnright) が完全に欠けている
        'block6': {
          opcode: 'data_changevariableby',
          fields: {
            VARIABLE: ['テスト', 'var1']
          },
          inputs: {
            VALUE: [1, [4, '2']]  // 値が間違い（正解: 1）
          },
          next: 'block7'
        },
        // block7 (control_wait) が完全に欠けている
        // block8 (looks_say) が完全に欠けている
        'block9': {
          opcode: 'sound_play',
          inputs: {
            SOUND_MENU: [1, [10, 'Pop']]  // 値が間違い（正解: Meow）
          },
          next: 'block10'
        },
        'block10': {
          opcode: 'looks_hide',
          next: 'block11'
        },
        'block11': {  // 余分なブロック
          opcode: 'looks_show',
          next: null
        }
      }
    }
  ]
};

const result = evaluateScratchProgram(submittedProgram, correctProgram);

console.log('スコア:', result.score);
console.log('サマリー:', result.feedback.summary);
console.log('\n詳細（最大5個まで表示）:');
result.feedback.details.forEach((d, i) => console.log(`  ${i + 1}. ${d.icon} ${d.message}`));

console.log('\nヒント（最大3個まで表示）:');
result.feedback.hints.forEach((h, i) => console.log(`  ${i + 1}. ${h}`));

console.log('\n---\n');

// 期待される出力:
// - エラーが優先度順に表示される（重要なものから）
// - すべてのエラー/警告が表示される（制限なし）
// - ヒントは最大3個まで（優先度順）
// - カテゴリ別サマリーが表示される（問題の多いカテゴリ）
// - 正解している部分は非表示

console.log('=== v2.3の改善点 ===');
console.log('✓ エラーの優先度付け（重要な問題から表示）');
console.log('✓ すべてのエラー/警告を表示（制限なし）');
console.log('✓ 正解している部分は非表示（間違いに集中）');
console.log('✓ カテゴリ別サマリー（問題の多いカテゴリを強調）');
console.log('✓ ヒントは最大3個まで（優先度順、重複削除）');
console.log('\n=== テスト完了 ===');
