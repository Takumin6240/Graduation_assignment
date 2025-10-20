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
      VALUES ('Chapter 1: <ruby>順次<rt>じゅんじ</rt></ruby><ruby>処理<rt>しょり</rt></ruby> - <ruby>命令<rt>めいれい</rt></ruby>を<ruby>順番<rt>じゅんばん</rt></ruby>に<ruby>実行<rt>じっこう</rt></ruby>しよう', 'この<ruby>章<rt>しょう</rt></ruby>では、プログラミングの<ruby>基本<rt>きほん</rt></ruby>となる「<ruby>順次<rt>じゅんじ</rt></ruby><ruby>処理<rt>しょり</rt></ruby>」について<ruby>学<rt>まな</rt></ruby>んでいきます。
<ruby>問題<rt>もんだい</rt></ruby>を<ruby>解<rt>と</rt></ruby>きながら、<ruby>少<rt>すこ</rt></ruby>しずつ<ruby>理解<rt>りかい</rt></ruby>していきましょう!', 1)
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
        title: '<ruby>問題<rt>もんだい</rt></ruby>1: ネコを<ruby>歩<rt>ある</rt></ruby>かせよう',
        learningObjective: 'プログラミングの<ruby>基本<rt>きほん</rt></ruby>は「<ruby>命令<rt>めいれい</rt></ruby>を<ruby>順番<rt>じゅんばん</rt></ruby>に<ruby>実行<rt>じっこう</rt></ruby>すること」です。\nプログラムは<ruby>基本<rt>きほん</rt></ruby><ruby>上<rt>うえ</rt></ruby>から<ruby>順<rt>じゅん</rt></ruby>に<ruby>実行<rt>じっこう</rt></ruby>されるため、<ruby>順番<rt>じゅんばん</rt></ruby>はとても<ruby>重要<rt>じゅうよう</rt></ruby>です。<ruby>実際<rt>じっさい</rt></ruby>に<ruby>問題<rt>もんだい</rt></ruby>を<ruby>解<rt>と</rt></ruby>いて<ruby>確認<rt>かくにん</rt></ruby>してみましょう。',
        description: 'ネコを<ruby>右<rt>みぎ</rt></ruby>に50<ruby>歩<rt>ほ</rt></ruby>、そして100<ruby>歩<rt>ほ</rt></ruby><ruby>動<rt>うご</rt></ruby>かそう！\n\n「<ruby>緑<rt>みどり</rt></ruby>の<ruby>旗<rt>はた</rt></ruby>がクリックされたとき」から<ruby>始<rt>はじ</rt></ruby>めて、「◯<ruby>歩<rt>ほ</rt></ruby><ruby>動<rt>うご</rt></ruby>かす」というブロックを<ruby>使<rt>つか</rt></ruby>ってね。',
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
        title: '<ruby>問題<rt>もんだい</rt></ruby>2: ネコはどこかな?',
        learningObjective: 'プログラムの<ruby>結果<rt>けっか</rt></ruby>を<ruby>予測<rt>よそく</rt></ruby>することは、プログラミングの<ruby>理解<rt>りかい</rt></ruby>を<ruby>深<rt>ふか</rt></ruby>めるのにとても<ruby>大切<rt>たいせつ</rt></ruby>です。\n<ruby>命令<rt>めいれい</rt></ruby>が<ruby>順番<rt>じゅんばん</rt></ruby>に<ruby>実行<rt>じっこう</rt></ruby>されることで、どんな<ruby>結果<rt>けっか</rt></ruby>になるか<ruby>考<rt>かんが</rt></ruby>えてみましょう。',
        description: 'プログラムを<ruby>見<rt>み</rt></ruby>て、ネコが<ruby>最後<rt>さいご</rt></ruby>にどこにいるか<ruby>考<rt>かんが</rt></ruby>えよう！\n\nX<ruby>座標<rt>ざひょう</rt></ruby>(<ruby>横<rt>よこ</rt></ruby>)とY<ruby>座標<rt>ざひょう</rt></ruby>(<ruby>縦<rt>たて</rt></ruby>)を<ruby>計算<rt>けいさん</rt></ruby>してね。',
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
        title: '<ruby>問題<rt>もんだい</rt></ruby>3: <ruby>順番<rt>じゅんばん</rt></ruby>を<ruby>直<rt>なお</rt></ruby>そう!',
        learningObjective: 'プログラムの<ruby>間違<rt>まちが</rt></ruby>い（バグ）を<ruby>見<rt>み</rt></ruby>つけて<ruby>直<rt>なお</rt></ruby>すことは、プログラマーのとても<ruby>大切<rt>たいせつ</rt></ruby>な<ruby>仕事<rt>しごと</rt></ruby>です。\n<ruby>順番<rt>じゅんばん</rt></ruby>が<ruby>変<rt>か</rt></ruby>わると、<ruby>結果<rt>けっか</rt></ruby>も<ruby>変<rt>か</rt></ruby>わってしまうことを<ruby>学<rt>まな</rt></ruby>びましょう。',
        description: 'プログラムの<ruby>順番<rt>じゅんばん</rt></ruby>が<ruby>間違<rt>まちが</rt></ruby>っています！\n\n<ruby>正<rt>ただ</rt></ruby>しい<ruby>順番<rt>じゅんばん</rt></ruby>:\n1. ネコを<ruby>動<rt>うご</rt></ruby>かす\n2. 1<ruby>秒<rt>びょう</rt></ruby><ruby>待<rt>ま</rt></ruby>つ\n3. こんにちは!と<ruby>言<rt>い</rt></ruby>う',
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
        title: '<ruby>問題<rt>もんだい</rt></ruby>4: <ruby>階段<rt>かいだん</rt></ruby>を<ruby>登<rt>のぼ</rt></ruby>ろう!',
        learningObjective: '<ruby>順次<rt>じゅんじ</rt></ruby><ruby>処理<rt>しょり</rt></ruby>の<ruby>知識<rt>ちしき</rt></ruby>を<ruby>使<rt>つか</rt></ruby>って、<ruby>自由<rt>じゆう</rt></ruby>にプログラムを<ruby>作<rt>つく</rt></ruby>ってみましょう！\n<ruby>複数<rt>ふくすう</rt></ruby>の<ruby>動<rt>うご</rt></ruby>きを<ruby>組<rt>く</rt></ruby>み<ruby>合<rt>あ</rt></ruby>わせることで、もっと<ruby>面白<rt>おもしろ</rt></ruby>いプログラムが<ruby>作<rt>つく</rt></ruby>れます。',
        description: 'ネコが<ruby>階段<rt>かいだん</rt></ruby>を<ruby>登<rt>のぼ</rt></ruby>るプログラムを<ruby>作<rt>つく</rt></ruby>ろう！\n\n<ruby>右<rt>みぎ</rt></ruby>に10<ruby>歩<rt>ほ</rt></ruby> → <ruby>上<rt>うえ</rt></ruby>に10<ruby>歩<rt>ほ</rt></ruby>\nこれを3<ruby>回<rt>かい</rt></ruby><ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>してね！',
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
        INSERT INTO problems (chapter_id, problem_type, title, learning_objective, description, initial_sb3_data, correct_sb3_data, correct_answer_x, correct_answer_y, max_score, difficulty_level, order_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 100, $10, $11)
        RETURNING id
      `, [
        chapterId,
        problem.type,
        problem.title,
        problem.learningObjective || null,
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
