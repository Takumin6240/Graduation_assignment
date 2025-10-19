# 管理者・学生管理システム実装ログ

**作業日時**: 2025年10月14日 11:50
**作業内容**: 管理者による学生管理システムの実装

---

## 概要

小学生のログインページから管理者機能へのアクセスを完全に分離し、各管理者が自分の配下の学生のみを管理できるシステムを実装しました。

---

## 実装した機能

### 1. データベーススキーマ変更

#### ファイル: `backend/src/db/migrate.js`

- **変更内容**:
  - `admins`テーブルを`users`テーブルより先に定義（外部キー制約のため）
  - `users`テーブルに`admin_id`カラムを追加（管理者との紐付け）
  - `admin_id`カラムにインデックスを作成（パフォーマンス向上）

```sql
-- Admins table (create first as users references it)
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  admin_username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (students)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  grade INTEGER CHECK (grade >= 1 AND grade <= 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2. バックエンドAPI実装

#### 2.1 管理者登録API

**ファイル**: `backend/src/controllers/authController.js`

- **エンドポイント**: `POST /api/auth/admin/register`
- **機能**: 新しい管理者アカウントを作成
- **パラメータ**: `username`, `password`
- **レスポンス**: JWT token + 管理者情報

```javascript
const registerAdmin = async (req, res) => {
  const { username, password } = req.body;
  // バリデーション、パスワードハッシュ化、DB登録
  // JWTトークン生成して返却
};
```

**ルート追加**: `backend/src/routes/auth.js`
```javascript
router.post('/admin/register', registerAdmin);
```

---

#### 2.2 学生作成API（管理者専用）

**ファイル**: `backend/src/controllers/adminController.js`

- **エンドポイント**: `POST /api/admin/students`
- **認証**: `adminAuthMiddleware`必須
- **機能**: 管理者が自分の配下の学生アカウントを作成
- **パラメータ**: `username`, `password`, `nickname`, `grade`
- **処理**:
  - 管理者のIDを`req.admin.adminId`から取得
  - 学生のレコードに`admin_id`を設定してDB登録

```javascript
const createStudent = async (req, res) => {
  const { username, password, nickname, grade } = req.body;
  const adminId = req.admin.adminId;

  // バリデーション、パスワードハッシュ化
  // admin_idを含めてDB登録
};
```

**ルート追加**: `backend/src/routes/admin.js`
```javascript
router.post('/students', createStudent);
```

---

#### 2.3 管理者API群の修正（学生フィルタリング）

**ファイル**: `backend/src/controllers/adminController.js`

各管理者が自分の学生のみを閲覧・管理できるように既存APIを修正:

##### getAllUsers
- **変更**: `WHERE u.admin_id = $1`を追加
- **効果**: 自分が作成した学生のみを取得

##### getUserDetails
- **変更**: `WHERE id = $1 AND admin_id = $2`を追加
- **効果**: 他の管理者の学生にアクセス不可

##### getStatistics
- **変更**: 全ての集計クエリに`WHERE admin_id = $1`または`JOIN`で管理者フィルタを追加
- **効果**: 自分の学生のデータのみ集計

```javascript
// 例: getAllUsers
const getAllUsers = async (req, res) => {
  const adminId = req.admin.adminId;

  const result = await pool.query(`
    SELECT ...
    FROM users u
    LEFT JOIN submissions s ON u.id = s.user_id
    WHERE u.admin_id = $1
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `, [adminId]);
};
```

---

### 3. フロントエンド実装

#### 3.1 管理者登録ページ作成

**ファイル**: `frontend/src/pages/AdminRegister.tsx`（新規作成）

- **URL**: `/admin/register`
- **機能**:
  - ユーザー名、パスワード、パスワード確認入力
  - パスワード一致チェック
  - 最小文字数バリデーション（6文字以上）
  - 登録後、自動ログインして管理者ダッシュボードへ遷移

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // パスワード一致チェック
  if (password !== confirmPassword) {
    setError('パスワードが一致しません');
    return;
  }

  // 登録
  await authAPI.registerAdmin(username, password);

  // 自動ログイン
  await loginAdmin(username, password);

  // ダッシュボードへ遷移
  navigate('/admin/dashboard');
};
```

---

#### 3.2 学生ログインページの修正

**ファイル**: `frontend/src/pages/Login.tsx`

- **削除**: 管理者ログインへのリンク
- **削除**: 新規登録へのリンク
- **追加**: 「ログインIDとパスワードは先生から受け取ってください」メッセージ

**変更前**:
```tsx
<Link to="/register">新規登録はこちら</Link>
<Link to="/admin/login">管理者ログイン</Link>
```

**変更後**:
```tsx
<p className="text-gray-600 text-sm">
  ログインIDとパスワードは先生から受け取ってください
</p>
```

---

#### 3.3 ホームページの修正

**ファイル**: `frontend/src/pages/Home.tsx`

- **削除**: 「新規登録して始める」ボタン
- **残存**: 「ログイン」ボタンのみ
- **追加**: 「ログインIDとパスワードは先生から受け取ってください」メッセージ

---

#### 3.4 ヘッダーの修正

**ファイル**: `frontend/src/components/Header.tsx`

- **削除**: 「新規登録」リンク
- **残存**: 「ログイン」ボタンのみ

---

#### 3.5 管理者ログインページの修正

**ファイル**: `frontend/src/pages/AdminLogin.tsx`

- **追加**: 管理者登録ページへのリンク
- **削除**: デフォルト管理者アカウント情報の表示

```tsx
<Link to="/admin/register">新規登録</Link>
```

---

#### 3.6 管理者ユーザー管理ページに学生作成機能追加

**ファイル**: `frontend/src/pages/AdminUsers.tsx`

- **追加機能**:
  - 「+ 学生を作成」ボタン
  - 学生作成モーダルフォーム（ユーザー名、パスワード、ニックネーム、学年）
  - 作成成功後、自動的にユーザーリストを再読み込み

```tsx
const handleCreateStudent = async (e: React.FormEvent) => {
  await adminAPI.createStudent(
    createForm.username,
    createForm.password,
    createForm.nickname,
    createForm.grade
  );

  setShowCreateModal(false);
  await fetchUsers(); // リスト再読み込み
};
```

**モーダルUI**:
- ユーザー名入力
- パスワード入力
- ニックネーム入力
- 学年選択（1〜6年）
- キャンセル/作成ボタン

---

#### 3.7 API関数の追加

**ファイル**: `frontend/src/services/api.ts`

```typescript
// Auth API
export const authAPI = {
  // 既存...
  registerAdmin: (username: string, password: string) =>
    api.post('/auth/admin/register', { username, password }),
};

// Admin API
export const adminAPI = {
  createStudent: (username: string, password: string, nickname: string, grade: number) =>
    api.post('/admin/students', { username, password, nickname, grade }),
  // 既存...
};
```

---

#### 3.8 ルート設定

**ファイル**: `frontend/src/App.tsx`

- **追加**: `/admin/register`ルート
- **削除**: `/register`ルート（学生用登録ページ）
- **削除**: `Register`コンポーネントのインポート

```tsx
<Route path="/admin/register" element={<AdminRegister />} />
```

---

## システムフロー

### 管理者の利用フロー

1. **初回利用**:
   - `http://localhost:3000/admin/register`で管理者アカウント作成
   - 自動的に管理者ダッシュボードへ遷移

2. **学生アカウント作成**:
   - 管理者ダッシュボード → ユーザー管理
   - 「+ 学生を作成」ボタンをクリック
   - 学生情報を入力して作成
   - 作成したIDとパスワードを学生に伝える

3. **学生管理**:
   - 自分が作成した学生のみ表示・管理可能
   - 他の管理者の学生は表示されない

### 学生の利用フロー

1. **ログイン**:
   - `http://localhost:3000/login`でログイン
   - 管理者から受け取ったIDとパスワードを使用
   - 学生登録機能へのアクセスは不可

2. **学習**:
   - チャプター選択 → 問題に取り組む → 提出

---

## セキュリティ改善

1. **アクセス制御**:
   - 小学生用ページから管理者機能への遷移を完全に削除
   - 学生は自分で登録できず、管理者によってのみ作成される

2. **データ分離**:
   - 各管理者は自分の学生のデータのみアクセス可能
   - データベースレベルで`admin_id`による制限

3. **認証分離**:
   - 学生用認証: `authMiddleware`
   - 管理者用認証: `adminAuthMiddleware`
   - JWTトークンに`role`を含めて区別

---

## データベースマイグレーション手順

```bash
# コンテナを停止してボリュームを削除（既存データをクリア）
docker compose down -v

# コンテナを起動
docker compose up -d

# マイグレーション実行
docker compose exec backend npm run migrate

# シードデータ投入（デフォルト管理者アカウント作成）
docker compose exec backend node src/db/seed.js
```

---

## 変更ファイル一覧

### バックエンド
- `backend/src/db/migrate.js` - スキーマ変更（admin_id追加、テーブル順序修正）
- `backend/src/controllers/authController.js` - registerAdmin関数追加
- `backend/src/controllers/adminController.js` - createStudent関数追加、既存関数修正
- `backend/src/routes/auth.js` - `/admin/register`ルート追加
- `backend/src/routes/admin.js` - `/students`ルート追加

### フロントエンド
- `frontend/src/pages/AdminRegister.tsx` - **新規作成**
- `frontend/src/pages/Login.tsx` - リンク削除、メッセージ追加
- `frontend/src/pages/Home.tsx` - 新規登録ボタン削除
- `frontend/src/pages/AdminLogin.tsx` - 管理者登録リンク追加
- `frontend/src/pages/AdminUsers.tsx` - 学生作成機能追加
- `frontend/src/components/Header.tsx` - 新規登録リンク削除
- `frontend/src/services/api.ts` - registerAdmin, createStudent関数追加
- `frontend/src/App.tsx` - ルート変更

---

## テスト方法

### 1. 管理者アカウント作成
```
URL: http://localhost:3000/admin/register
入力: username, password
期待: 自動ログイン → 管理者ダッシュボード表示
```

### 2. 学生アカウント作成
```
URL: http://localhost:3000/admin/users
操作: 「+ 学生を作成」ボタン → フォーム入力 → 作成
期待: 学生がリストに追加される
```

### 3. 学生ログイン
```
URL: http://localhost:3000/login
入力: 管理者が作成したIDとパスワード
期待: ログイン成功 → チャプター一覧表示
```

### 4. 管理者分離確認
```
1. 管理者A でログイン → 学生1を作成
2. ログアウト
3. 管理者B でログイン → 学生2を作成
4. 管理者B のユーザー管理画面で学生2のみ表示されることを確認
```

---

## 今後の改善提案

1. **学生パスワードの一括生成機能**
   - ランダムパスワード生成機能
   - CSV一括インポート機能

2. **学生アカウントの編集・削除機能**
   - パスワードリセット
   - 学年の更新
   - アカウントの無効化/削除

3. **管理者権限の階層化**
   - スーパー管理者（全学生閲覧可能）
   - 一般管理者（自分の学生のみ）

4. **学生情報のエクスポート**
   - CSV出力
   - 学習進捗レポート生成

---

## 備考

- すべての変更は`admin_id`カラムの追加を前提としています
- 既存の学生データには`admin_id`が`NULL`となります
- 既存学生を管理者に紐付ける場合は、手動でSQLを実行する必要があります

```sql
-- 既存学生を特定の管理者に紐付ける例
UPDATE users SET admin_id = 1 WHERE admin_id IS NULL;
```

---

**作業完了日時**: 2025年10月14日 11:50
**実装者**: Claude Code
