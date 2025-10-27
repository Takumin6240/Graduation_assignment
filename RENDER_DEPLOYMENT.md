# Renderデプロイ手順（Frontend + Backend + Database）

## 📋 デプロイ構成

このプロジェクトは**Render**のみで完結する構成でデプロイします：

- **Frontend**: Render Static Site（React）
- **Backend**: Render Web Service（Node.js + Express）
- **Database**: Render PostgreSQL

すべてのサービスが同じプラットフォーム上で動作するため、設定が簡単で管理しやすくなっています。

---

## 🚀 全体の流れ

1. GitHubにコードをプッシュ
2. RenderでBlueprint（render.yaml）を使用して全サービスを一括デプロイ
3. 環境変数を確認・調整
4. データベースマイグレーションと初期データ投入

---

## ステップ1: GitHubにプッシュ

```bash
cd "/mnt/c/Users/hirta/OneDrive/ドキュメント/Graduation_assignment"

# 変更をコミット
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

---

## ステップ2: Renderアカウント作成

1. [Render](https://render.com/)にアクセス
2. **GitHubアカウントでサインアップ**
3. リポジトリへのアクセスを許可

---

## ステップ3: Blueprintで全サービスをデプロイ

### 3-1. Blueprint Instanceの作成

1. Renderダッシュボードで **「Blueprints」** をクリック
2. **「New Blueprint Instance」** をクリック
3. **リポジトリを選択**（GitHub連携済みのリポジトリから選択）
4. **Blueprint File**: `render.yaml` （自動検出されます）
5. **「Apply」** をクリック

これで以下のサービスが**自動的に作成**されます：
- ✅ PostgreSQLデータベース（`scratch-learning-db`）
- ✅ バックエンドAPI（`scratch-learning-backend`）
- ✅ フロントエンド（`scratch-learning-frontend`）

### 3-2. 環境変数の自動設定

Blueprint（`render.yaml`）により、以下の環境変数が**自動的に設定**されます：

#### Backend
- `NODE_ENV`: production
- `PORT`: 5000
- `DATABASE_URL`: PostgreSQLデータベースから自動取得
- `JWT_SECRET`: 自動生成されるランダム文字列
- `FRONTEND_URL`: フロントエンドサービスのURLから自動取得

#### Frontend
- `REACT_APP_API_URL`: バックエンドサービスのURLから自動取得

⚠️ **注意**: `FRONTEND_URL`には`https://`プレフィックスを手動で追加する必要があります（後述）

---

## ステップ4: デプロイの確認

### 4-1. デプロイ状況を確認

1. Renderダッシュボードで各サービスの状態を確認
2. デプロイには **5-15分** かかります
3. すべてのサービスが **「Live」** になるまで待つ

デプロイ順序：
1. **PostgreSQL Database** → 最初にデプロイ
2. **Backend** → データベース接続後にデプロイ
3. **Frontend** → バックエンドURL取得後にデプロイ

### 4-2. ログの確認

各サービスの **「Logs」** タブで以下を確認：

#### Backend ログ
```
✓ Migrations completed successfully
Server running on port 5000
```

#### Frontend ログ
```
Creating an optimized production build...
Build completed successfully
```

---

## ステップ5: 環境変数の設定（重要）

⚠️ **このステップは必須です。環境変数を正しく設定しないとアプリが動作しません。**

### 5-1. Backend の FRONTEND_URL を設定

1. **Backend サービス** を開く
2. **「Environment」** タブをクリック
3. `FRONTEND_URL`を手動で追加：
   ```
   FRONTEND_URL=https://scratch-learning-frontend.onrender.com
   ```
   （実際のフロントエンドURLに置き換えてください）
4. **「Save Changes」** をクリック
5. 自動的に再デプロイされます

### 5-2. Frontend の REACT_APP_API_URL を設定

⚠️ **最重要**: Reactアプリはビルド時に環境変数を埋め込むため、この設定が必須です。

1. **Frontend サービス** を開く
2. **「Environment」** タブをクリック
3. `REACT_APP_API_URL`を手動で追加：
   ```
   REACT_APP_API_URL=https://scratch-learning-backend.onrender.com
   ```
   （実際のバックエンドURLに置き換えてください）
4. **「Save Changes」** をクリック
5. **Manual Deploy** → **「Deploy latest commit」** をクリックして再ビルド

⚠️ **重要事項**:
- `https://`プレフィックスを必ず含める
- 末尾に`/`を含めない
- フロントエンドは環境変数変更後に**必ず再デプロイ**が必要（ビルド時に環境変数が埋め込まれるため）

---

## ステップ6: データベースマイグレーションと初期データ投入

### 6-1. マイグレーションの確認

バックエンドの`Dockerfile`に記載されているため、デプロイ時に**自動実行**されます：

```dockerfile
CMD ["sh", "-c", "npm run migrate && npm start"]
```

Backend サービスの「Logs」で以下を確認：
```
✓ Migrations completed successfully
```

### 6-2. 初期データ投入（管理者アカウント作成）

#### オプション1: Shellで実行（推奨）

1. **Backend サービス** を開く
2. **「Shell」** タブをクリック
3. 以下のコマンドを実行：
   ```bash
   node src/db/seed.js
   ```

#### オプション2: 一時的にDockerfileを変更

`backend/Dockerfile`の最終行を一時的に変更：

```dockerfile
# 一時的に変更
CMD ["sh", "-c", "npm run migrate && node src/db/seed.js && npm start"]
```

デプロイ後、元に戻す：

```dockerfile
# 元に戻す
CMD ["sh", "-c", "npm run migrate && npm start"]
```

---

## ステップ7: 動作確認

### 7-1. フロントエンドにアクセス

1. Frontend サービスのURLにアクセス
   - 例: `https://scratch-learning-frontend.onrender.com`
2. ページが正しく表示されることを確認

### 7-2. 機能テスト

- ✅ ユーザー登録ができる
- ✅ ログインができる（`admin` / `admin123`）
- ✅ Chapter一覧が表示される
- ✅ 問題一覧が表示される
- ✅ 画像が正しく表示される
- ✅ 問題を提出できる
- ✅ スコアとレベルアップが正常に動作する
- ✅ 管理者機能が動作する

---

## 🔧 トラブルシューティング

### フロントエンドでAPIエラーが出る

**原因**: CORS設定が正しくない

**解決策**:
1. Backend の「Logs」でCORSエラーを確認
2. `FRONTEND_URL`がフロントエンドのURLと完全一致しているか確認
3. `https://`を含めているか確認
4. 末尾の`/`がないか確認（`https://example.onrender.com`が正しい）

---

### Backendが起動しない

**原因**: データベース接続エラー

**解決策**:
1. `DATABASE_URL`が正しく設定されているか確認
2. PostgreSQLサービスが起動しているか確認
3. Renderの「Logs」タブでエラーを確認
4. Blueprintから再デプロイを試す

---

### 画像が表示されない

**原因**: 画像ファイルがデプロイされていない

**解決策**:
1. `frontend/public/`に画像があることを確認
2. GitHubにコミット・プッシュされているか確認
3. Renderで再デプロイ

---

### Renderの無料プランでスリープする

**現象**: 15分間アクセスがないとサービスがスリープし、次回アクセス時に起動に15秒かかる

**解決策**:
- 有料プラン（$7/月）にアップグレード
- または、定期的にアクセスするcronジョブを設定（別サービス）
- **Render Cron Job**（無料）を使用して定期的にヘルスチェック

#### Cron Jobの設定方法

1. Renderダッシュボードで **「New +」** → **「Cron Job」**
2. 設定：
   - **Name**: `keep-alive`
   - **Command**: `curl https://scratch-learning-backend.onrender.com/health`
   - **Schedule**: `*/14 * * * *`（14分ごと）
   - **Region**: `Singapore`
3. **「Create Cron Job」** をクリック

これにより、バックエンドが常時起動状態を保ちます。

---

## 💰 料金について

### Render 無料プラン

- **Web Service**: 750時間/月（複数サービスで共有）
- **Static Site**: 100GB帯域/月
- **PostgreSQL**: 1GB、90日間無操作で削除
- **制限**: 15分間アクセスがないとスリープ

### 卒業研究での利用

無料枠で十分カバーできます！ただし、以下の点に注意：

- デモや発表前には一度アクセスしてウォームアップ（スリープ解除）
- 90日以上使わない場合はデータベースが削除されるため、定期的にアクセス

---

## 🔄 コード更新時の手順

### フロントエンド・バックエンドの更新

```bash
# コードを変更
git add .
git commit -m "Update application"
git push origin main
```

→ Renderが**自動的に全サービスを再デプロイ**

Blueprint連携により、GitHubへのプッシュで全サービスが自動更新されます。

---

## 📊 本番環境チェックリスト

### セキュリティ
- [ ] `JWT_SECRET`が強固なランダム文字列
- [ ] CORS設定が適切
- [ ] 環境変数が正しく設定されている
- [ ] データベース接続が暗号化されている

### パフォーマンス
- [ ] 画像の読み込みが速い
- [ ] APIレスポンスが適切（初回アクセス時は15秒かかる場合あり）
- [ ] Cron Jobでスリープを防止している（オプション）

### 機能
- [ ] すべての問題タイプが動作する
- [ ] レベルアップシステムが正常
- [ ] 管理者機能が動作する
- [ ] SB3ファイルのアップロード・ダウンロードが正常

---

## 🎓 卒業研究での利用

### URLの記載

論文やプレゼンには以下を記載：
- **アプリケーションURL**: `https://scratch-learning-frontend.onrender.com`
- **GitHubリポジトリ**: リポジトリのURL

### デモ用アカウント

- **管理者**: `admin` / `admin123`
- **テストユーザー**: 事前に作成

### デモ時の注意点

1. **発表30分前にアクセス**してウォームアップ（スリープ解除）
2. 初回アクセスは15秒程度かかることを事前に説明
3. 画像が多い場合は事前に読み込みを確認

---

## 📝 環境変数一覧

### Backend（Render Web Service）
| 変数名 | 説明 | 設定方法 |
|--------|------|----------|
| NODE_ENV | 環境 | Blueprint自動設定 |
| PORT | ポート | Blueprint自動設定 |
| DATABASE_URL | DB接続URL | Blueprint自動設定 |
| JWT_SECRET | JWT秘密鍵 | Blueprint自動生成 |
| FRONTEND_URL | フロントエンドURL | **手動で`https://`追加が必要** |

### Frontend（Render Static Site）
| 変数名 | 説明 | 設定方法 |
|--------|------|----------|
| REACT_APP_API_URL | バックエンドURL | Blueprint自動設定 |

---

## 🆚 他のプラットフォームとの比較

| | Render（すべて） | Vercel + Render | Railway |
|---|-----------------|-----------------|---------|
| **設定の簡単さ** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **管理の簡単さ** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **フロントエンド速度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **無料枠** | 750時間/月 | Vercel無制限 + Render 750時間 | 500時間/月 |
| **スリープ** | あり（15分） | あり（15分） | なし |
| **プラットフォーム統一** | ✅ 統一 | ❌ 2つのプラットフォーム | ✅ 統一 |

**Renderのみ使用の利点**:
- 1つのプラットフォームで完結
- Blueprint で一括デプロイ
- 環境変数の参照が簡単
- 管理が簡単

---

## 🎉 デプロイ完了！

すべての手順が完了しました。
小学生向けScratch学習システムがインターネットからアクセスできるようになりました！

何か問題があれば、トラブルシューティングセクションを参照してください。

---

## 📚 参考リンク

- [Render公式ドキュメント](https://render.com/docs)
- [Render Blueprint](https://render.com/docs/blueprint-spec)
- [Render無料プラン](https://render.com/docs/free)
