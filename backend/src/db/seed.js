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
      INSERT INTO chapters (title, description, order_number, image_url)
      VALUES ('Chapter 1: <ruby>順次<rt>じゅんじ</rt></ruby><ruby>処理<rt>しょり</rt></ruby> - <ruby>命令<rt>めいれい</rt></ruby>を<ruby>順番<rt>じゅんばん</rt></ruby>に<ruby>実行<rt>じっこう</rt></ruby>しよう', 'この<ruby>章<rt>しょう</rt></ruby>では、プログラミングの<ruby>基本<rt>きほん</rt></ruby>となる「<ruby>順次<rt>じゅんじ</rt></ruby><ruby>処理<rt>しょり</rt></ruby>」について<ruby>学<rt>まな</rt></ruby>んでいきます。
<ruby>問題<rt>もんだい</rt></ruby>を<ruby>解<rt>と</rt></ruby>きながら、<ruby>少<rt>すこ</rt></ruby>しずつ<ruby>理解<rt>りかい</rt></ruby>していきましょう!', 1, '/たまごの殻からコンニチハ！するひよこ.png')
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
        title: '<ruby>問題<rt>もんだい</rt></ruby>1: ひよこを<ruby>歩<rt>ある</rt></ruby>かせよう',
        learningObjective: 'プログラミングの<ruby>基本<rt>きほん</rt></ruby>は<span style="color: #2563eb; font-weight: bold;">「<ruby>命令<rt>めいれい</rt></ruby>を<ruby>順番<rt>じゅんばん</rt></ruby>に<ruby>実行<rt>じっこう</rt></ruby>すること」</span>です。\nプログラムは<ruby>基本<rt>きほん</rt></ruby><span style="color: #dc2626; font-weight: bold;"><ruby>上<rt>うえ</rt></ruby>から<ruby>順<rt>じゅん</rt></ruby>に<ruby>実行<rt>じっこう</rt></ruby>される</span>ため、<span style="color: #2563eb; font-weight: bold;"><ruby>順番<rt>じゅんばん</rt></ruby></span>はとても<ruby>重要<rt>じゅうよう</rt></ruby>です。<ruby>実際<rt>じっさい</rt></ruby>に<ruby>問題<rt>もんだい</rt></ruby>を<ruby>解<rt>と</rt></ruby>いて<ruby>確認<rt>かくにん</rt></ruby>してみましょう。',
        description: 'ひよこを<span style="color: #dc2626; font-weight: bold;"><ruby>右<rt>みぎ</rt></ruby></span>に<span style="color: #ea580c; font-weight: bold;">50<ruby>歩<rt>ほ</rt></ruby></span>、そして<span style="color: #ea580c; font-weight: bold;">100<ruby>歩<rt>ほ</rt></ruby></span><ruby>動<rt>うご</rt></ruby>かそう！\n\n<span style="color: #16a34a; font-weight: bold;">「<ruby>緑<rt>みどり</rt></ruby>の<ruby>旗<rt>はた</rt></ruby>がクリックされたとき」</span>から<ruby>始<rt>はじ</rt></ruby>めて、<span style="color: #2563eb; font-weight: bold;">「◯<ruby>歩<rt>ほ</rt></ruby><ruby>動<rt>うご</rt></ruby>かす」</span>というブロックを<ruby>使<rt>つか</rt></ruby>ってね。',
        difficulty: 1,
        order: 1,
        imageUrl: '/右に向かって走るひよこ.png',
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
        title: '<ruby>問題<rt>もんだい</rt></ruby>2: ひよこはどこかな?',
        learningObjective: 'プログラムの<span style="color: #2563eb; font-weight: bold;"><ruby>結果<rt>けっか</rt></ruby>を<ruby>予測<rt>よそく</rt></ruby>する</span>ことは、プログラミングの<ruby>理解<rt>りかい</rt></ruby>を<ruby>深<rt>ふか</rt></ruby>めるのにとても<ruby>大切<rt>たいせつ</rt></ruby>です。\n<ruby>命令<rt>めいれい</rt></ruby>が<span style="color: #dc2626; font-weight: bold;"><ruby>順番<rt>じゅんばん</rt></ruby>に<ruby>実行<rt>じっこう</rt></ruby>される</span>ことで、どんな<ruby>結果<rt>けっか</rt></ruby>になるか<ruby>考<rt>かんが</rt></ruby>えてみましょう。',
        description: 'プログラムを<ruby>見<rt>み</rt></ruby>て、ひよこが<span style="color: #dc2626; font-weight: bold;"><ruby>最後<rt>さいご</rt></ruby>にどこにいるか</span><ruby>考<rt>かんが</rt></ruby>えよう！\n\n<span style="color: #2563eb; font-weight: bold;">X<ruby>座標<rt>ざひょう</rt></ruby></span>(<ruby>横<rt>よこ</rt></ruby>)と<span style="color: #2563eb; font-weight: bold;">Y<ruby>座標<rt>ざひょう</rt></ruby></span>(<ruby>縦<rt>たて</rt></ruby>)を<ruby>計算<rt>けいさん</rt></ruby>してね。',
        difficulty: 2,
        order: 2,
        imageUrl: '/虫眼鏡を除くひよこ.png',
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
        learningObjective: 'プログラムの<span style="color: #dc2626; font-weight: bold;"><ruby>間違<rt>まちが</rt></ruby>い（バグ）</span>を<ruby>見<rt>み</rt></ruby>つけて<ruby>直<rt>なお</rt></ruby>すことは、プログラマーのとても<ruby>大切<rt>たいせつ</rt></ruby>な<ruby>仕事<rt>しごと</rt></ruby>です。\n<span style="color: #2563eb; font-weight: bold;"><ruby>順番<rt>じゅんばん</rt></ruby>が<ruby>変<rt>か</rt></ruby>わる</span>と、<span style="color: #dc2626; font-weight: bold;"><ruby>結果<rt>けっか</rt></ruby>も<ruby>変<rt>か</rt></ruby>わってしまう</span>ことを<ruby>学<rt>まな</rt></ruby>びましょう。',
        description: 'プログラムの<span style="color: #dc2626; font-weight: bold;"><ruby>順番<rt>じゅんばん</rt></ruby>が<ruby>間違<rt>まちが</rt></ruby>っています</span>！\n\n<span style="color: #16a34a; font-weight: bold;"><ruby>正<rt>ただ</rt></ruby>しい<ruby>順番<rt>じゅんばん</rt></ruby></span>:\n<span style="color: #ea580c; font-weight: bold;">1.</span> ひよこを<ruby>動<rt>うご</rt></ruby>かす\n<span style="color: #ea580c; font-weight: bold;">2.</span> 1<ruby>秒<rt>びょう</rt></ruby><ruby>待<rt>ま</rt></ruby>つ\n<span style="color: #ea580c; font-weight: bold;">3.</span> こんにちは!と<ruby>言<rt>い</rt></ruby>う',
        difficulty: 3,
        order: 3,
        imageUrl: '/はてなマークを浮かべるひよこ.png',
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
        learningObjective: '<span style="color: #2563eb; font-weight: bold;"><ruby>順次<rt>じゅんじ</rt></ruby><ruby>処理<rt>しょり</rt></ruby></span>の<ruby>知識<rt>ちしき</rt></ruby>を<ruby>使<rt>つか</rt></ruby>って、<ruby>自由<rt>じゆう</rt></ruby>にプログラムを<ruby>作<rt>つく</rt></ruby>ってみましょう！\n<span style="color: #16a34a; font-weight: bold;"><ruby>複数<rt>ふくすう</rt></ruby>の<ruby>動<rt>うご</rt></ruby>きを<ruby>組<rt>く</rt></ruby>み<ruby>合<rt>あ</rt></ruby>わせる</span>ことで、もっと<ruby>面白<rt>おもしろ</rt></ruby>いプログラムが<ruby>作<rt>つく</rt></ruby>れます。',
        description: 'ひよこが<ruby>階段<rt>かいだん</rt></ruby>を<ruby>登<rt>のぼ</rt></ruby>るプログラムを<ruby>作<rt>つく</rt></ruby>ろう！\n\n<span style="color: #dc2626; font-weight: bold;"><ruby>右<rt>みぎ</rt></ruby></span>に<span style="color: #ea580c; font-weight: bold;">10<ruby>歩<rt>ほ</rt></ruby></span> → <span style="color: #2563eb; font-weight: bold;"><ruby>上<rt>うえ</rt></ruby></span>に<span style="color: #ea580c; font-weight: bold;">10<ruby>歩<rt>ほ</rt></ruby></span>\nこれを<span style="color: #ea580c; font-weight: bold;">3<ruby>回<rt>かい</rt></ruby></span><ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>してね！',
        difficulty: 4,
        order: 4,
        imageUrl: '/ヘビに乗るひよこ三兄弟.png',
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
      },
      {
        type: 'mission',
        title: '<ruby>まとめ<rt></rt></ruby><ruby>問題<rt>もんだい</rt></ruby>: <ruby>順次<rt>じゅんじ</rt></ruby><ruby>処理<rt>しょり</rt></ruby>マスター',
        learningObjective: 'Chapter 1で<ruby>学<rt>まな</rt></ruby>んだ<span style="color: #2563eb; font-weight: bold;"><ruby>順次<rt>じゅんじ</rt></ruby><ruby>処理<rt>しょり</rt></ruby></span>の<ruby>知識<rt>ちしき</rt></ruby>を<ruby>総<rt>そう</rt></ruby><ruby>復習<rt>ふくしゅう</rt></ruby>しましょう！\n<ruby>命令<rt>めいれい</rt></ruby>を<span style="color: #dc2626; font-weight: bold;"><ruby>正<rt>ただ</rt></ruby>しい<ruby>順番<rt>じゅんばん</rt></ruby></span>で<ruby>並<rt>なら</rt></ruby>べることが、プログラミングの<ruby>基本<rt>きほん</rt></ruby>です。',
        description: 'ひよこが<span style="color: #16a34a; font-weight: bold;"><ruby>家<rt>いえ</rt></ruby></span>に<ruby>帰<rt>かえ</rt></ruby>るプログラムを<ruby>作<rt>つく</rt></ruby>ろう！\n\n<span style="color: #ea580c; font-weight: bold;">1.</span> <ruby>右<rt>みぎ</rt></ruby>に<span style="color: #ea580c; font-weight: bold;">50<ruby>歩<rt>ほ</rt></ruby></span><ruby>動<rt>うご</rt></ruby>く\n<span style="color: #ea580c; font-weight: bold;">2.</span> 「ただいま！」と<ruby>言<rt>い</rt></ruby>う\n<span style="color: #ea580c; font-weight: bold;">3.</span> <ruby>上<rt>うえ</rt></ruby>に<span style="color: #ea580c; font-weight: bold;">30<ruby>歩<rt>ほ</rt></ruby></span><ruby>動<rt>うご</rt></ruby>く\n<span style="color: #ea580c; font-weight: bold;">4.</span> <ruby>左<rt>ひだり</rt></ruby>に<span style="color: #ea580c; font-weight: bold;">90<ruby>度<rt>ど</rt></ruby></span><ruby>回<rt>まわ</rt></ruby>る\n<span style="color: #ea580c; font-weight: bold;">5.</span> <ruby>右<rt>みぎ</rt></ruby>に<span style="color: #ea580c; font-weight: bold;">20<ruby>歩<rt>ほ</rt></ruby></span><ruby>動<rt>うご</rt></ruby>く',
        difficulty: 3,
        order: 5,
        imageUrl: '/いいね！ポーズをするひよこ.png',
        initial_sb3_data: {
          targets: [{
            isStage: false,
            name: "スプライト1",
            blocks: {},
            currentCostume: 0,
            costumes: [{ name: "costume1", assetId: "default" }],
            x: 0,
            y: 0
          }]
        },
        correct_sb3_data: {
          targets: [{
            isStage: false,
            name: "スプライト1",
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
                  DX: [1, [4, "50"]]
                },
                fields: {}
              },
              "block3": {
                opcode: "looks_say",
                next: "block4",
                parent: "block2",
                inputs: {
                  MESSAGE: [1, [10, "ただいま！"]]
                },
                fields: {}
              },
              "block4": {
                opcode: "motion_changeyby",
                next: "block5",
                parent: "block3",
                inputs: {
                  DY: [1, [4, "30"]]
                },
                fields: {}
              },
              "block5": {
                opcode: "motion_turnleft",
                next: "block6",
                parent: "block4",
                inputs: {
                  DEGREES: [1, [4, "90"]]
                },
                fields: {}
              },
              "block6": {
                opcode: "motion_changexby",
                next: null,
                parent: "block5",
                inputs: {
                  DX: [1, [4, "20"]]
                },
                fields: {}
              }
            },
            currentCostume: 0,
            costumes: [{ name: "costume1", assetId: "default" }],
            x: 70,
            y: 30
          }]
        }
      }
    ];

    for (const problem of problems) {
      const result = await client.query(`
        INSERT INTO problems (chapter_id, problem_type, title, learning_objective, description, initial_sb3_data, correct_sb3_data, correct_answer_x, correct_answer_y, max_score, difficulty_level, order_number, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 100, $10, $11, $12)
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
        problem.order,
        problem.imageUrl || null
      ]);

      const problemId = result.rows[0].id;
    }

    console.log('✓ Chapter 1: 4 problems created');

    // Create Chapter 2: 分岐処理
    const chapter2Result = await client.query(`
      INSERT INTO chapters (title, description, order_number, image_url)
      VALUES ('Chapter 2: <ruby>分岐<rt>ぶんき</rt></ruby><ruby>処理<rt>しょり</rt></ruby> - <ruby>条件<rt>じょうけん</rt></ruby>によって<ruby>動<rt>うご</rt></ruby>きを<ruby>変<rt>か</rt></ruby>えよう', 'この<ruby>章<rt>しょう</rt></ruby>では、「<ruby>分岐<rt>ぶんき</rt></ruby><ruby>処理<rt>しょり</rt></ruby>」について<ruby>学<rt>まな</rt></ruby>んでいきます。
<ruby>条件<rt>じょうけん</rt></ruby>によってプログラムの<ruby>動<rt>うご</rt></ruby>きを<ruby>変<rt>か</rt></ruby>えることができるようになります！', 2, '/座って本を読むひよこ.png')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    const chapter2Id = chapter2Result.rows[0]?.id;

    if (chapter2Id) {
      console.log('✓ Chapter 2 created');

      const chapter2Problems = [
        {
          type: 'fill_blank',
          title: '<ruby>問題<rt>もんだい</rt></ruby>1: <ruby>壁<rt>かべ</rt></ruby>に<ruby>当<rt>あ</rt></ruby>たったら<ruby>止<rt>と</rt></ruby>まろう',
          learningObjective: '<ruby>分岐<rt>ぶんき</rt></ruby><ruby>処理<rt>しょり</rt></ruby>は、「もし～なら」という<ruby>条件<rt>じょうけん</rt></ruby>を<ruby>使<rt>つか</rt></ruby>って、プログラムの<ruby>動<rt>うご</rt></ruby>きを<ruby>変<rt>か</rt></ruby>えることができます。\n<ruby>条件<rt>じょうけん</rt></ruby>に<ruby>合<rt>あ</rt></ruby>うときだけ<ruby>実行<rt>じっこう</rt></ruby>される<ruby>命令<rt>めいれい</rt></ruby>を<ruby>作<rt>つく</rt></ruby>れるようになりましょう。',
          description: 'ひよこが<ruby>壁<rt>かべ</rt></ruby>（<ruby>端<rt>はし</rt></ruby>）に<ruby>当<rt>あ</rt></ruby>たったら<ruby>止<rt>と</rt></ruby>まるプログラムを<ruby>作<rt>つく</rt></ruby>ろう！\n\n「もし<ruby>端<rt>はし</rt></ruby>に<ruby>着<rt>つ</rt></ruby>いたら」というブロックを<ruby>使<rt>つか</rt></ruby>って、「<ruby>止<rt>と</rt></ruby>まる」という<ruby>動<rt>うご</rt></ruby>きを<ruby>追加<rt>ついか</rt></ruby>してね。',
          difficulty: 1,
          order: 1,
          imageUrl: '/待った！をかけるひよこ.png',
          initial_sb3_data: {
            targets: [{
              isStage: false,
              name: "スプライト1",
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
                  next: null,
                  parent: "block1",
                  inputs: {
                    STEPS: [1, [4, "10"]]
                  },
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          },
          correct_sb3_data: {
            targets: [{
              isStage: false,
              name: "スプライト1",
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
                  opcode: "control_if",
                  next: null,
                  parent: "block2",
                  inputs: {
                    CONDITION: [2, "block4"]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "sensing_touchingobject",
                  next: null,
                  parent: "block3",
                  inputs: {},
                  fields: {
                    TOUCHINGOBJECTMENU: ["_edge_", null]
                  }
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          }
        },
        {
          type: 'predict',
          title: '<ruby>問題<rt>もんだい</rt></ruby>2: ひよこは<ruby>何<rt>なん</rt></ruby>と<ruby>言<rt>い</rt></ruby>うかな？',
          learningObjective: '<ruby>条件<rt>じょうけん</rt></ruby>によって<ruby>実行<rt>じっこう</rt></ruby>される<ruby>命令<rt>めいれい</rt></ruby>が<ruby>変<rt>か</rt></ruby>わることを<ruby>理解<rt>りかい</rt></ruby>しましょう。\n<ruby>条件<rt>じょうけん</rt></ruby>が<ruby>成<rt>な</rt></ruby>り<ruby>立<rt>た</rt></ruby>つときと、<ruby>成<rt>な</rt></ruby>り<ruby>立<rt>た</rt></ruby>たないときで、どう<ruby>違<rt>ちが</rt></ruby>うか<ruby>考<rt>かんが</rt></ruby>えてみましょう。',
          description: 'ひよこのX<ruby>座標<rt>ざひょう</rt></ruby>が100より<ruby>大<rt>おお</rt></ruby>きいとき、ひよこは<ruby>何<rt>なに</rt></ruby>と<ruby>言<rt>い</rt></ruby>うでしょう？\n\n<ruby>最初<rt>さいしょ</rt></ruby>のX<ruby>座標<rt>ざひょう</rt></ruby>は0です。50<ruby>歩<rt>ほ</rt></ruby><ruby>動<rt>うご</rt></ruby>いて、そのあと<ruby>条件<rt>じょうけん</rt></ruby>を<ruby>調<rt>しら</rt></ruby>べます。',
          difficulty: 2,
          order: 2,
          imageUrl: '/虫眼鏡を除くひよこ.png',
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
                    STEPS: [1, [4, "50"]]
                  },
                  fields: {}
                },
                "block3": {
                  opcode: "control_if",
                  next: "block6",
                  parent: "block2",
                  inputs: {
                    CONDITION: [2, "block4"],
                    SUBSTACK: [2, "block5"]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "operator_gt",
                  parent: "block3",
                  inputs: {
                    OPERAND1: [3, "block7", [10, ""]],
                    OPERAND2: [1, [10, "100"]]
                  },
                  fields: {}
                },
                "block5": {
                  opcode: "looks_say",
                  next: null,
                  parent: "block3",
                  inputs: {
                    MESSAGE: [1, [10, "とても遠くまで来たよ！"]]
                  },
                  fields: {}
                },
                "block6": {
                  opcode: "looks_say",
                  next: null,
                  parent: "block3",
                  inputs: {
                    MESSAGE: [1, [10, "まだまだだね"]]
                  },
                  fields: {}
                },
                "block7": {
                  opcode: "motion_xposition",
                  parent: "block4",
                  inputs: {},
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
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
                    MESSAGE: [1, [10, "まだまだだね"]]
                  },
                  fields: {},
                  topLevel: true
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 50,
              y: 0
            }]
          }
        },
        {
          type: 'find_error',
          title: '<ruby>問題<rt>もんだい</rt></ruby>3: <ruby>色<rt>いろ</rt></ruby>の<ruby>条件<rt>じょうけん</rt></ruby>を<ruby>直<rt>なお</rt></ruby>そう！',
          learningObjective: '<ruby>条件<rt>じょうけん</rt></ruby>の<ruby>間違<rt>まちが</rt></ruby>いを<ruby>見<rt>み</rt></ruby>つけて<ruby>修正<rt>しゅうせい</rt></ruby>することで、<ruby>分岐<rt>ぶんき</rt></ruby><ruby>処理<rt>しょり</rt></ruby>の<ruby>理解<rt>りかい</rt></ruby>を<ruby>深<rt>ふか</rt></ruby>めましょう。\n<ruby>正<rt>ただ</rt></ruby>しい<ruby>条件<rt>じょうけん</rt></ruby>を<ruby>設定<rt>せってい</rt></ruby>することの<ruby>重要性<rt>じゅうようせい</rt></ruby>を<ruby>学<rt>まな</rt></ruby>びます。',
          description: 'ひよこが<ruby>赤<rt>あか</rt></ruby>い<ruby>色<rt>いろ</rt></ruby>に<ruby>触<rt>ふ</rt></ruby>れたら「<ruby>危<rt>あぶ</rt></ruby>ない！」と<ruby>言<rt>い</rt></ruby>うはずなのに、<ruby>青<rt>あお</rt></ruby>い<ruby>色<rt>いろ</rt></ruby>に<ruby>触<rt>ふ</rt></ruby>れたときに<ruby>言<rt>い</rt></ruby>ってしまっています。\n\n<ruby>条件<rt>じょうけん</rt></ruby>を<ruby>修正<rt>しゅうせい</rt></ruby>してください。',
          difficulty: 3,
          order: 3,
          imageUrl: '/はてなマークを浮かべるひよこ.png',
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
                  opcode: "control_if",
                  next: null,
                  parent: "block1",
                  inputs: {
                    CONDITION: [2, "block3"],
                    SUBSTACK: [2, "block4"]
                  },
                  fields: {}
                },
                "block3": {
                  opcode: "sensing_touchingcolor",
                  parent: "block2",
                  inputs: {
                    COLOR: [1, "#0000ff"]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "looks_say",
                  next: null,
                  parent: "block2",
                  inputs: {
                    MESSAGE: [1, [10, "危ない！"]]
                  },
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
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
                  opcode: "control_if",
                  next: null,
                  parent: "block1",
                  inputs: {
                    CONDITION: [2, "block3"],
                    SUBSTACK: [2, "block4"]
                  },
                  fields: {}
                },
                "block3": {
                  opcode: "sensing_touchingcolor",
                  parent: "block2",
                  inputs: {
                    COLOR: [1, "#ff0000"]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "looks_say",
                  next: null,
                  parent: "block2",
                  inputs: {
                    MESSAGE: [1, [10, "危ない！"]]
                  },
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          }
        },
        {
          type: 'mission',
          title: '<ruby>問題<rt>もんだい</rt></ruby>4: じゃんけんゲームを<ruby>作<rt>つく</rt></ruby>ろう！',
          learningObjective: '<ruby>分岐<rt>ぶんき</rt></ruby><ruby>処理<rt>しょり</rt></ruby>を<ruby>使<rt>つか</rt></ruby>って、<ruby>自由<rt>じゆう</rt></ruby>にプログラムを<ruby>作<rt>つく</rt></ruby>ってみましょう！\n<ruby>複数<rt>ふくすう</rt></ruby>の<ruby>条件<rt>じょうけん</rt></ruby>を<ruby>組<rt>く</rt></ruby>み<ruby>合<rt>あ</rt></ruby>わせることで、もっと<ruby>面白<rt>おもしろ</rt></ruby>いプログラムが<ruby>作<rt>つく</rt></ruby>れます。',
          description: '<ruby>簡単<rt>かんたん</rt></ruby>なじゃんけんゲームを<ruby>作<rt>つく</rt></ruby>ろう！\n\n1から3の<ruby>乱数<rt>らんすう</rt></ruby>を<ruby>使<rt>つか</rt></ruby>って：\n- 1なら「グー！」\n- 2なら「チョキ！」\n- 3なら「パー！」\nと<ruby>言<rt>い</rt></ruby>うプログラムを<ruby>作<rt>つく</rt></ruby>ってね。',
          difficulty: 4,
          order: 4,
          imageUrl: '/パソコンを開いてメガネをカチャカチャするエリート風ひよこ.png',
          initial_sb3_data: {
            targets: [{
              isStage: false,
              name: "Sprite1",
              blocks: {},
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
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
                  opcode: "data_setvariableto",
                  next: "block3",
                  parent: "block1",
                  inputs: {
                    VALUE: [3, "block10", [10, ""]]
                  },
                  fields: {
                    VARIABLE: ["hand", "hand_var"]
                  }
                },
                "block3": {
                  opcode: "control_if",
                  next: "block6",
                  parent: "block2",
                  inputs: {
                    CONDITION: [2, "block4"],
                    SUBSTACK: [2, "block5"]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "operator_equals",
                  parent: "block3",
                  inputs: {
                    OPERAND1: [3, "block11", [10, ""]],
                    OPERAND2: [1, [10, "1"]]
                  },
                  fields: {}
                },
                "block5": {
                  opcode: "looks_say",
                  next: null,
                  parent: "block3",
                  inputs: {
                    MESSAGE: [1, [10, "グー！"]]
                  },
                  fields: {}
                },
                "block6": {
                  opcode: "control_if",
                  next: "block9",
                  parent: "block3",
                  inputs: {
                    CONDITION: [2, "block7"],
                    SUBSTACK: [2, "block8"]
                  },
                  fields: {}
                },
                "block7": {
                  opcode: "operator_equals",
                  parent: "block6",
                  inputs: {
                    OPERAND1: [3, "block12", [10, ""]],
                    OPERAND2: [1, [10, "2"]]
                  },
                  fields: {}
                },
                "block8": {
                  opcode: "looks_say",
                  next: null,
                  parent: "block6",
                  inputs: {
                    MESSAGE: [1, [10, "チョキ！"]]
                  },
                  fields: {}
                },
                "block9": {
                  opcode: "looks_say",
                  next: null,
                  parent: "block6",
                  inputs: {
                    MESSAGE: [1, [10, "パー！"]]
                  },
                  fields: {}
                },
                "block10": {
                  opcode: "operator_random",
                  parent: "block2",
                  inputs: {
                    FROM: [1, [4, "1"]],
                    TO: [1, [4, "3"]]
                  },
                  fields: {}
                },
                "block11": {
                  opcode: "data_variable",
                  parent: "block4",
                  fields: {
                    VARIABLE: ["hand", "hand_var"]
                  }
                },
                "block12": {
                  opcode: "data_variable",
                  parent: "block7",
                  fields: {
                    VARIABLE: ["hand", "hand_var"]
                  }
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          }
        },
        {
          type: 'mission',
          title: '<ruby>まとめ<rt></rt></ruby><ruby>問題<rt>もんだい</rt></ruby>: <ruby>分岐<rt>ぶんき</rt></ruby><ruby>処理<rt>しょり</rt></ruby>マスター',
          learningObjective: 'Chapter 2で<ruby>学<rt>まな</rt></ruby>んだ<span style="color: #2563eb; font-weight: bold;"><ruby>分岐<rt>ぶんき</rt></ruby><ruby>処理<rt>しょり</rt></ruby></span>の<ruby>知識<rt>ちしき</rt></ruby>を<ruby>総<rt>そう</rt></ruby><ruby>復習<rt>ふくしゅう</rt></ruby>しましょう！\n<span style="color: #16a34a; font-weight: bold;">「もし～なら」</span>という<ruby>条件<rt>じょうけん</rt></ruby>を<ruby>使<rt>つか</rt></ruby>って、プログラムの<ruby>動<rt>うご</rt></ruby>きを<ruby>変<rt>か</rt></ruby>えることができます。',
          description: 'ひよこが<span style="color: #16a34a; font-weight: bold;"><ruby>宝物<rt>たからもの</rt></ruby></span>を<ruby>探<rt>さが</rt></ruby>すプログラムを<ruby>作<rt>つく</rt></ruby>ろう！\n\n<span style="color: #2563eb; font-weight: bold;"><ruby>条件<rt>じょうけん</rt></ruby>1:</span> X<ruby>座標<rt>ざひょう</rt></ruby>が<span style="color: #ea580c; font-weight: bold;">100</span>より<ruby>大<rt>おお</rt></ruby>きいなら「<ruby>近<rt>ちか</rt></ruby>づいてきた！」と<ruby>言<rt>い</rt></ruby>う\n<span style="color: #2563eb; font-weight: bold;"><ruby>条件<rt>じょうけん</rt></ruby>2:</span> Y<ruby>座標<rt>ざひょう</rt></ruby>が<span style="color: #ea580c; font-weight: bold;">50</span>より<ruby>大<rt>おお</rt></ruby>きいなら「<ruby>宝物<rt>たからもの</rt></ruby>を<ruby>見<rt>み</rt></ruby>つけた！」と<ruby>言<rt>い</rt></ruby>う\n\n<ruby>最初<rt>さいしょ</rt></ruby>に<ruby>右<rt>みぎ</rt></ruby>に<span style="color: #ea580c; font-weight: bold;">120<ruby>歩<rt>ほ</rt></ruby></span>、<ruby>上<rt>うえ</rt></ruby>に<span style="color: #ea580c; font-weight: bold;">60<ruby>歩<rt>ほ</rt></ruby></span><ruby>動<rt>うご</rt></ruby>かしてから、<ruby>条件<rt>じょうけん</rt></ruby>を<ruby>確認<rt>かくにん</rt></ruby>してね！',
          difficulty: 4,
          order: 5,
          imageUrl: '/キラキラした目で期待をするひよこ.png',
          initial_sb3_data: {
            targets: [{
              isStage: false,
              name: "スプライト1",
              blocks: {},
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          },
          correct_sb3_data: {
            targets: [{
              isStage: false,
              name: "スプライト1",
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
                    DX: [1, [4, "120"]]
                  },
                  fields: {}
                },
                "block3": {
                  opcode: "motion_changeyby",
                  next: "block4",
                  parent: "block2",
                  inputs: {
                    DY: [1, [4, "60"]]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "control_if",
                  next: "block7",
                  parent: "block3",
                  inputs: {
                    CONDITION: [2, "block5"],
                    SUBSTACK: [2, "block6"]
                  },
                  fields: {}
                },
                "block5": {
                  opcode: "operator_gt",
                  parent: "block4",
                  inputs: {
                    OPERAND1: [3, "block10", [10, ""]],
                    OPERAND2: [1, [10, "100"]]
                  },
                  fields: {}
                },
                "block6": {
                  opcode: "looks_say",
                  next: null,
                  parent: "block4",
                  inputs: {
                    MESSAGE: [1, [10, "近づいてきた！"]]
                  },
                  fields: {}
                },
                "block7": {
                  opcode: "control_if",
                  next: null,
                  parent: "block4",
                  inputs: {
                    CONDITION: [2, "block8"],
                    SUBSTACK: [2, "block9"]
                  },
                  fields: {}
                },
                "block8": {
                  opcode: "operator_gt",
                  parent: "block7",
                  inputs: {
                    OPERAND1: [3, "block11", [10, ""]],
                    OPERAND2: [1, [10, "50"]]
                  },
                  fields: {}
                },
                "block9": {
                  opcode: "looks_say",
                  next: null,
                  parent: "block7",
                  inputs: {
                    MESSAGE: [1, [10, "宝物を見つけた！"]]
                  },
                  fields: {}
                },
                "block10": {
                  opcode: "motion_xposition",
                  parent: "block5",
                  inputs: {},
                  fields: {}
                },
                "block11": {
                  opcode: "motion_yposition",
                  parent: "block8",
                  inputs: {},
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 120,
              y: 60
            }]
          }
        }
      ];

      for (const problem of chapter2Problems) {
        await client.query(`
          INSERT INTO problems (chapter_id, problem_type, title, learning_objective, description, initial_sb3_data, correct_sb3_data, correct_answer_x, correct_answer_y, max_score, difficulty_level, order_number, image_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 100, $10, $11, $12)
        `, [
          chapter2Id,
          problem.type,
          problem.title,
          problem.learningObjective || null,
          problem.description,
          JSON.stringify(problem.initial_sb3_data),
          JSON.stringify(problem.correct_sb3_data),
          problem.correctAnswerX || null,
          problem.correctAnswerY || null,
          problem.difficulty,
          problem.order,
          problem.imageUrl || null
        ]);
      }
      console.log('✓ Chapter 2: 4 problems created');
    }

    // Create Chapter 3: 反復処理
    const chapter3Result = await client.query(`
      INSERT INTO chapters (title, description, order_number, image_url)
      VALUES ('Chapter 3: <ruby>反復<rt>はんぷく</rt></ruby><ruby>処理<rt>しょり</rt></ruby> - <ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>して<ruby>効率的<rt>こうりつてき</rt></ruby>に<ruby>動<rt>うご</rt></ruby>かそう', 'この<ruby>章<rt>しょう</rt></ruby>では、「<ruby>反復<rt>はんぷく</rt></ruby><ruby>処理<rt>しょり</rt></ruby>（ループ）」について<ruby>学<rt>まな</rt></ruby>んでいきます。
<ruby>同<rt>おな</rt></ruby>じ<ruby>動<rt>うご</rt></ruby>きを<ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>すことで、<ruby>効率的<rt>こうりつてき</rt></ruby>なプログラムが<ruby>作<rt>つく</rt></ruby>れます！', 3, '/ノートパソコンを開いて作業をするひよこ.png')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    const chapter3Id = chapter3Result.rows[0]?.id;

    if (chapter3Id) {
      console.log('✓ Chapter 3 created');

      const chapter3Problems = [
        {
          type: 'fill_blank',
          title: '<ruby>問題<rt>もんだい</rt></ruby>1: <ruby>四角形<rt>しかくけい</rt></ruby>を<ruby>描<rt>か</rt></ruby>こう',
          learningObjective: '<ruby>反復<rt>はんぷく</rt></ruby><ruby>処理<rt>しょり</rt></ruby>（ループ）を<ruby>使<rt>つか</rt></ruby>うと、<ruby>同<rt>おな</rt></ruby>じ<ruby>動<rt>うご</rt></ruby>きを<ruby>何度<rt>なんど</rt></ruby>も<ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>すことができます。\n「〇<ruby>回<rt>かい</rt></ruby><ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>す」ブロックの<ruby>使<rt>つか</rt></ruby>い<ruby>方<rt>かた</rt></ruby>を<ruby>学<rt>まな</rt></ruby>びましょう。',
          description: 'ひよこで<ruby>四角形<rt>しかくけい</rt></ruby>を<ruby>描<rt>か</rt></ruby>くプログラムを<ruby>完成<rt>かんせい</rt></ruby>させよう！\n\n<ruby>四角形<rt>しかくけい</rt></ruby>は4<ruby>回<rt>かい</rt></ruby>「50<ruby>歩<rt>ほ</rt></ruby><ruby>動<rt>うご</rt></ruby>かして90<ruby>度<rt>ど</rt></ruby><ruby>回<rt>まわ</rt></ruby>る」を<ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>せば<ruby>描<rt>か</rt></ruby>けるよ！',
          difficulty: 1,
          order: 1,
          imageUrl: '/筆をもつひよこ.png',
          initial_sb3_data: {
            targets: [{
              isStage: false,
              name: "スプライト1",
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
                  opcode: "pen_penDown",
                  next: null,
                  parent: "block1",
                  inputs: {},
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          },
          correct_sb3_data: {
            targets: [{
              isStage: false,
              name: "スプライト1",
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
                  opcode: "pen_penDown",
                  next: "block3",
                  parent: "block1",
                  inputs: {},
                  fields: {}
                },
                "block3": {
                  opcode: "control_repeat",
                  next: null,
                  parent: "block2",
                  inputs: {
                    TIMES: [1, [4, "4"]],
                    SUBSTACK: [2, "block4"]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "motion_movesteps",
                  next: "block5",
                  parent: "block3",
                  inputs: {
                    STEPS: [1, [4, "50"]]
                  },
                  fields: {}
                },
                "block5": {
                  opcode: "motion_turnright",
                  next: null,
                  parent: "block4",
                  inputs: {
                    DEGREES: [1, [4, "90"]]
                  },
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          }
        },
        {
          type: 'predict',
          title: '<ruby>問題<rt>もんだい</rt></ruby>2: ひよこは<ruby>何回<rt>なんかい</rt></ruby>ピヨピヨと<ruby>鳴<rt>な</rt></ruby>くかな？',
          learningObjective: 'ループの<ruby>回数<rt>かいすう</rt></ruby>を<ruby>正確<rt>せいかく</rt></ruby>に<ruby>理解<rt>りかい</rt></ruby>することは、<ruby>反復<rt>はんぷく</rt></ruby><ruby>処理<rt>しょり</rt></ruby>でとても<ruby>大切<rt>たいせつ</rt></ruby>です。\nプログラムを<ruby>見<rt>み</rt></ruby>て、<ruby>何回<rt>なんかい</rt></ruby><ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>されるか<ruby>予測<rt>よそく</rt></ruby>できるようになりましょう。',
          description: 'このプログラムを<ruby>実行<rt>じっこう</rt></ruby>すると、ひよこは<ruby>何回<rt>なんかい</rt></ruby>「ピヨピヨ」と<ruby>鳴<rt>な</rt></ruby>くでしょう？\n\nループが2<ruby>回<rt>かい</rt></ruby>あることに<ruby>注意<rt>ちゅうい</rt></ruby>してね！',
          difficulty: 2,
          order: 2,
          imageUrl: '/虫眼鏡を除くひよこ.png',
          correctAnswerX: 6,
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
                  opcode: "control_repeat",
                  next: "block5",
                  parent: "block1",
                  inputs: {
                    TIMES: [1, [4, "2"]],
                    SUBSTACK: [2, "block3"]
                  },
                  fields: {}
                },
                "block3": {
                  opcode: "looks_say",
                  next: null,
                  parent: "block2",
                  inputs: {
                    MESSAGE: [1, [10, "ニャー"]]
                  },
                  fields: {}
                },
                "block5": {
                  opcode: "control_repeat",
                  next: null,
                  parent: "block2",
                  inputs: {
                    TIMES: [1, [4, "4"]],
                    SUBSTACK: [2, "block6"]
                  },
                  fields: {}
                },
                "block6": {
                  opcode: "looks_say",
                  next: null,
                  parent: "block5",
                  inputs: {
                    MESSAGE: [1, [10, "ニャー"]]
                  },
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
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
                    MESSAGE: [1, [10, "6"]]
                  },
                  fields: {},
                  topLevel: true
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          }
        },
        {
          type: 'find_error',
          title: '<ruby>問題<rt>もんだい</rt></ruby>3: <ruby>三角形<rt>さんかくけい</rt></ruby>が<ruby>描<rt>か</rt></ruby>けない！',
          learningObjective: 'ループの<ruby>回数<rt>かいすう</rt></ruby>や<ruby>角度<rt>かくど</rt></ruby>の<ruby>間違<rt>まちが</rt></ruby>いを<ruby>見<rt>み</rt></ruby>つけて<ruby>修正<rt>しゅうせい</rt></ruby>することで、<ruby>反復<rt>はんぷく</rt></ruby><ruby>処理<rt>しょり</rt></ruby>の<ruby>理解<rt>りかい</rt></ruby>を<ruby>深<rt>ふか</rt></ruby>めましょう。\n<ruby>図形<rt>ずけい</rt></ruby>を<ruby>描<rt>か</rt></ruby>くには、<ruby>正<rt>ただ</rt></ruby>しい<ruby>回数<rt>かいすう</rt></ruby>と<ruby>角度<rt>かくど</rt></ruby>が<ruby>必要<rt>ひつよう</rt></ruby>です。',
          description: '<ruby>三角形<rt>さんかくけい</rt></ruby>を<ruby>描<rt>か</rt></ruby>きたいのに、プログラムに<ruby>間違<rt>まちが</rt></ruby>いがあります！\n\n<ruby>三角形<rt>さんかくけい</rt></ruby>は3<ruby>回<rt>かい</rt></ruby>「<ruby>動<rt>うご</rt></ruby>いて120<ruby>度<rt>ど</rt></ruby><ruby>回<rt>まわ</rt></ruby>る」を<ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>します。<ruby>間違<rt>まちが</rt></ruby>いを<ruby>直<rt>なお</rt></ruby>してください。',
          difficulty: 3,
          order: 3,
          imageUrl: '/はてなマークを浮かべるひよこ.png',
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
                  opcode: "pen_penDown",
                  next: "block3",
                  parent: "block1",
                  inputs: {},
                  fields: {}
                },
                "block3": {
                  opcode: "control_repeat",
                  next: null,
                  parent: "block2",
                  inputs: {
                    TIMES: [1, [4, "4"]],
                    SUBSTACK: [2, "block4"]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "motion_movesteps",
                  next: "block5",
                  parent: "block3",
                  inputs: {
                    STEPS: [1, [4, "50"]]
                  },
                  fields: {}
                },
                "block5": {
                  opcode: "motion_turnright",
                  next: null,
                  parent: "block4",
                  inputs: {
                    DEGREES: [1, [4, "90"]]
                  },
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
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
                  opcode: "pen_penDown",
                  next: "block3",
                  parent: "block1",
                  inputs: {},
                  fields: {}
                },
                "block3": {
                  opcode: "control_repeat",
                  next: null,
                  parent: "block2",
                  inputs: {
                    TIMES: [1, [4, "3"]],
                    SUBSTACK: [2, "block4"]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "motion_movesteps",
                  next: "block5",
                  parent: "block3",
                  inputs: {
                    STEPS: [1, [4, "50"]]
                  },
                  fields: {}
                },
                "block5": {
                  opcode: "motion_turnright",
                  next: null,
                  parent: "block4",
                  inputs: {
                    DEGREES: [1, [4, "120"]]
                  },
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          }
        },
        {
          type: 'mission',
          title: '<ruby>問題<rt>もんだい</rt></ruby>4: きれいな<ruby>星<rt>ほし</rt></ruby>を<ruby>描<rt>か</rt></ruby>こう！',
          learningObjective: '<ruby>反復<rt>はんぷく</rt></ruby><ruby>処理<rt>しょり</rt></ruby>の<ruby>知識<rt>ちしき</rt></ruby>を<ruby>使<rt>つか</rt></ruby>って、<ruby>自由<rt>じゆう</rt></ruby>にプログラムを<ruby>作<rt>つく</rt></ruby>ってみましょう！\n<ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>しを<ruby>使<rt>つか</rt></ruby>うことで、<ruby>複雑<rt>ふくざつ</rt></ruby>な<ruby>図形<rt>ずけい</rt></ruby>も<ruby>簡単<rt>かんたん</rt></ruby>に<ruby>描<rt>か</rt></ruby>けます。',
          description: '5<ruby>角星<rt>かくせい</rt></ruby>（★）を<ruby>描<rt>か</rt></ruby>くプログラムを<ruby>作<rt>つく</rt></ruby>ろう！\n\n5<ruby>回<rt>かい</rt></ruby>「100<ruby>歩<rt>ほ</rt></ruby><ruby>動<rt>うご</rt></ruby>いて144<ruby>度<rt>ど</rt></ruby><ruby>回<rt>まわ</rt></ruby>る」を<ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>すと、きれいな<ruby>星<rt>ほし</rt></ruby>が<ruby>描<rt>か</rt></ruby>けるよ！',
          difficulty: 4,
          order: 4,
          imageUrl: '/キラキラした目で期待をするひよこ.png',
          initial_sb3_data: {
            targets: [{
              isStage: false,
              name: "Sprite1",
              blocks: {},
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
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
                  opcode: "pen_penDown",
                  next: "block3",
                  parent: "block1",
                  inputs: {},
                  fields: {}
                },
                "block3": {
                  opcode: "control_repeat",
                  next: null,
                  parent: "block2",
                  inputs: {
                    TIMES: [1, [4, "5"]],
                    SUBSTACK: [2, "block4"]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "motion_movesteps",
                  next: "block5",
                  parent: "block3",
                  inputs: {
                    STEPS: [1, [4, "100"]]
                  },
                  fields: {}
                },
                "block5": {
                  opcode: "motion_turnright",
                  next: null,
                  parent: "block4",
                  inputs: {
                    DEGREES: [1, [4, "144"]]
                  },
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          }
        },
        {
          type: 'mission',
          title: '<ruby>まとめ<rt></rt></ruby><ruby>問題<rt>もんだい</rt></ruby>: <ruby>反復<rt>はんぷく</rt></ruby><ruby>処理<rt>しょり</rt></ruby>マスター',
          learningObjective: 'Chapter 3で<ruby>学<rt>まな</rt></ruby>んだ<span style="color: #2563eb; font-weight: bold;"><ruby>反復<rt>はんぷく</rt></ruby><ruby>処理<rt>しょり</rt></ruby>（ループ）</span>の<ruby>知識<rt>ちしき</rt></ruby>を<ruby>総<rt>そう</rt></ruby><ruby>復習<rt>ふくしゅう</rt></ruby>しましょう！\n<span style="color: #16a34a; font-weight: bold;"><ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>し</span>を<ruby>使<rt>つか</rt></ruby>うことで、<ruby>同<rt>おな</rt></ruby>じ<ruby>動<rt>うご</rt></ruby>きを<ruby>効率的<rt>こうりつてき</rt></ruby>にプログラムできます。',
          description: 'ひよこで<span style="color: #16a34a; font-weight: bold;"><ruby>六角形<rt>ろっかくけい</rt></ruby></span>（6<ruby>角形<rt>かくけい</rt></ruby>）を<ruby>描<rt>か</rt></ruby>くプログラムを<ruby>作<rt>つく</rt></ruby>ろう！\n\n<span style="color: #2563eb; font-weight: bold;"><ruby>六角形<rt>ろっかくけい</rt></ruby>を<ruby>描<rt>か</rt></ruby>く<ruby>方法<rt>ほうほう</rt></ruby>:</span>\n<span style="color: #ea580c; font-weight: bold;">6<ruby>回<rt>かい</rt></ruby></span><ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>す\n  ・<span style="color: #ea580c; font-weight: bold;">60<ruby>歩<rt>ほ</rt></ruby></span><ruby>動<rt>うご</rt></ruby>く\n  ・<ruby>右<rt>みぎ</rt></ruby>に<span style="color: #ea580c; font-weight: bold;">60<ruby>度<rt>ど</rt></ruby></span><ruby>回<rt>まわ</rt></ruby>る\n\n<ruby>最初<rt>さいしょ</rt></ruby>に<span style="color: #16a34a; font-weight: bold;">「ペンを<ruby>下<rt>お</rt></ruby>ろす」</span>ブロックも<ruby>忘<rt>わす</rt></ruby>れずに！',
          difficulty: 4,
          order: 5,
          imageUrl: '/筆をもつひよこ.png',
          initial_sb3_data: {
            targets: [{
              isStage: false,
              name: "スプライト1",
              blocks: {},
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          },
          correct_sb3_data: {
            targets: [{
              isStage: false,
              name: "スプライト1",
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
                  opcode: "pen_penDown",
                  next: "block3",
                  parent: "block1",
                  inputs: {},
                  fields: {}
                },
                "block3": {
                  opcode: "control_repeat",
                  next: null,
                  parent: "block2",
                  inputs: {
                    TIMES: [1, [4, "6"]],
                    SUBSTACK: [2, "block4"]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "motion_movesteps",
                  next: "block5",
                  parent: "block3",
                  inputs: {
                    STEPS: [1, [4, "60"]]
                  },
                  fields: {}
                },
                "block5": {
                  opcode: "motion_turnright",
                  next: null,
                  parent: "block4",
                  inputs: {
                    DEGREES: [1, [4, "60"]]
                  },
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          }
        }
      ];

      for (const problem of chapter3Problems) {
        await client.query(`
          INSERT INTO problems (chapter_id, problem_type, title, learning_objective, description, initial_sb3_data, correct_sb3_data, correct_answer_x, correct_answer_y, max_score, difficulty_level, order_number, image_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 100, $10, $11, $12)
        `, [
          chapter3Id,
          problem.type,
          problem.title,
          problem.learningObjective || null,
          problem.description,
          JSON.stringify(problem.initial_sb3_data),
          JSON.stringify(problem.correct_sb3_data),
          problem.correctAnswerX || null,
          problem.correctAnswerY || null,
          problem.difficulty,
          problem.order,
          problem.imageUrl || null
        ]);
      }
      console.log('✓ Chapter 3: 5 problems created');
    }

    // Create Chapter 4: 総合演習
    const chapter4Result = await client.query(`
      INSERT INTO chapters (title, description, order_number, image_url)
      VALUES ('Chapter 4: <ruby>総合<rt>そうごう</rt></ruby><ruby>演習<rt>えんしゅう</rt></ruby> - これまでの<ruby>学<rt>まな</rt></ruby>びを<ruby>組<rt>く</rt></ruby>み<ruby>合<rt>あ</rt></ruby>わせよう', 'この<ruby>章<rt>しょう</rt></ruby>では、これまで<ruby>学<rt>まな</rt></ruby>んだ<ruby>順次<rt>じゅんじ</rt></ruby><ruby>処理<rt>しょり</rt></ruby>、<ruby>分岐<rt>ぶんき</rt></ruby><ruby>処理<rt>しょり</rt></ruby>、<ruby>反復<rt>はんぷく</rt></ruby><ruby>処理<rt>しょり</rt></ruby>を<ruby>組<rt>く</rt></ruby>み<ruby>合<rt>あ</rt></ruby>わせた<ruby>総合<rt>そうごう</rt></ruby><ruby>問題<rt>もんだい</rt></ruby>に<ruby>挑戦<rt>ちょうせん</rt></ruby>します！', 4, '/パソコンを開いてメガネをカチャカチャするエリート風ひよこ.png')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    const chapter4Id = chapter4Result.rows[0]?.id;

    if (chapter4Id) {
      console.log('✓ Chapter 4 created');

      const chapter4Problems = [
        {
          type: 'fill_blank',
          title: '<ruby>問題<rt>もんだい</rt></ruby>1: <ruby>条件<rt>じょうけん</rt></ruby>つきループ',
          learningObjective: '<span style="color: #2563eb; font-weight: bold;"><ruby>反復<rt>はんぷく</rt></ruby><ruby>処理<rt>しょり</rt></ruby></span>と<span style="color: #16a34a; font-weight: bold;"><ruby>分岐<rt>ぶんき</rt></ruby><ruby>処理<rt>しょり</rt></ruby></span>を<ruby>組<rt>く</rt></ruby>み<ruby>合<rt>あ</rt></ruby>わせることで、より<ruby>複雑<rt>ふくざつ</rt></ruby>なプログラムを<ruby>作<rt>つく</rt></ruby>ることができます。\nループの<ruby>中<rt>なか</rt></ruby>で<ruby>条件<rt>じょうけん</rt></ruby>を<ruby>使<rt>つか</rt></ruby>う<ruby>方法<rt>ほうほう</rt></ruby>を<ruby>学<rt>まな</rt></ruby>びましょう。',
          description: 'ひよこが<ruby>障害物<rt>しょうがいぶつ</rt></ruby>を<ruby>避<rt>さ</rt></ruby>けながら<ruby>進<rt>すす</rt></ruby>むプログラムを<ruby>作<rt>つく</rt></ruby>ろう！\n\n<span style="color: #ea580c; font-weight: bold;">3<ruby>回<rt>かい</rt></ruby></span><ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>す：\n  ・<span style="color: #ea580c; font-weight: bold;">50<ruby>歩<rt>ほ</rt></ruby></span><ruby>前<rt>まえ</rt></ruby>に<ruby>進<rt>すす</rt></ruby>む\n  ・もし<ruby>赤<rt>あか</rt></ruby>い<ruby>色<rt>いろ</rt></ruby>に<ruby>触<rt>ふ</rt></ruby>れたら、<ruby>上<rt>うえ</rt></ruby>に<span style="color: #ea580c; font-weight: bold;">30<ruby>歩<rt>ほ</rt></ruby></span><ruby>動<rt>うご</rt></ruby>く',
          difficulty: 5,
          order: 1,
          imageUrl: '/ヘビに乗るひよこ三兄弟.png',
          initial_sb3_data: {
            targets: [{
              isStage: false,
              name: "スプライト1",
              blocks: {},
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          },
          correct_sb3_data: {
            targets: [{
              isStage: false,
              name: "スプライト1",
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
                  opcode: "control_repeat",
                  next: null,
                  parent: "block1",
                  inputs: {
                    TIMES: [1, [4, "3"]],
                    SUBSTACK: [2, "block3"]
                  },
                  fields: {}
                },
                "block3": {
                  opcode: "motion_changexby",
                  next: "block4",
                  parent: "block2",
                  inputs: {
                    DX: [1, [4, "50"]]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "control_if",
                  next: null,
                  parent: "block3",
                  inputs: {
                    CONDITION: [2, "block5"],
                    SUBSTACK: [2, "block6"]
                  },
                  fields: {}
                },
                "block5": {
                  opcode: "sensing_touchingcolor",
                  parent: "block4",
                  inputs: {
                    COLOR: [1, "#ff0000"]
                  },
                  fields: {}
                },
                "block6": {
                  opcode: "motion_changeyby",
                  next: null,
                  parent: "block4",
                  inputs: {
                    DY: [1, [4, "30"]]
                  },
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 150,
              y: 0
            }]
          }
        },
        {
          type: 'mission',
          title: '<ruby>問題<rt>もんだい</rt></ruby>2: <ruby>最終<rt>さいしゅう</rt></ruby>チャレンジ',
          learningObjective: 'すべての<ruby>知識<rt>ちしき</rt></ruby>を<ruby>使<rt>つか</rt></ruby>って、<ruby>自由<rt>じゆう</rt></ruby>にプログラムを<ruby>作<rt>つく</rt></ruby>ってみましょう！\n<span style="color: #2563eb; font-weight: bold;"><ruby>順次<rt>じゅんじ</rt></ruby></span>、<span style="color: #16a34a; font-weight: bold;"><ruby>分岐<rt>ぶんき</rt></ruby></span>、<span style="color: #dc2626; font-weight: bold;"><ruby>反復<rt>はんぷく</rt></ruby></span>すべてを<ruby>組<rt>く</rt></ruby>み<ruby>合<rt>あ</rt></ruby>わせてみましょう。',
          description: 'ひよこが<ruby>目標<rt>もくひょう</rt></ruby>まで<ruby>到達<rt>とうたつ</rt></ruby>するプログラムを<ruby>作<rt>つく</rt></ruby>ろう！\n\n<ruby>条件<rt>じょうけん</rt></ruby>：\n<span style="color: #ea580c; font-weight: bold;">1.</span> <span style="color: #ea580c; font-weight: bold;">5<ruby>回<rt>かい</rt></ruby></span>ループする\n<span style="color: #ea580c; font-weight: bold;">2.</span> <ruby>毎回<rt>まいかい</rt></ruby><span style="color: #ea580c; font-weight: bold;">40<ruby>歩<rt>ほ</rt></ruby></span><ruby>右<rt>みぎ</rt></ruby>に<ruby>進<rt>すす</rt></ruby>む\n<span style="color: #ea580c; font-weight: bold;">3.</span> もしX<ruby>座標<rt>ざひょう</rt></ruby>が<span style="color: #ea580c; font-weight: bold;">100</span>より<ruby>大<rt>おお</rt></ruby>きければ「<ruby>半分<rt>はんぶん</rt></ruby>まで<ruby>来<rt>き</rt></ruby>た！」と<ruby>言<rt>い</rt></ruby>う\n<span style="color: #ea580c; font-weight: bold;">4.</span> <ruby>最後<rt>さいご</rt></ruby>に「<ruby>到達<rt>とうたつ</rt></ruby>！」と<ruby>言<rt>い</rt></ruby>う',
          difficulty: 5,
          order: 2,
          imageUrl: '/合格証を見せるひよこ.png',
          initial_sb3_data: {
            targets: [{
              isStage: false,
              name: "スプライト1",
              blocks: {},
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          },
          correct_sb3_data: {
            targets: [{
              isStage: false,
              name: "スプライト1",
              blocks: {},
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 200,
              y: 0
            }]
          }
        },
        {
          type: 'predict',
          title: '<ruby>問題<rt>もんだい</rt></ruby>3: <ruby>複雑<rt>ふくざつ</rt></ruby>なプログラムの<ruby>予測<rt>よそく</rt></ruby>',
          learningObjective: '<ruby>複数<rt>ふくすう</rt></ruby>の<ruby>処理<rt>しょり</rt></ruby>が<ruby>組<rt>く</rt></ruby>み<ruby>合<rt>あ</rt></ruby>わさったプログラムの<ruby>結果<rt>けっか</rt></ruby>を<ruby>予測<rt>よそく</rt></ruby>することで、プログラミングの<ruby>理解<rt>りかい</rt></ruby>が<ruby>深<rt>ふか</rt></ruby>まります。\nループと<ruby>条件<rt>じょうけん</rt></ruby>が<ruby>混<rt>ま</rt></ruby>ざったプログラムを<ruby>読<rt>よ</rt></ruby>み<ruby>解<rt>と</rt></ruby>けるようになりましょう。',
          description: 'このプログラムを<ruby>実行<rt>じっこう</rt></ruby>すると、ひよこは<ruby>何回<rt>なんかい</rt></ruby>「ピヨピヨ」と<ruby>言<rt>い</rt></ruby>うでしょう？\n\n<span style="color: #ea580c; font-weight: bold;">4<ruby>回<rt>かい</rt></ruby></span>ループする\n  ・もしループ<ruby>回数<rt>かいすう</rt></ruby>が<span style="color: #ea580c; font-weight: bold;">2</span>より<ruby>大<rt>おお</rt></ruby>きければ「ピヨピヨ」と<ruby>言<rt>い</rt></ruby>う',
          difficulty: 5,
          order: 3,
          imageUrl: '/虫眼鏡を除くひよこ.png',
          correctAnswerX: 2,
          correctAnswerY: 0,
          initial_sb3_data: {
            targets: [{
              isStage: false,
              name: "Sprite1",
              blocks: {},
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
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
                    MESSAGE: [1, [10, "2"]]
                  },
                  fields: {},
                  topLevel: true
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          }
        },
        {
          type: 'find_error',
          title: '<ruby>問題<rt>もんだい</rt></ruby>4: <ruby>総合<rt>そうごう</rt></ruby>バグ<ruby>修正<rt>しゅうせい</rt></ruby>',
          learningObjective: '<ruby>複雑<rt>ふくざつ</rt></ruby>なプログラムの<ruby>間違<rt>まちが</rt></ruby>いを<ruby>見<rt>み</rt></ruby>つけて<ruby>直<rt>なお</rt></ruby>すことは、プログラマーの<ruby>重要<rt>じゅうよう</rt></ruby>なスキルです。\nこれまで<ruby>学<rt>まな</rt></ruby>んだすべての<ruby>知識<rt>ちしき</rt></ruby>を<ruby>使<rt>つか</rt></ruby>って、バグを<ruby>修正<rt>しゅうせい</rt></ruby>しましょう。',
          description: 'ひよこが<ruby>正方形<rt>せいほうけい</rt></ruby>を<ruby>描<rt>か</rt></ruby>くプログラムですが、<ruby>間違<rt>まちが</rt></ruby>っています！\n\n<span style="color: #dc2626; font-weight: bold;"><ruby>間違<rt>まちが</rt></ruby>いを<ruby>見<rt>み</rt></ruby>つけて<ruby>直<rt>なお</rt></ruby>そう：</span>\n・ループ<ruby>回数<rt>かいすう</rt></ruby>が<ruby>違<rt>ちが</rt></ruby>う\n・<ruby>角度<rt>かくど</rt></ruby>が<ruby>違<rt>ちが</rt></ruby>う\n\n<span style="color: #16a34a; font-weight: bold;"><ruby>正<rt>ただ</rt></ruby>しくは：</span>\n<span style="color: #ea580c; font-weight: bold;">4<ruby>回<rt>かい</rt></ruby></span>ループ、<ruby>毎回<rt>まいかい</rt></ruby><span style="color: #ea580c; font-weight: bold;">50<ruby>歩<rt>ほ</rt></ruby></span><ruby>進<rt>すす</rt></ruby>んで<span style="color: #ea580c; font-weight: bold;">90<ruby>度<rt>ど</rt></ruby></span><ruby>回<rt>まわ</rt></ruby>る',
          difficulty: 5,
          order: 4,
          imageUrl: '/はてなマークを浮かべるひよこ.png',
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
                  opcode: "pen_penDown",
                  next: "block3",
                  parent: "block1",
                  inputs: {},
                  fields: {}
                },
                "block3": {
                  opcode: "control_repeat",
                  next: null,
                  parent: "block2",
                  inputs: {
                    TIMES: [1, [4, "3"]],
                    SUBSTACK: [2, "block4"]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "motion_movesteps",
                  next: "block5",
                  parent: "block3",
                  inputs: {
                    STEPS: [1, [4, "50"]]
                  },
                  fields: {}
                },
                "block5": {
                  opcode: "motion_turnright",
                  next: null,
                  parent: "block4",
                  inputs: {
                    DEGREES: [1, [4, "120"]]
                  },
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
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
                  opcode: "pen_penDown",
                  next: "block3",
                  parent: "block1",
                  inputs: {},
                  fields: {}
                },
                "block3": {
                  opcode: "control_repeat",
                  next: null,
                  parent: "block2",
                  inputs: {
                    TIMES: [1, [4, "4"]],
                    SUBSTACK: [2, "block4"]
                  },
                  fields: {}
                },
                "block4": {
                  opcode: "motion_movesteps",
                  next: "block5",
                  parent: "block3",
                  inputs: {
                    STEPS: [1, [4, "50"]]
                  },
                  fields: {}
                },
                "block5": {
                  opcode: "motion_turnright",
                  next: null,
                  parent: "block4",
                  inputs: {
                    DEGREES: [1, [4, "90"]]
                  },
                  fields: {}
                }
              },
              currentCostume: 0,
              costumes: [{ name: "costume1", assetId: "default" }],
              x: 0,
              y: 0
            }]
          }
        }
      ];

      for (const problem of chapter4Problems) {
        await client.query(`
          INSERT INTO problems (chapter_id, problem_type, title, learning_objective, description, initial_sb3_data, correct_sb3_data, correct_answer_x, correct_answer_y, max_score, difficulty_level, order_number, image_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 100, $10, $11, $12)
        `, [
          chapter4Id,
          problem.type,
          problem.title,
          problem.learningObjective || null,
          problem.description,
          JSON.stringify(problem.initial_sb3_data),
          JSON.stringify(problem.correct_sb3_data),
          problem.correctAnswerX || null,
          problem.correctAnswerY || null,
          problem.difficulty,
          problem.order,
          problem.imageUrl || null
        ]);
      }
      console.log('✓ Chapter 4: 4 problems created');
    }

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
