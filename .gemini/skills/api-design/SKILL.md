---
name: api-design
description: REST API と WebSocket イベントの仕様定義。
---

# API・WebSocket 仕様

---

## 1. REST API

| メソッド | パス | 説明 | 備考 |
|----------|------|------|------|
| GET | `/users/me` | 自分のプロフィール取得 | 認証必須 |
| PATCH | `/users/me` | プロフィール更新 | name, icon_url |
| GET | `/users/:id` | 他ユーザーのプロフィール取得 | email は含めない |
| GET | `/users/me/matches` | 自分の戦績一覧取得 | 対戦相手の名前・アイコンを含む |
| POST | `/friends/:id` | フレンド申請 | 相手のユーザーID |
| PATCH | `/friends/:id` | フレンド申請承認 | status を ACCEPTED へ |
| DELETE | `/friends/:id` | フレンド解除・拒否 | — |

### レスポンス形式

```json
{
  "success": true,
  "data": { ... }
}
```

エラー時:
```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

## 2. WebSocket イベント仕様

### 対局フロー

```
クライアント                    サーバー
    │                              │
    │──── joinMatch ──────────────→│
    │    {matchId}                 │
    │                              │
    │←── matchStarted ────────────│
    │    {turn, board, message}    │
    │                              │
    │──── playMove ───────────────→│
    │    {matchId, piece,          │
    │     from, to, promotion}     │
    │                              │
    │←── gameStateUpdated ────────│
    │    {turn, board,             │
    │     capturedPieces}          │
    │                              │
    │     or                       │
    │←── moveError ───────────────│
    │    {error}                   │
    │                              │
    │←── gameEnded ───────────────│
    │    {winnerId, reason}        │
    └──────────────────────────────┘
```

### イベント詳細

| 方向 | イベント名 | データ | 説明 |
|------|-----------|--------|------|
| C→S | `joinMatch` | `{matchId}` | 対局に参加 |
| S→C | `matchStarted` | `{turn, board, message}` | 対局開始通知 |
| C→S | `playMove` | `{matchId, piece, from, to, promotion}` | 駒を移動 |
| S→C | `gameStateUpdated` | `{turn, board, capturedPieces}` | 盤面更新 |
| S→C | `moveError` | `{error}` | 不正な手 |
| S→C | `gameEnded` | `{winnerId, reason}` | 対局終了 |

### reason の種類

| 値 | 意味 |
|----|------|
| `CHECKMATE` | 詰み |
| `DISCONNECT` | 切断 |
| `RESIGN` | 投了 |
| `TIMEOUT` | 時間切れ |
