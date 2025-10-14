const pool = require('../config/database');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('Seeding database...');

    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO admins (admin_username, password_hash)
      VALUES ('admin', $1)
      ON CONFLICT (admin_username) DO NOTHING
    `, [adminPassword]);
    console.log('✓ Admin user created (username: admin, password: admin123)');

    // Create Chapter 1
    const chapterResult = await client.query(`
      INSERT INTO chapters (title, description, order_number)
      VALUES ('Chapter 1: 順次処理 - 命令を順番に実行しよう', 'この章では、プログラミングの基本となる「順次処理」について学んでいきます。
問題を解きながら、少しずつ理解していきましょう!', 1)
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    const chapterId = chapterResult.rows[0]?.id;

    if (!chapterId) {
      console.log('Chapter already exists, skipping problem seeding');
      return;
    }

    console.log('✓ Chapter 1 created');

    // Create 4 sample problems for Chapter 1
    const problems = [
      {
        type: 'fill_blank',
        title: '問題1: ネコを歩かせよう',
        description: 'プログラミングの基本は「命令を順番に実行すること」です。\nプログラムは基本上から順に実行されるため、順番はとても重要です。実際に問題を解いて確認してみましょう\nネコを右に50歩動かす→こんにちは!と2秒言う→100歩動かす。プログラムを完成させましょう。\n\nプログラムは「緑の旗がクリックされたとき」から始まり、その下に繋げたブロックが上から順番に実行されます。\n\nヒント:「◯歩動かす」ブロックを探して中に数字を入れてみましょう。',
        difficulty: 1,
        order: 1,
        initial_sb3_data: {
          targets: [
            {
              isStage: true,
              name: "Stage",
              variables: {},
              lists: {},
              broadcasts: {},
              blocks: {},
              comments: {},
              currentCostume: 0,
              costumes: [
                {
                  name: "背景1",
                  dataFormat: "svg",
                  assetId: "cd21514d0531fdffb22204e0ec5ed84a",
                  md5ext: "cd21514d0531fdffb22204e0ec5ed84a.svg",
                  rotationCenterX: 240,
                  rotationCenterY: 180
                }
              ],
              sounds: [],
              volume: 100,
              layerOrder: 0,
              tempo: 60,
              videoTransparency: 50,
              videoState: "on",
              textToSpeechLanguage: null
            },
            {
              isStage: false,
              name: "スプライト1",
              variables: {},
              lists: {},
              broadcasts: {},
              blocks: {},
              comments: {},
              currentCostume: 0,
              costumes: [
                {
                  name: "コスチューム1",
                  bitmapResolution: 1,
                  dataFormat: "svg",
                  assetId: "bcf454acf82e4504149f7ffe07081dbc",
                  md5ext: "bcf454acf82e4504149f7ffe07081dbc.svg",
                  rotationCenterX: 48,
                  rotationCenterY: 50
                }
              ],
              sounds: [],
              volume: 100,
              layerOrder: 1,
              visible: true,
              x: 0,
              y: 0,
              size: 100,
              direction: 90,
              draggable: false,
              rotationStyle: "all around"
            }
          ],
          monitors: [],
          extensions: [],
          meta: {
            semver: "3.0.0",
            vm: "11.5.0",
            agent: "Scratch Learning System"
          }
        },
        correct_sb3_data: {
          targets: [
            {
              isStage: true,
              name: "Stage",
              variables: {},
              lists: {},
              broadcasts: {},
              blocks: {},
              comments: {},
              currentCostume: 0,
              costumes: [
                {
                  name: "背景1",
                  dataFormat: "svg",
                  assetId: "cd21514d0531fdffb22204e0ec5ed84a",
                  md5ext: "cd21514d0531fdffb22204e0ec5ed84a.svg",
                  rotationCenterX: 240,
                  rotationCenterY: 180
                }
              ],
              sounds: [],
              volume: 100,
              layerOrder: 0,
              tempo: 60,
              videoTransparency: 50,
              videoState: "on",
              textToSpeechLanguage: null
            },
            {
              isStage: false,
              name: "スプライト1",
              variables: {},
              lists: {},
              broadcasts: {},
              blocks: {
                "EZH38brF[+vAS#i|:4i+": {
                  opcode: "motion_movesteps",
                  next: null,
                  parent: "[9r^[`3d`]HD7:#@O=BX",
                  inputs: {
                    STEPS: [1, [4, "10"]]
                  },
                  fields: {},
                  shadow: false,
                  topLevel: false
                },
                "[9r^[`3d`]HD7:#@O=BX": {
                  opcode: "event_whenflagclicked",
                  next: "EZH38brF[+vAS#i|:4i+",
                  parent: null,
                  inputs: {},
                  fields: {},
                  shadow: false,
                  topLevel: true,
                  x: 136,
                  y: 197
                }
              },
              comments: {},
              currentCostume: 0,
              costumes: [
                {
                  name: "コスチューム1",
                  bitmapResolution: 1,
                  dataFormat: "svg",
                  assetId: "bcf454acf82e4504149f7ffe07081dbc",
                  md5ext: "bcf454acf82e4504149f7ffe07081dbc.svg",
                  rotationCenterX: 48,
                  rotationCenterY: 50
                }
              ],
              sounds: [],
              volume: 100,
              layerOrder: 1,
              visible: true,
              x: 0,
              y: 0,
              size: 100,
              direction: 90,
              draggable: false,
              rotationStyle: "all around"
            }
          ],
          monitors: [],
          extensions: [],
          meta: {
            semver: "3.0.0",
            vm: "11.5.0",
            agent: "Scratch Learning System"
          }
        }
      },
      {
        type: 'predict',
        title: '問題2: ネコはどこかな?',
        description: '問１で学んだように上から順にプログラムが実行されることを順次処理と言います。\n順次処理は実生活でもよく使われています。\n例えば、カレー作り(火を付ける→野菜を炒める→水を入れる→ルーを入れる)も順次処理です。\n順番を守ることはとても大切ですね!\n\nプログラムがどう動くか予測してみましょう!\nネコが最終的にどこにいるか計算してください。\nヒント: xというのは平面や空間上での横の位置、yというのは縦の位置を表します。\nx座標(横位置)とy座標(縦位置)をそれぞれで計算してみましょう。',
        difficulty: 2,
        order: 2,
        correctAnswerX: 30,
        correctAnswerY: 0,
        initial_sb3_data: {
          targets: [{
            isStage: false,
            name: "Sprite1",
            blocks: {
              "block1": {
                opcode: "event_whenflagclicked",
                next: "block2",
                parent: null,
                inputs: {},
                fields: {},
                topLevel: true
              },
              "block2": {
                opcode: "motion_movesteps",
                next: "block3",
                parent: "block1",
                inputs: {
                  STEPS: [1, [4, "10"]]
                },
                fields: {}
              },
              "block3": {
                opcode: "motion_movesteps",
                next: "block4",
                parent: "block2",
                inputs: {
                  STEPS: [1, [4, "5"]]
                },
                fields: {}
              },
              "block4": {
                opcode: "motion_movesteps",
                next: null,
                parent: "block3",
                inputs: {
                  STEPS: [1, [4, "15"]]
                },
                fields: {}
              }
            },
            currentCostume: 0,
            costumes: [{ name: "costume1", assetId: "default" }],
            sounds: [],
            volume: 100,
            x: 0,
            y: 0
          }]
        },
        correct_sb3_data: {
          targets: [{
            isStage: false,
            name: "Sprite1",
            blocks: {
              "answer": {
                opcode: "looks_say",
                next: null,
                parent: null,
                inputs: {
                  MESSAGE: [1, [10, "30"]]
                },
                fields: {},
                topLevel: true
              }
            },
            currentCostume: 0,
            costumes: [{ name: "costume1", assetId: "default" }],
            sounds: [],
            volume: 100,
            x: 30,
            y: 0
          }]
        }
      },
      {
        type: 'find_error',
        title: '問題3: 準備の順番が間違っているよ!',
        description: 'プログラムでは「順番を間違えると、思った通りに動かない」ことがよくあります。\n料理のレシピと同じで、順番が大切なんです。\n\n例えば、カレーを作るとき:\n正しい順番: 野菜を切る → 炒める → 水を入れる → ルーを入れる\n間違った順番: ルーを入れる → 野菜を切る → ... (うまくいきませんね!)\n\nこのプログラムには順番の間違いがあります。見つけて直しましょう!\nネコが右に歩いてから１秒立ち止まり、背景をPartyに変更して、こんにちはと言うように直してください。\nヒント: 問題文の順序通りになるように整理しましょう。',
        difficulty: 3,
        order: 3,
        initial_sb3_data: {
          targets: [{
            isStage: false,
            name: "Sprite1",
            blocks: {
              "block1": {
                opcode: "event_whenflagclicked",
                next: "block2",
                parent: null,
                inputs: {},
                fields: {},
                topLevel: true
              },
              "block2": {
                opcode: "motion_movesteps",
                next: "block3",
                parent: "block1",
                inputs: {
                  STEPS: [1, [4, "10"]]
                },
                fields: {}
              },
              "block3": {
                opcode: "looks_say",
                next: null,
                parent: "block2",
                inputs: {
                  MESSAGE: [1, [10, "おはよう!"]]
                },
                fields: {}
              }
            },
            currentCostume: 0,
            costumes: [{ name: "costume1", assetId: "default" }],
            sounds: [],
            volume: 100,
            x: 0,
            y: 0
          }]
        },
        correct_sb3_data: {
          targets: [{
            isStage: false,
            name: "Sprite1",
            blocks: {
              "block1": {
                opcode: "event_whenflagclicked",
                next: "block2",
                parent: null,
                inputs: {},
                fields: {},
                topLevel: true
              },
              "block2": {
                opcode: "looks_say",
                next: "block3",
                parent: "block1",
                inputs: {
                  MESSAGE: [1, [10, "おはよう!"]]
                },
                fields: {}
              },
              "block3": {
                opcode: "motion_movesteps",
                next: null,
                parent: "block2",
                inputs: {
                  STEPS: [1, [4, "10"]]
                },
                fields: {}
              }
            },
            currentCostume: 0,
            costumes: [{ name: "costume1", assetId: "default" }],
            sounds: [],
            volume: 100,
            x: 0,
            y: 0
          }]
        }
      },
      {
        type: 'mission',
        title: '問題4: 階段を登るプログラムを作ろう',
        description: '階段を登るプログラムを作りましょう!\n「右に100歩 → 上に80歩」の動きを繰り返して、階段を登ります。\n\n今回は繰り返しブロックを使わず、既に用意されているブロックを並べて階段を登ろう。\n順次処理でも、同じ命令を何度も並べれば繰り返しを表現できます。\n\nヒント: １秒待つは移動するたびに使いましょう。\n右 → 上 → 右 → 上 → 右 → 上 → 右の順番です。',
        difficulty: 4,
        order: 4,
        initial_sb3_data: {
          targets: [{
            isStage: false,
            name: "Sprite1",
            blocks: {},
            currentCostume: 0,
            costumes: [{ name: "costume1", assetId: "default" }],
            sounds: [],
            volume: 100,
            x: 0,
            y: 0
          }]
        },
        correct_sb3_data: {
          targets: [{
            isStage: false,
            name: "Sprite1",
            blocks: {
              "block1": {
                opcode: "event_whenflagclicked",
                next: "block2",
                parent: null,
                inputs: {},
                fields: {},
                topLevel: true
              },
              "block2": {
                opcode: "motion_changexby",
                next: "block3",
                parent: "block1",
                inputs: {
                  DX: [1, [4, "10"]]
                },
                fields: {}
              },
              "block3": {
                opcode: "motion_changeyby",
                next: "block4",
                parent: "block2",
                inputs: {
                  DY: [1, [4, "10"]]
                },
                fields: {}
              },
              "block4": {
                opcode: "motion_changexby",
                next: "block5",
                parent: "block3",
                inputs: {
                  DX: [1, [4, "10"]]
                },
                fields: {}
              },
              "block5": {
                opcode: "motion_changeyby",
                next: "block6",
                parent: "block4",
                inputs: {
                  DY: [1, [4, "10"]]
                },
                fields: {}
              },
              "block6": {
                opcode: "motion_changexby",
                next: "block7",
                parent: "block5",
                inputs: {
                  DX: [1, [4, "10"]]
                },
                fields: {}
              },
              "block7": {
                opcode: "motion_changeyby",
                next: null,
                parent: "block6",
                inputs: {
                  DY: [1, [4, "10"]]
                },
                fields: {}
              }
            },
            currentCostume: 0,
            costumes: [{ name: "costume1", assetId: "default" }],
            sounds: [],
            volume: 100,
            x: 30,
            y: 30
          }]
        }
      }
    ];

    for (const problem of problems) {
      const result = await client.query(`
        INSERT INTO problems (chapter_id, problem_type, title, description, initial_sb3_data, correct_sb3_data, correct_answer_x, correct_answer_y, max_score, difficulty_level, order_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 100, $9, $10)
        RETURNING id
      `, [
        chapterId,
        problem.type,
        problem.title,
        problem.description,
        JSON.stringify(problem.initial_sb3_data),
        JSON.stringify(problem.correct_sb3_data),
        problem.correctAnswerX || null,
        problem.correctAnswerY || null,
        problem.difficulty,
        problem.order
      ]);

      const problemId = result.rows[0].id;
    }

    console.log('✓ 4 problems created');
    console.log('✓ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedDatabase();
