# 小学生向けScratch学習支援システム

大学卒業研究プロジェクト

## プロジェクト概要

4つの問題形式による体系的なプログラミング教育の実現:
- 📝 **穴埋め問題**: プログラムの一部を推察させる
- 🔮 **予測問題**: コードの実行結果を予測させる
- 🐛 **間違い探し問題**: プログラムの誤りを修正させる
- 🚀 **ミッション型問題**: 知識を応用して創造させる

## 技術スタック

### バックエンド
- Node.js + Express
- PostgreSQL
- JWT認証
- Multer (ファイルアップロード)
- JSZip (SB3ファイル解析)

### フロントエンド
- React 18 + TypeScript
- Tailwind CSS
- Axios
- React Router v6

### インフラ
- Docker + Docker Compose

## セットアップ手順

### 前提条件
- Docker Desktop がインストールされていること
- Git がインストールされていること

### 1. プロジェクトのクローン
```bash
cd /mnt/c/Users/hirta/OneDrive/ドキュメント/卒業課題
```

### 2. 環境変数の設定
```bash
cd backend
cp .env.example .env
# 必要に応じて .env を編集
```

### 3. Dockerコンテナの起動
```bash
# プロジェクトルートに戻る
cd ..

# Dockerコンテナをビルドして起動
docker-compose up --build -d
```

### 4. データベースのマイグレーションとシード
```bash
# マイグレーション実行
docker-compose exec backend npm run migrate

# 初期データ投入
docker-compose exec backend node src/db/seed.js
```

### 5. アプリケーションへのアクセス
- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:5000
- PostgreSQL: localhost:5432

## デフォルトの管理者アカウント
- ユーザー名: `admin`
- パスワード: `admin123`

## 開発

### バックエンドのログ確認
```bash
docker-compose logs -f backend
```

### フロントエンドのログ確認
```bash
docker-compose logs -f frontend
```

### データベースに接続
```bash
docker-compose exec postgres psql -U postgres -d scratch_learning
```

### コンテナの停止
```bash
docker-compose down
```

### コンテナの再起動
```bash
docker-compose restart
```

## ディレクトリ構造

```
.
├── backend/
│   ├── src/
│   │   ├── config/       # データベース設定
│   │   ├── controllers/  # ビジネスロジック
│   │   ├── db/          # マイグレーション・シード
│   │   ├── middleware/  # 認証など
│   │   ├── routes/      # APIルーティング
│   │   └── utils/       # ユーティリティ
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # 再利用可能なコンポーネント
│   │   ├── contexts/    # React Context
│   │   ├── pages/       # ページコンポーネント
│   │   ├── services/    # API呼び出し
│   │   └── types/       # TypeScript型定義
│   └── package.json
├── logs/                # 開発ログ
└── docker-compose.yml
```

## API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/admin/login` - 管理者ログイン
- `GET /api/auth/me` - 現在のユーザー情報

### 問題
- `GET /api/chapters` - チャプター一覧
- `GET /api/chapters/:id/problems` - 問題一覧
- `GET /api/problems/:id` - 問題詳細
- `GET /api/problems/:id/hints` - ヒント取得

### 提出
- `POST /api/submissions/problems/:id/submit` - 解答提出
- `GET /api/submissions/history` - 提出履歴

### 管理者
- `GET /api/admin/users` - ユーザー一覧
- `GET /api/admin/statistics` - 統計情報
- `GET /api/admin/analytics/problems` - 問題分析

## ログについて

開発ログは `logs/` ディレクトリに自動的に記録されます。
ファイル名は `YYYYMMDD_HHMMSS_*.log` の形式です。

## トラブルシューティング

### ポートが使用中の場合
```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :5000
lsof -i :5432

# プロセスを終了
kill -9 <PID>
```

### データベースをリセット
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run migrate
docker-compose exec backend node src/db/seed.js
```

## ライセンス

本プロジェクトは大学の卒業研究として開発されています。
