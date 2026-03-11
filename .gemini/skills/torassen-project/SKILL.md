---
name: torassen-project
description: 将棋ゲーム（5×5ミニ将棋）プロジェクト固有のスキル。技術スタック、アーキテクチャ、開発ルールを定義。
---

# 将棋ゲーム（Torassen）プロジェクト スキル

---

## 1. 技術スタック

| レイヤー | 技術 | 場所 |
|----------|------|------|
| フロントエンド | Next.js 14 (App Router) + React 18 + TypeScript | `nextjs/` |
| DB | PostgreSQL 16 + Prisma ORM | `nextjs/prisma/` |
| 認証 | JWT (httpOnly Cookie) + argon2 + jose | `nextjs/lib/auth.ts` |
| リアルタイム通信 | Socket.IO (server: `socket.io`, client: `socket.io-client`) | `ws-server/` |
| インフラ | Docker Compose (nginx / nextjs / ws-server / postgres) | ルート |

## 2. アーキテクチャ

```
[ブラウザ] ←HTTP→ [nginx:80] ←proxy→ [nextjs:3000]
                         ↑                    ↓
                    ←WS proxy→          [postgres:5432]
                         ↓
                   [ws-server:3001]
```

### ローカル開発時
- `nextjs/` → `npm run dev` (port 3000)
- `ws-server/` → `npx ts-node src/index.ts` (port 3001)
- フロントからWSへの接続先: `http://localhost:3001`

### Docker時
- `docker compose up --build`
- nginx が `localhost:8080` で全体をプロキシ

## 3. ディレクトリルール

### nextjs/app/ (ページ)
- 各ページは `app/<ページ名>/page.tsx` に配置
- 動的ルートは `app/<ページ名>/[param]/page.tsx`
- API は `app/api/<エンドポイント>/route.ts`
- クライアントコンポーネントには `"use client";` を冒頭に記述

### nextjs/components/ (共通コンポーネント)
- 複数ページで使うコンポーネントをここに配置
- PascalCase ファイル名: `MatchBoard.tsx`

### nextjs/lib/ (ユーティリティ)
- `auth.ts` — JWT・Cookie 操作
- `prisma.ts` — Prisma クライアントインスタンス
- `validations.ts` — Zod バリデーションスキーマ

### ws-server/src/ (WebSocket サーバー)
- エントリポイント: `src/index.ts`
- イベントハンドラは `io.on("connection")` 内にまとめる

## 4. コーディングルール（プロジェクト固有）

### フロントエンド
- CSS は `globals.css` に集約（CSS Modules は使わない）
- クラス名は kebab-case、コンポーネント名と対応させる
- バリデーションには Zod を使う
- ページ遷移は `useRouter().push()` を使う

### 認証
- Cookie 名: `torassen_token`
- 保護ルート: `/home`, `/online`, `/room`, `/match`, `/spectate`, `/result`
- 認証チェック: `middleware.ts` で JWT 検証
- API でのユーザー取得: `getAuthFromCookie()` → `prisma.user.findUnique()`

### WebSocket
- イベント名は camelCase: `joinRoom`, `moveMade`, `gameStart`
- サーバー → クライアント: 過去分詞系 (`moveMade`, `playerLeft`)
- クライアント → サーバー: 動詞系 (`joinRoom`, `hostStart`, `move`)
- ルーム操作は必ずルーム存在チェック & プレイヤー権限チェックを入れる

## 5. 新機能追加時のチェックリスト

- [ ] `middleware.ts` のマッチャーに新ルートを追加したか？
- [ ] `globals.css` に必要なスタイルを追加したか？
- [ ] WS イベントを追加した場合、`README.md` のイベント表を更新したか？
- [ ] API を追加した場合、`README.md` のエンドポイント表を更新したか？
