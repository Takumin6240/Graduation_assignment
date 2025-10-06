# 作業記録: 予測問題の座標入力機能実装 + 管理者ダッシュボードUI改善

**日付**: 2025年10月6日
**作業者**: Claude Code
**作業時間**: 約2時間

## 概要

予測問題(問題2)の回答方式をSB3ファイルアップロードからX/Y座標の直接入力に変更しました。また、管理者ダッシュボードの問題管理UIをモーダル形式に改善し、使いやすさと統一感を向上させました。

## 実装内容

### 1. データベーススキーマ変更

**ファイル**: `backend/src/db/migrate.js`

```sql
-- problems テーブルに座標フィールドを追加
ALTER TABLE problems ADD COLUMN correct_answer_x INTEGER;
ALTER TABLE problems ADD COLUMN correct_answer_y INTEGER;
```

- 予測問題の正解座標を保存するための列を追加
- 既存テーブルへの追加を安全に行うため、存在チェック付きのDO文を使用

### 2. シードデータ更新

**ファイル**: `backend/src/db/seed.js`

問題2(予測問題)に正解座標を設定:
- `correctAnswerX: 30`
- `correctAnswerY: 0`

INSERT文を更新して新しい列に対応。

### 3. 管理者API実装

**ファイル**: `backend/src/controllers/adminController.js`

新しいエンドポイント `updateCorrectAnswer` を追加:

```javascript
const updateCorrectAnswer = async (req, res) => {
  const { problemId } = req.params;
  const { correctAnswerX, correctAnswerY } = req.body;

  // 座標の検証
  if (correctAnswerX === undefined || correctAnswerY === undefined) {
    return res.status(400).json({ error: '正解の座標が指定されていません' });
  }

  // データベース更新
  const result = await pool.query(
    `UPDATE problems
     SET correct_answer_x = $1, correct_answer_y = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id, title, correct_answer_x, correct_answer_y`,
    [correctAnswerX, correctAnswerY, problemId]
  );

  res.json({
    message: '正解の座標が正常に更新されました',
    problem: result.rows[0]
  });
};
```

**ルーティング** (`backend/src/routes/admin.js`):
```javascript
router.patch('/problems/:problemId/correct-answer', updateCorrectAnswer);
```

### 4. フロントエンド API統合

**ファイル**: `frontend/src/services/api.ts`

```typescript
updateCorrectAnswer: (problemId: number, correctAnswerX: number, correctAnswerY: number) =>
  api.patch(`/admin/problems/${problemId}/correct-answer`, { correctAnswerX, correctAnswerY }),
```

### 5. 管理者ダッシュボードUI改善

**ファイル**: `frontend/src/pages/AdminProblems.tsx`

#### モーダル形式の実装

全ての編集機能をモーダルポップアップで統一:

1. **URL編集モーダル**
   - Scratch エディタURLを編集
   - 青色のアクションボタン

2. **正解座標編集モーダル** (予測問題のみ)
   - X座標とY座標の入力フィールド
   - 紫色のアクションボタン

3. **正解ファイル更新モーダル**
   - SB3ファイルアップロード
   - プライマリカラーのアクションボタン

#### モーダルの特徴

```typescript
// モーダル状態管理
const [modalType, setModalType] = useState<'url' | 'answer' | 'upload' | null>(null);
const [selectedProblemForModal, setSelectedProblemForModal] = useState<Problem | null>(null);

// モーダルを開く
const openModal = (type: 'url' | 'answer' | 'upload', problem: Problem) => {
  setModalType(type);
  setSelectedProblemForModal(problem);
  // 各タイプに応じた初期値設定
};

// モーダルを閉じる
const closeModal = () => {
  setModalType(null);
  setSelectedProblemForModal(null);
  // 全ての入力をリセット
};
```

- **背景オーバーレイ**: 半透明の黒背景で焦点を明確化
- **クリックアウェイ**: モーダル外をクリックで閉じる
- **問題タイトル表示**: 編集対象を明確化
- **統一されたボタンデザイン**: 保存/キャンセルボタンが並列配置

### 6. 予測問題の解答UI実装

**ファイル**: `frontend/src/pages/ProblemDetail.tsx`

#### 問題タイプに応じた条件分岐

```typescript
// 状態管理
const [answerX, setAnswerX] = useState<string>('');
const [answerY, setAnswerY] = useState<string>('');

// 解答方法の説明を問題タイプで切り替え
{problem.problem_type === 'predict' ? (
  <ol className="list-decimal list-inside space-y-2 text-gray-700">
    <li>「Scratchエディタを開く」ボタンでプログラムを確認</li>
    <li>プログラムがどう動くか予測します</li>
    <li>スプライトの最終的なX座標とY座標を計算します</li>
    <li>下の解答欄にX座標とY座標を入力して提出</li>
  </ol>
) : (
  // 他の問題タイプ用の説明
)}
```

#### 座標入力フォーム

```typescript
{problem.problem_type === 'predict' ? (
  <div className="mb-6">
    <label className="block text-gray-700 font-medium mb-4">
      スプライトの最終位置を入力してください
    </label>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm text-gray-600 mb-2">X座標</label>
        <input
          type="number"
          value={answerX}
          onChange={(e) => setAnswerX(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
          placeholder="例: 30"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-2">Y座標</label>
        <input
          type="number"
          value={answerY}
          onChange={(e) => setAnswerY(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
          placeholder="例: 0"
          required
        />
      </div>
    </div>
  </div>
) : (
  // SB3ファイルアップロード (他の問題タイプ)
)}
```

### 7. 提出処理の採点ロジック

**ファイル**: `backend/src/controllers/submissionController.js`

予測問題専用の採点ロジックを実装:

```javascript
const submitSolution = async (req, res) => {
  const { problemId } = req.params;
  const userId = req.user.userId;
  const { hintUsageCount = 0, timeSpent = 0, answerX, answerY } = req.body;

  // 問題タイプを取得
  const problemResult = await pool.query(
    'SELECT problem_type, correct_sb3_data, correct_answer_x, correct_answer_y, max_score FROM problems WHERE id = $1',
    [problemId]
  );

  const problem = problemResult.rows[0];
  let isCorrect = false;
  let score = 0;
  let message = '';

  // 予測問題の場合
  if (problem.problem_type === 'predict') {
    const submittedX = parseInt(answerX);
    const submittedY = parseInt(answerY);
    const correctX = problem.correct_answer_x;
    const correctY = problem.correct_answer_y;

    const xMatch = submittedX === correctX;
    const yMatch = submittedY === correctY;

    if (xMatch && yMatch) {
      isCorrect = true;
      score = 100;
      message = '完璧です！素晴らしい！';
    } else if (xMatch || yMatch) {
      isCorrect = false;
      score = 50;
      message = xMatch
        ? 'X座標は正解です！Y座標を確認してください。'
        : 'Y座標は正解です！X座標を確認してください。';
    } else {
      isCorrect = false;
      score = 0;
      message = 'もう一度計算してみましょう。';
    }

    // 座標をJSONとして保存
    submittedData = { answerX: submittedX, answerY: submittedY };
  } else {
    // 他の問題タイプ (SB3ファイル)
    submittedData = await parseSB3File(req.file.buffer);
    const result = compareScratchPrograms(submittedData, problem.correct_sb3_data);
    isCorrect = result.isCorrect;
    score = result.score;
    message = result.message;
  }

  // 以降の処理は共通 (試行回数記録、EXP付与など)
};
```

#### 採点基準

- **両方正解**: 100点 (完璧です！)
- **片方正解**: 50点 (部分点、どちらが間違っているか指摘)
- **両方不正解**: 0点 (もう一度計算を促す)

## データベースマイグレーション実行

```bash
# マイグレーション実行
docker-compose exec backend npm run migrate

# シードデータ投入
docker-compose exec backend node src/db/seed.js
```

**実行結果**:
```
✓ Database connected successfully
Running database migrations...
✓ Migrations completed successfully

Seeding database...
✓ Admin user created (username: admin, password: admin123)
✓ Chapter 1 created
✓ 4 problems created
✓ Database seeding completed successfully
```

## UI/UX改善のポイント

### Before (改善前)

- ボタンをクリックするとテーブル内で入力フィールドが展開
- テーブルレイアウトが変形して見づらい
- 編集中に他の問題が見えにくい
- 統一感のないUI

### After (改善後)

✅ **モーダルポップアップ方式**
- テーブルレイアウトが安定
- 編集対象に集中できる
- どの問題を編集しているか明確

✅ **統一されたデザイン**
- 全ての編集機能が同じパターン
- 色分けで機能を識別しやすい
  - 青: URL編集
  - 紫: 座標編集
  - プライマリ: ファイル更新

✅ **使いやすさ向上**
- 大きな入力フィールド
- 明確な保存/キャンセルボタン
- モーダル外クリックで閉じる
- 問題タイトルで編集対象を確認

## テスト項目

### 管理者側

- [x] URL編集モーダルが正しく開く
- [x] 正解座標編集モーダルが予測問題のみ表示される
- [x] 正解ファイル更新モーダルが正しく動作する
- [x] 各モーダルで値を保存できる
- [x] モーダル外クリックで閉じる
- [x] キャンセルボタンで閉じる

### 学生側

- [x] 予測問題でX/Y座標入力欄が表示される
- [x] 他の問題タイプではSB3ファイルアップロードが表示される
- [x] 座標入力で提出できる
- [x] 正解時に100点が表示される
- [x] 片方正解時に50点とフィードバックが表示される
- [x] 不正解時に0点とフィードバックが表示される

## 技術的な工夫

1. **TypeScriptの型安全性**
   - `Problem`インターフェースに`correct_answer_x`と`correct_answer_y`を追加
   - `null`チェックで安全な値変換

2. **モーダル管理の単一責任**
   - `openModal()`で初期化を一元管理
   - `closeModal()`でクリーンアップを一元管理

3. **条件分岐の明確化**
   - 問題タイプで解答UI、提出処理、採点ロジックを完全分離
   - 既存機能への影響を最小化

4. **UXの細かい配慮**
   - 入力値のプレビュー表示
   - ファイル選択時の確認メッセージ
   - フィードバックメッセージで次のアクションを促す

## 影響範囲

### 変更されたファイル

**バックエンド**:
- `backend/src/db/migrate.js` (スキーマ追加)
- `backend/src/db/seed.js` (座標データ追加)
- `backend/src/controllers/adminController.js` (新API追加)
- `backend/src/routes/admin.js` (ルート追加)
- `backend/src/controllers/submissionController.js` (採点ロジック追加)

**フロントエンド**:
- `frontend/src/services/api.ts` (API関数追加)
- `frontend/src/pages/AdminProblems.tsx` (完全リファクタリング)
- `frontend/src/pages/ProblemDetail.tsx` (条件分岐追加)

### 影響を受けないもの

- 他の問題タイプ(fill_blank, find_error, mission)は従来通りSB3ファイルで動作
- 既存の提出履歴、EXP計算、試行回数記録は全て正常動作
- 管理者の他の機能(ユーザー管理、統計など)には影響なし

## 今後の拡張性

この実装により以下が可能になりました:

1. **他の問題タイプへの展開**
   - 座標入力方式を他の問題でも利用可能
   - 数値入力、テキスト入力など多様な解答形式に対応可能

2. **モーダルパターンの再利用**
   - 他の管理画面でも同じモーダルパターンを適用可能
   - 一貫性のある管理UI

3. **採点ロジックの柔軟性**
   - 問題タイプごとに異なる採点基準を設定可能
   - 部分点の付与も容易

## 参考スクリーンショット

### 管理者ダッシュボード - 正解座標編集モーダル
```
┌─────────────────────────────────┐
│  正解座標編集                    │
│  問題: 問題2: ネコはどこかな?    │
│                                  │
│  X座標     Y座標                 │
│  [  30  ]  [  0  ]              │
│                                  │
│  [ 保存 ]  [ キャンセル ]       │
└─────────────────────────────────┘
```

### 学生画面 - 予測問題解答欄
```
┌─────────────────────────────────┐
│  解答を提出                      │
│                                  │
│  スプライトの最終位置を          │
│  入力してください                │
│                                  │
│  X座標          Y座標            │
│  [ 例: 30 ]    [ 例: 0  ]       │
│                                  │
│  [ 提出する ]                    │
└─────────────────────────────────┘
```

## まとめ

予測問題の座標入力機能と管理者ダッシュボードのUI改善により、以下を達成しました:

✅ 小学生にも使いやすい直感的な座標入力UI
✅ 管理者が正解を簡単に設定できるモーダルインターフェース
✅ 統一感のあるプロフェッショナルな管理画面
✅ 既存機能を破壊しない安全な拡張
✅ 将来の機能追加に対応できる柔軟な設計

これにより、システムの教育効果と管理効率が大幅に向上しました。
