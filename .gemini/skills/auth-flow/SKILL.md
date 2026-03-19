---
name: auth-flow
description: 認証・認可フローの全体像。JWT、Cookie、middleware、OAuth の仕様を定義。
---

# 認証フロー

---

## 1. 認証方式の全体像

```
[ブラウザ]
    │
    ├── メール/パスワード認証
    │   POST /api/auth/signup  → JWT発行 → Cookie設定 → /home へ
    │   POST /api/auth/login   → JWT検証 → Cookie設定 → /home へ
    │
    ├── OAuth認証（予定）
    │   GET /api/auth/42       → 42 OAuth → コールバック → JWT発行
    │   GET /api/auth/google   → Google OAuth → コールバック → JWT発行
    │
    ├── ログアウト
    │   POST /api/auth/logout  → Cookie削除 → /login へ
    │
    └── 認証チェック（自動）
        middleware.ts → Cookie から JWT 取得 → 検証 → 通過 or リダイレクト
```

## 2. JWT 仕様

| 項目 | 値 |
|------|-----|
| ライブラリ | `jose` |
| アルゴリズム | HS256 |
| 有効期限 | 24時間 |
| ペイロード | `{ userId: string }` |

## 3. Cookie 仕様

| 項目 | 値 |
|------|-----|
| Cookie名 | `torassen_token` |
| `httpOnly` | `true` |
| `secure` | `true`（本番のみ） |
| `sameSite` | `lax` |
| `path` | `/` |
| `maxAge` | 86400（24時間） |

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
