# 小学生向けScratch学習支援システム

大学卒業研究プロジェクト

## プロジェクト概要

小学生向けScratchプログラミング学習を支援するWebアプリケーション。4つの問題形式で計算的思考を育成します。

### 問題形式

- 📝 **穴埋め問題 (fill_blank)**: プログラムの一部を推察して完成させる
- 🔮 **予測問題 (predict)**: プログラムの実行結果を予測する（座標入力形式）
- 🐛 **間違い探し問題 (find_error)**: プログラムの誤りを発見して修正する
- 🚀 **ミッション型問題 (mission)**: 知識を応用して自由に創造する

### 主な機能

- **学生向け機能**
  - Scratchプロジェクトのダウンロード・編集・アップロード
  - 予測問題では座標を直接入力
  - 自動採点とリアルタイムフィードバック
  - 経験値(EXP)獲得とレベルアップ
  - 提出履歴と進捗管理

- **管理者向け機能**
  - モーダル形式の直感的な問題管理UI
  - Scratch URL編集
  - 予測問題の正解座標設定
  - 正解SB3ファイル管理
  - ユーザー統計と問題分析
  - 学習データの可視化

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
- **開発環境**: Docker + Docker Compose
- **本番環境**: Render (Frontend + Backend + PostgreSQL)

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
- `GET /api/admin/users/:userId` - ユーザー詳細
- `GET /api/admin/statistics` - 統計情報
- `GET /api/admin/analytics/problems` - 問題分析
- `GET /api/admin/problems` - 問題管理一覧
- `POST /api/admin/problems/:problemId/upload-correct` - 正解SB3アップロード
- `PATCH /api/admin/problems/:problemId/scratch-url` - Scratch URL更新
- `PATCH /api/admin/problems/:problemId/correct-answer` - 正解座標更新（予測問題）

## データベーススキーマ

### 主要テーブル

- **users**: 学生ユーザー（学年、レベル、経験値）
- **admins**: 管理者アカウント
- **chapters**: 学習チャプター
- **problems**: 問題（4タイプ、正解データ、正解座標）
- **submissions**: 最終提出記録（ユーザー×問題で一意）
- **submission_attempts**: 全ての試行記録（研究用データ）

### 予測問題の特殊フィールド

予測問題 (`problem_type = 'predict'`) には以下のフィールドを使用:
- `correct_answer_x`: 正解のX座標（INTEGER）
- `correct_answer_y`: 正解のY座標（INTEGER）

他の問題タイプは `correct_sb3_data` (JSONB) を使用します。

## 現在の学習コンテンツ

### Chapter 1: 順次処理

1. **問題1 (fill_blank)**: ネコを歩かせよう - ブロックの順次実行の基本
2. **問題2 (predict)**: ネコはどこかな？ - 座標計算による予測（X: 30, Y: 0）
3. **問題3 (find_error)**: 準備の順番が間違っているよ！ - 命令の順序の重要性
4. **問題4 (mission)**: 階段を登るプログラムを作ろう - 順次処理の応用

## ログについて

開発ログは `logs/` ディレクトリに自動的に記録されます。
ファイル名は `YYYYMMDD_HHMMSS_*.log` または `YYYYMMDD_*.md` の形式です。

### 主要な開発ログ

- `20251003_*`: 初期開発・プロジェクト完成
- `20251004_ui_improvements.md`: UI改善
- `20251005_193622_chapter1_sequential_processing_update.md`: Chapter 1コンテンツ更新
- `20251005_chapter1_問題一覧.md`: Chapter 1問題詳細
- `20251006_predict_problem_coordinate_input.md`: 予測問題座標入力機能実装

## システムの特徴

### 予測問題の座標入力方式

予測問題では、従来のSB3ファイルアップロードではなく、X座標とY座標を直接入力する方式を採用しています。

**利点:**
- 小学生にも理解しやすい直感的なUI
- Scratchの座標系の理解を深める
- 解答時間の短縮
- 計算力の育成

**採点基準:**
- 両方正解: 100点
- 片方正解: 50点（どちらが間違っているかフィードバック）
- 両方不正解: 0点

### 管理者UI

モーダル形式で統一された直感的な管理インターフェース:

1. **URL編集モーダル** (青色): Scratch エディタのURLを設定
2. **正解座標編集モーダル** (紫色): 予測問題の正解X/Y座標を設定
3. **正解ファイル更新モーダル** (プライマリカラー): SB3ファイルをアップロード

各モーダルは:
- 問題タイトルを表示して編集対象を明確化
- 大きな入力フィールドで操作しやすい
- モーダル外クリックで閉じる
- テーブルレイアウトを崩さない

## トラブルシューティング

### WSL2環境でのDocker Compose実行

WSL2では`docker-compose`コマンドが見つからない場合、フルパスを使用:

```bash
# docker-compose の代わりに以下を使用
/mnt/c/Program\ Files/Docker/Docker/resources/cli-plugins/docker-compose.exe exec backend npm run migrate
```

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

### マイグレーション後にシードが失敗する場合

新しい列を追加した場合、既存のテーブルには自動的に追加されません。
`migrate.js`にALTER TABLE文が含まれているか確認してください。

## ライセンス

本プロジェクトは大学の卒業研究として開発されています。
