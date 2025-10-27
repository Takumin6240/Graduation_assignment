# Railwayデプロイ手順

## 📋 準備

### 1. GitHubにプッシュ
まず、すべての変更をGitHubにプッシュしてください：

```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

---

## 🚀 Railwayでのデプロイ手順

### ステップ1: 新規プロジェクト作成

1. [Railway](https://railway.app/)にログイン
2. 「New Project」をクリック
3. 「Deploy from GitHub repo」を選択
4. リポジトリを選択

---

### ステップ2: PostgreSQLサービスを追加

1. プロジェクトダッシュボードで「+ New」をクリック
2. 「Database」→「PostgreSQL」を選択
3. データベースが自動的に作成されます
4. データベースの`DATABASE_URL`をコピー（後で使用）

---

### ステップ3: Backendサービスを追加

#### 1. サービスを追加
- 「+ New」→「GitHub Repo」
- 同じリポジトリを選択

#### 2. ルートディレクトリを設定
- Settings → 「Root Directory」を `backend` に設定

#### 3. ビルド設定
- Settings → 「Build」セクションで以下を確認：
  - Builder: `DOCKERFILE`
  - Dockerfile Path: `Dockerfile.prod`

#### 4. 環境変数を設定
Settings → 「Variables」で以下を追加：

```
NODE_ENV=production
PORT=5000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=【ランダムな文字列を生成】
FRONTEND_URL=【後で設定するフロントエンドのURL】
```

**JWT_SECRETの生成方法：**
```bash
# ターミナルで実行
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 5. デプロイ
- 自動的にデプロイが開始されます
- ログを確認して、デプロイが成功したことを確認
- BackendのURLをコピー（例：`https://your-backend.railway.app`）

---

### ステップ4: Frontendサービスを追加

#### 1. サービスを追加
- 「+ New」→「GitHub Repo」
- 同じリポジトリを選択

#### 2. ルートディレクトリを設定
- Settings → 「Root Directory」を `frontend` に設定

#### 3. ビルド設定
- Settings → 「Build」セクションで以下を確認：
  - Builder: `DOCKERFILE`
  - Dockerfile Path: `Dockerfile.prod`

#### 4. 環境変数を設定
Settings → 「Variables」で以下を追加：

```
REACT_APP_API_URL=【ステップ3でコピーしたBackendのURL】
```

#### 5. デプロイ
- 自動的にデプロイが開始されます
- デプロイが完了したらFrontendのURLをコピー

---

### ステップ5: CORS設定の更新

1. Backendサービスに戻る
2. Settings → 「Variables」
3. `FRONTEND_URL`を更新：
```
FRONTEND_URL=【ステップ4でコピーしたFrontendのURL】
```
4. Backendサービスが自動的に再デプロイされます

---

### ステップ6: データベースマイグレーション

Backendサービスのデプロイログで、マイグレーションが自動実行されたことを確認してください。

もし手動で実行する必要がある場合：
1. Backendサービスを選択
2. 「Settings」→「Deploy」
3. カスタムスタートコマンドを確認：`npm run migrate && npm start`

---

### ステップ7: シードデータの投入（初回のみ）

管理者アカウントなどの初期データを投入する場合：

1. Backendサービスで「Settings」→「Variables」に一時的に追加：
```
RUN_SEED=true
```

2. `backend/Dockerfile.prod`を以下のように一時的に変更：
```dockerfile
CMD ["sh", "-c", "npm run migrate && node src/db/seed.js && npm start"]
```

3. 再デプロイ

4. デプロイ完了後、変更を元に戻す

---

## ✅ 動作確認

### 1. フロントエンドにアクセス
- FrontendのURLにアクセス
- ページが正しく表示されることを確認

### 2. ユーザー登録・ログイン
- 新規ユーザーを登録
- ログインできることを確認

### 3. 問題の表示
- Chapter一覧が表示されることを確認
- 問題一覧が表示されることを確認
- 画像が正しく表示されることを確認

### 4. 問題の提出
- 問題を解いて提出
- スコアとレベルアップが正しく動作することを確認

---

## 🔧 トラブルシューティング

### ビルドエラーが発生する場合

#### Backend
```bash
# ローカルでDockerビルドをテスト
cd backend
docker build -f Dockerfile.prod -t backend-test .
```

#### Frontend
```bash
# ローカルでDockerビルドをテスト
cd frontend
docker build -f Dockerfile.prod -t frontend-test .
```

### データベース接続エラー

1. Backendの環境変数`DATABASE_URL`が正しく設定されているか確認
2. PostgreSQLサービスが起動しているか確認

### CORSエラー

1. Backendの`FRONTEND_URL`が正しいか確認
2. Frontendの`REACT_APP_API_URL`が正しいか確認
3. 両方のサービスを再デプロイ

### 画像が表示されない

1. 画像ファイルが`frontend/public/`にコピーされているか確認
2. Gitにコミット・プッシュされているか確認

---

## 📊 本番環境での確認事項

### セキュリティ
- [ ] `JWT_SECRET`が強固なランダム文字列になっている
- [ ] データベースのパスワードが変更されている
- [ ] CORS設定が適切

### パフォーマンス
- [ ] 画像の読み込みが速い
- [ ] APIレスポンスが適切

### 機能
- [ ] すべての問題タイプが動作する
- [ ] レベルアップシステムが正常
- [ ] 管理者機能が動作する

---

## 💰 料金について

### 無料枠
- **Starter Plan**: 月500時間まで無料
- **PostgreSQL**: 1GBまで無料

### 超過した場合
- 使用量に応じて課金
- ダッシュボードで使用量を確認可能

---

## 🔄 更新手順

コードを更新した場合：

1. GitHubにプッシュ
```bash
git add .
git commit -m "Update: 説明"
git push origin main
```

2. Railwayが自動的にデプロイ
3. デプロイログで成功を確認

---

## 📝 環境変数一覧

### Backend
| 変数名 | 説明 | 例 |
|--------|------|-----|
| NODE_ENV | 環境 | `production` |
| PORT | ポート | `5000` |
| DATABASE_URL | DB接続URL | Railway提供 |
| JWT_SECRET | JWT秘密鍵 | ランダム文字列 |
| FRONTEND_URL | フロントエンドURL | `https://your-app.railway.app` |

### Frontend
| 変数名 | 説明 | 例 |
|--------|------|-----|
| REACT_APP_API_URL | バックエンドURL | `https://your-backend.railway.app` |

---

## 🎓 卒業研究での利用

### URLの記載
論文やプレゼンには以下のURLを記載：
- **アプリケーションURL**: FrontendのURL
- **GitHubリポジトリ**: リポジトリのURL

### デモ
発表時に使用するアカウント：
- 管理者: `admin` / `admin123`
- テストユーザー: 事前に作成しておく

---

以上でデプロイは完了です！🎉
