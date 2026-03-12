# 🐯 将棋ゲーム（Tora-sen）— 5×5 ミニ将棋オンライン

5×5 ミニ将棋をオンラインで対戦できる Web アプリケーション。

## 🏗 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript |
| データベース | PostgreSQL 16 + Prisma ORM |
| 認証 | JWT (httpOnly Cookie) + argon2 |
| WebSocket | Socket.IO |
| インフラ | Docker Compose (nginx / nextjs / ws-server / postgres) |

## 📂 ディレクトリ構成

```
TRANSCENDENCE/
├── docker-compose.yml
├── .env.example
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf
├── nextjs/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   ├── lib/           # auth, prisma, validations
│   ├── middleware.ts   # 認証リダイレクト
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── login/
│   │   ├── home/
│   │   ├── online/
│   │   ├── room/[roomId]/
│   │   ├── match/ & match/[roomId]/
│   │   ├── spectate/ & spectate/[roomId]/
│   │   ├── result/
│   │   └── api/
│   │       ├── auth/signup/
│   │       ├── auth/login/
│   │       ├── auth/logout/
│   │       └── me/
│   └── components/
│       └── MatchBoard.tsx
└── ws-server/
    ├── Dockerfile
    ├── package.json
    └── src/index.ts
```

## 🚀 起動手順

### 1. 環境変数の準備

```bash
cp .env.example .env
# .env の JWT_SECRET を書き換えてください（32文字以上推奨）
```

### 2. Docker Compose で起動

```bash
docker compose up --build
```

初回起動時に以下が自動実行されます：
- PostgreSQL データベースの作成
- Prisma マイグレーション（テーブル作成）
- Prisma クライアント生成

### 3. ブラウザでアクセス

```

http://localhost:8080
```

## 🔐 環境変数

| 変数 | 説明 | 例 |
|------|------|----|
| `POSTGRES_USER` | DB ユーザー名 | `torassen` |
| `POSTGRES_PASSWORD` | DB パスワード | `torassen_secret` |
| `POSTGRES_DB` | DB 名 | `torassen` |
| `DATABASE_URL` | Prisma 接続文字列 | `postgresql://torassen:torassen_secret@postgres:5432/torassen` |
| `JWT_SECRET` | JWT 署名鍵 | ランダムな32文字以上の文字列 |

## 🗄 DB 初期化

DB 初期化は **自動** です。`docker compose up --build` 実行時に `entrypoint.sh` が `prisma migrate deploy` を実行し、テーブルが自動作成されます。

手動でリセットしたい場合：

```bash
docker compose down -v  # ボリュームごと削除
docker compose up --build
```

## ✅ 動作確認手順

### 1. サインアップ
1. `http://localhost:8080` にアクセス → `/login` にリダイレクト
2. 「新規登録」タブを選択
3. 名前・メール・パスワードを入力して「アカウントを作成」
4. `/home` にリダイレクトされることを確認

### 2. ログアウト → ログイン
1. ヘッダーの「ログアウト」をクリック → `/login` に戻る
2. 先ほどのメール・パスワードでログイン
3. `/home` にリダイレクトされることを確認

### 3. ルーム作成 → 待機
1. 「オンライン対戦」→「ルームを作成する」
2. ルームIDが表示され、コピーできることを確認
3. 「相手の参加を待っています」と表示される

### 4. 対局画面
1. `/match` にアクセス（またはルームからスタート）
2. 5×5 の将棋盤が表示されることを確認
3. 「対局を終える」をクリック

### 5. 結果画面
1. `/result` に遷移
2. 勝敗表示が出ることを確認
3. 「ホームへ」で `/home` に戻る

## 🔌 API エンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| POST | `/api/auth/signup` | 新規登録（email, password, name） |
| POST | `/api/auth/login` | ログイン（email, password） |
| POST | `/api/auth/logout` | ログアウト |
| GET | `/api/me` | ログインユーザー情報取得 |

## 📡 WebSocket イベント

| イベント | 方向 | 説明 |
|----------|------|------|
| `joinRoom` | Client → Server | ルーム参加 |
| `getRoomState` | Client → Server | ルーム状態取得 |
| `hostStart` | Client → Server | ホストがゲーム開始 |
| `roomState` | Server → Client | ルーム状態ブロードキャスト |
| `gameStart` | Server → Client | ゲーム開始通知 |
| `playerLeft` | Server → Client | プレイヤー退室通知 |

## 📝 今後の実装予定

- [ ] WebSocket によるリアルタイム対局同期
- [ ] 将棋ルールエンジン（駒移動、成り、持ち駒）
- [ ] AI 対戦ロジック
- [ ] 観戦機能
- [ ] OAuth ログイン（42 / Google）
- [ ] フレンドシステム
- [ ] 戦績表示
