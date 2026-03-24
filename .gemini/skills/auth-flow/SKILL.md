---
name: auth-flow
description: 認証・認可フローの全体像。Auth.js（NextAuth）ベースの OAuth / Credentials、Cookie、middleware の仕様を定義。
---

# 認証フロー

---

## 1. 認証方式の全体像

```
[ブラウザ]
    │
    ├── メール/パスワード認証（Credentials Provider）
    │   フロント: Auth.js の signIn("credentials") を呼び出し
    │   → /api/auth/callback/credentials
    │   → Auth.js がユーザ検証・セッション用 JWT 発行
    │   → セッション Cookie 設定
    │   → /home へリダイレクト
    │
    ├── OAuth 認証（42 / Google など）
    │   GET /api/auth/signin?callbackUrl=/home
    │   → プロバイダ選択（42 / Google）
    │   → /api/auth/callback/{provider}
    │   → Auth.js がプロバイダからプロフィール取得・ユーザ紐付け
    │   → セッション用 JWT 発行 & Cookie 設定
    │   → /home へリダイレクト
    │
    ├── ログアウト
    │   フロント: Auth.js の signOut() を呼び出し
    │   → /api/auth/signout
    │   → Auth.js がセッション Cookie 削除
    │   → /login へリダイレクト（または指定の callbackUrl）
    │
    └── 認証チェック（自動）
        middleware.ts → Auth.js の auth() / getToken() 等でセッション取得
        → セッションがあれば通過 / なければ /login へリダイレクト
```

## 2. Auth.js セッション / JWT 仕様

| 項目 | 値 |
|------|-----|
| ライブラリ | Auth.js（NextAuth.js） |
| セッション方式 | JWT セッション（`session.strategy = "jwt"` を想定） |
| 有効期限 | Auth.js の `session.maxAge`（例: 30 日） |
| ペイロードのイメージ | `{ sub: userId, email, name, image, ... }` |
| 署名鍵 | Auth.js の設定（環境変数 / オプション）で管理 |

※ アプリ側で `jose` を直接使って JWT を発行・検証するフローは廃止し、Auth.js のセッション管理に統一する。

## 3. Cookie 仕様（Auth.js）

| 項目 | 値 |
|------|-----|
| Cookie 名 | Auth.js が管理するセッション Cookie（例: `next-auth.session-token` / `__Secure-next-auth.session-token`） |
| `httpOnly` | `true`（JS から直接参照不可） |
| `secure` | `true`（本番のみ、自動的に有効） |
| `sameSite` | `lax`（Auth.js デフォルト） |
| `path` | `/` |
| `maxAge` | `session.maxAge` に基づく（例: 30 日） |

クライアントコードは Cookie 名や署名処理に依存せず、Auth.js のクライアント API（`useSession`, `signIn`, `signOut` など）を利用する。

## 4. middleware のルート保護

| パス | 未認証時 | 認証済み時 |
|------|----------|------------|
| `/login` | 表示 | `/home` へリダイレクト |
| `/home` | `/login` へリダイレクト | 表示 |
| `/online`, `/room/*` | `/login` へリダイレクト | 表示 |
| `/match/*`, `/spectate/*` | `/login` へリダイレクト | 表示 |
| `/result` | `/login` へリダイレクト | 表示 |
| `/api/*` | 通過（API側で検証） | 通過 |

## 5. 認証ユーティリティ（lib/auth.ts）

| 関数 | 用途 |
|------|------|
| `signToken(userId)` | JWT トークン生成 |
| `verifyToken(token)` | JWT トークン検証 → `{ userId }` |
| `setAuthCookie(response, token)` | レスポンスに認証 Cookie を設定 |
| `getAuthFromCookie()` | リクエストから Cookie を取得・検証 |
| `clearAuthCookie(response)` | Cookie 削除 |

## 6. OAuth 追加時の注意点

- `provider` カラムで認証方式を区別する（`local` / `42` / `google`）
- OAuth ユーザーは `password` が null → ログイン画面でパスワード認証を許可しない
- 既存メールアドレスと OAuth アカウントの紐付けルールを決める
- コールバックURL: `/api/auth/[provider]/callback`

## 7. よくあるバグと対策

| バグ | 原因 | 対策 |
|------|------|------|
| ログアウトしてもログイン状態が残る | Cookie 削除が不完全 | `NextResponse.cookies.delete()` を使う |
| `/api/me` が 404 を返す | DB にユーザーが存在しない | JWT の userId で検索失敗時は 401 を返す |
| middleware でリダイレクトループ | マッチャーの設定ミス | `_next/static` 等を除外する |
