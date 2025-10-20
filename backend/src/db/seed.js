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
        description: 'プログラミングの<ruby>基本<rt>きほん</rt></ruby>は「<ruby>命令<rt>めいれい</rt></ruby>を<ruby>順番<rt>じゅんばん</rt></ruby>に<ruby>実行<rt>じっこう</rt></ruby>すること」です。\nプログラムは<ruby>基本<rt>きほん</rt></ruby><ruby>上<rt>うえ</rt></ruby>から<ruby>順<rt>じゅん</rt></ruby>に<ruby>実行<rt>じっこう</rt></ruby>されるため、<ruby>順番<rt>じゅんばん</rt></ruby>はとても<ruby>重要<rt>じゅうよう</rt></ruby>です。<ruby>実際<rt>じっさい</rt></ruby>に<ruby>問題<rt>もんだい</rt></ruby>を<ruby>解<rt>と</rt></ruby>いて<ruby>確認<rt>かくにん</rt></ruby>してみましょう\nネコを<ruby>右<rt>みぎ</rt></ruby>に50<ruby>歩<rt>ほ</rt></ruby><ruby>動<rt>うご</rt></ruby>かす→こんにちは!と2<ruby>秒<rt>びょう</rt></ruby><ruby>言<rt>い</rt></ruby>う→100<ruby>歩<rt>ほ</rt></ruby><ruby>動<rt>うご</rt></ruby>かす。プログラムを<ruby>完成<rt>かんせい</rt></ruby>させましょう。\n\nプログラムは「<ruby>緑<rt>みどり</rt></ruby>の<ruby>旗<rt>はた</rt></ruby>がクリックされたとき」から<ruby>始<rt>はじ</rt></ruby>まり、その<ruby>下<rt>した</rt></ruby>に<ruby>繋<rt>つな</rt></ruby>げたブロックが<ruby>上<rt>うえ</rt></ruby>から<ruby>順番<rt>じゅんばん</rt></ruby>に<ruby>実行<rt>じっこう</rt></ruby>されます。\n\nヒント:「◯<ruby>歩<rt>ほ</rt></ruby><ruby>動<rt>うご</rt></ruby>かす」ブロックを<ruby>探<rt>さが</rt></ruby>して<ruby>中<rt>なか</rt></ruby>に<ruby>数字<rt>すうじ</rt></ruby>を<ruby>入<rt>い</rt></ruby>れてみましょう。',
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
        description: '<ruby>問<rt>もん</rt></ruby>１で<ruby>学<rt>まな</rt></ruby>んだように<ruby>上<rt>うえ</rt></ruby>から<ruby>順<rt>じゅん</rt></ruby>にプログラムが<ruby>実行<rt>じっこう</rt></ruby>されることを<ruby>順次<rt>じゅんじ</rt></ruby><ruby>処理<rt>しょり</rt></ruby>と<ruby>言<rt>い</rt></ruby>います。\n<ruby>順次<rt>じゅんじ</rt></ruby><ruby>処理<rt>しょり</rt></ruby>は<ruby>実生活<rt>じっせいかつ</rt></ruby>でもよく<ruby>使<rt>つか</rt></ruby>われています。\n<ruby>例<rt>たと</rt></ruby>えば、カレー<ruby>作<rt>づく</rt></ruby>り(<ruby>火<rt>ひ</rt></ruby>を<ruby>付<rt>つ</rt></ruby>ける→<ruby>野菜<rt>やさい</rt></ruby>を<ruby>炒<rt>いた</rt></ruby>める→<ruby>水<rt>みず</rt></ruby>を<ruby>入<rt>い</rt></ruby>れる→ルーを<ruby>入<rt>い</rt></ruby>れる)も<ruby>順次<rt>じゅんじ</rt></ruby><ruby>処理<rt>しょり</rt></ruby>です。\n<ruby>順番<rt>じゅんばん</rt></ruby>を<ruby>守<rt>まも</rt></ruby>ることはとても<ruby>大切<rt>たいせつ</rt></ruby>ですね!\n\nプログラムがどう<ruby>動<rt>うご</rt></ruby>くか<ruby>予測<rt>よそく</rt></ruby>してみましょう!\nネコが<ruby>最終的<rt>さいしゅうてき</rt></ruby>にどこにいるか<ruby>計算<rt>けいさん</rt></ruby>してください。\nヒント: xというのは<ruby>平面<rt>へいめん</rt></ruby>や<ruby>空間<rt>くうかん</rt></ruby><ruby>上<rt>じょう</rt></ruby>での<ruby>横<rt>よこ</rt></ruby>の<ruby>位置<rt>いち</rt></ruby>、yというのは<ruby>縦<rt>たて</rt></ruby>の<ruby>位置<rt>いち</rt></ruby>を<ruby>表<rt>あらわ</rt></ruby>します。\nx<ruby>座標<rt>ざひょう</rt></ruby>(<ruby>横<rt>よこ</rt></ruby><ruby>位置<rt>いち</rt></ruby>)とy<ruby>座標<rt>ざひょう</rt></ruby>(<ruby>縦<rt>たて</rt></ruby><ruby>位置<rt>いち</rt></ruby>)をそれぞれで<ruby>計算<rt>けいさん</rt></ruby>してみましょう。',
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
        title: '<ruby>問題<rt>もんだい</rt></ruby>3: <ruby>準備<rt>じゅんび</rt></ruby>の<ruby>順番<rt>じゅんばん</rt></ruby>が<ruby>間違<rt>まちが</rt></ruby>っているよ!',
        description: 'プログラムでは「<ruby>順番<rt>じゅんばん</rt></ruby>を<ruby>間違<rt>まちが</rt></ruby>えると、<ruby>思<rt>おも</rt></ruby>った<ruby>通<rt>とお</rt></ruby>りに<ruby>動<rt>うご</rt></ruby>かない」ことがよくあります。\n<ruby>料理<rt>りょうり</rt></ruby>のレシピと<ruby>同<rt>おな</rt></ruby>じで、<ruby>順番<rt>じゅんばん</rt></ruby>が<ruby>大切<rt>たいせつ</rt></ruby>なんです。\n\n<ruby>例<rt>たと</rt></ruby>えば、カレーを<ruby>作<rt>つく</rt></ruby>るとき:\n<ruby>正<rt>ただ</rt></ruby>しい<ruby>順番<rt>じゅんばん</rt></ruby>: <ruby>野菜<rt>やさい</rt></ruby>を<ruby>切<rt>き</rt></ruby>る → <ruby>炒<rt>いた</rt></ruby>める → <ruby>水<rt>みず</rt></ruby>を<ruby>入<rt>い</rt></ruby>れる → ルーを<ruby>入<rt>い</rt></ruby>れる\n<ruby>間違<rt>まちが</rt></ruby>った<ruby>順番<rt>じゅんばん</rt></ruby>: ルーを<ruby>入<rt>い</rt></ruby>れる → <ruby>野菜<rt>やさい</rt></ruby>を<ruby>切<rt>き</rt></ruby>る → ... (うまくいきませんね!)\n\nこのプログラムには<ruby>順番<rt>じゅんばん</rt></ruby>の<ruby>間違<rt>まちが</rt></ruby>いがあります。<ruby>見<rt>み</rt></ruby>つけて<ruby>直<rt>なお</rt></ruby>しましょう!\nネコが<ruby>右<rt>みぎ</rt></ruby>に<ruby>歩<rt>ある</rt></ruby>いてから１<ruby>秒<rt>びょう</rt></ruby><ruby>立<rt>た</rt></ruby>ち<ruby>止<rt>ど</rt></ruby>まり、<ruby>背景<rt>はいけい</rt></ruby>をPartyに<ruby>変更<rt>へんこう</rt></ruby>して、こんにちはと<ruby>言<rt>い</rt></ruby>うように<ruby>直<rt>なお</rt></ruby>してください。\nヒント: <ruby>問題<rt>もんだい</rt></ruby><ruby>文<rt>ぶん</rt></ruby>の<ruby>順序<rt>じゅんじょ</rt></ruby><ruby>通<rt>どお</rt></ruby>りになるように<ruby>整理<rt>せいり</rt></ruby>しましょう。',
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
        title: '<ruby>問題<rt>もんだい</rt></ruby>4: <ruby>階段<rt>かいだん</rt></ruby>を<ruby>登<rt>のぼ</rt></ruby>るプログラムを<ruby>作<rt>つく</rt></ruby>ろう',
        description: '<ruby>階段<rt>かいだん</rt></ruby>を<ruby>登<rt>のぼ</rt></ruby>るプログラムを<ruby>作<rt>つく</rt></ruby>りましょう!\n「<ruby>右<rt>みぎ</rt></ruby>に100<ruby>歩<rt>ほ</rt></ruby> → <ruby>上<rt>うえ</rt></ruby>に80<ruby>歩<rt>ほ</rt></ruby>」の<ruby>動<rt>うご</rt></ruby>きを<ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>して、<ruby>階段<rt>かいだん</rt></ruby>を<ruby>登<rt>のぼ</rt></ruby>ります。\n\n<ruby>今回<rt>こんかい</rt></ruby>は<ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>しブロックを<ruby>使<rt>つか</rt></ruby>わず、<ruby>既<rt>すで</rt></ruby>に<ruby>用意<rt>ようい</rt></ruby>されているブロックを<ruby>並<rt>なら</rt></ruby>べて<ruby>階段<rt>かいだん</rt></ruby>を<ruby>登<rt>のぼ</rt></ruby>ろう。\n<ruby>順次<rt>じゅんじ</rt></ruby><ruby>処理<rt>しょり</rt></ruby>でも、<ruby>同<rt>おな</rt></ruby>じ<ruby>命令<rt>めいれい</rt></ruby>を<ruby>何度<rt>なんど</rt></ruby>も<ruby>並<rt>なら</rt></ruby>べれば<ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>しを<ruby>表現<rt>ひょうげん</rt></ruby>できます。\n\nヒント: １<ruby>秒<rt>びょう</rt></ruby><ruby>待<rt>ま</rt></ruby>つは<ruby>移動<rt>いどう</rt></ruby>するたびに<ruby>使<rt>つか</rt></ruby>いましょう。\n<ruby>右<rt>みぎ</rt></ruby> → <ruby>上<rt>うえ</rt></ruby> → <ruby>右<rt>みぎ</rt></ruby> → <ruby>上<rt>うえ</rt></ruby> → <ruby>右<rt>みぎ</rt></ruby> → <ruby>上<rt>うえ</rt></ruby> → <ruby>右<rt>みぎ</rt></ruby>の<ruby>順番<rt>じゅんばん</rt></ruby>です。',
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
