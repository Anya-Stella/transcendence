# プロフィール表示画面の新規作成

## 背景

現在の `/profile` ページはプレイヤー名・アバター画像の**編集**機能のみを持っています。ユーザーの情報を「見る」ための画面がないため、以下の変更を行います。

1. **プロフィール表示画面**を `/profile` に新規作成
2. 現在の編集画面を `/profile/edit` に移動
3. TOPページ（`/home`）から名前ボタンでアクセス可能にする

## ユーザーレビュー項目

> [!IMPORTANT]
> **表示するプロフィール情報について**
> 
> DBの `User` モデルから以下の情報を表示できます。どこまで表示したいですか？
> - ✅ プレイヤー名
> - ✅ アバター画像
> - ✅ オンライン状況（`lastSeen`）
> - ✅ 対戦成績（`totalMatches`, `wins`, `losses`）
> - ✅ アカウント作成日（`createdAt`）
> - 🔒 メールアドレス（本人のみ表示）
> 
> → **全部表示する想定で進めます。** 不要なものがあればお知らせください。

> [!IMPORTANT]
> **画面デザインのイメージ**
> 
> 以下のようなレイアウトを想定しています：
> ```
> ┌──────────────────────────────────┐
> │  ヘッダー（将棋ゲーム / 戻る）    │
> ├──────────────────────────────────┤
> │                                  │
> │        [アバター画像]            │
> │        プレイヤー名              │
> │        ● オンライン              │
> │                                  │
> │  ┌──────────────────────────┐    │
> │  │ 📊 対戦成績               │    │
> │  │ 総対戦数: 42              │    │
> │  │ 勝利: 28  /  敗北: 14     │    │
> │  │ 勝率: 66.7%              │    │
> │  │ [勝率プログレスバー]      │    │
> │  └──────────────────────────┘    │
> │                                  │
> │  ┌──────────────────────────┐    │
> │  │ 📋 アカウント情報         │    │
> │  │ メール: user@example.com  │    │
> │  │ 登録日: 2026年3月25日     │    │
> │  └──────────────────────────┘    │
> │                                  │
> │  [✏️ プロフィールを編集]  ← ボタン │
> │                                  │
> └──────────────────────────────────┘
> ```

## 変更内容

### ルーティング

| URL | 用途 | 変更 |
|-----|------|------|
| `/profile` | プロフィール**表示** | 🆕 新規作成 |
| `/profile/edit` | プロフィール**編集** | 📝 既存の `profile/page.tsx` を移動 |

---

### API

#### [MODIFY] [route.ts](file:///wsl.localhost/Ubuntu-22.04/home/repri/cloneme/transcendence/nextjs/app/api/profile/route.ts)

- `GET /api/profile` を追加して、ログイン中ユーザーのプロフィール情報を返す
- 返却データ: `name`, `image`, `email`, `totalMatches`, `wins`, `losses`, `createdAt`, `lastSeen`

---

### フロントエンド

#### [NEW] [page.tsx](file:///wsl.localhost/Ubuntu-22.04/home/repri/cloneme/transcendence/nextjs/app/profile/page.tsx) — プロフィール表示画面

- 和風テーマ（`wafuu-*` クラス）を全面的に利用
- セッション情報 + API (`GET /api/profile`) からユーザー情報を取得
- 上記デザインイメージに基づいたUI
- **「プロフィールを編集」ボタン** → `/profile/edit` へ遷移

#### [NEW] [page.tsx](file:///wsl.localhost/Ubuntu-22.04/home/repri/cloneme/transcendence/nextjs/app/profile/edit/page.tsx) — プロフィール編集画面

- 現在の `/profile/page.tsx` をそのまま移動
- Header の `backHref` を `/profile` に変更（表示画面に戻る）
- 「ホームに戻る」リンクの遷移先を `/profile` に変更

#### [MODIFY] [page.tsx](file:///wsl.localhost/Ubuntu-22.04/home/repri/cloneme/transcendence/nextjs/app/home/page.tsx) — TOPページ

- メニュー一覧に「プロフィール」ボタンを追加（`/profile`へリンク）

#### [MODIFY] [Header.tsx](file:///wsl.localhost/Ubuntu-22.04/home/repri/cloneme/transcendence/nextjs/components/Header.tsx)

- ヘッダー右のユーザー名リンクの遷移先を `/profile` に変更（既存で OK：すでに `/profile` へリンク）

---

### CSS

#### 既存のCSSクラスで対応可能なもの

| 要素 | 使用するクラス |
|------|---------------|
| ページ全体 | `wafuu-page`, `wafuu-bg`, `wafuu-content` |
| カード | `wafuu-card` |
| 見出し | `wafuu-heading`, `wafuu-subheading` |
| ラベル | `wafuu-label` |
| ボタン | `wafuu-btn-primary`, `wafuu-btn-outline` |
| バッジ | `wafuu-badge`, `wafuu-badge-success` |
| レイアウト | `wafuu-flex-col`, `wafuu-gap-*`, `wafuu-mt-*` |

#### 追加CSSが必要なもの

`wafuu-theme.css` に以下を追加予定：

1. **`.wafuu-profile-avatar`** — アバター画像の丸型表示 + ゴールドボーダー + グロー効果
2. **`.wafuu-stat-grid`** — 戦績表示用の2カラムグリッド
3. **`.wafuu-stat-value`** — 数値の大文字表示
4. **`.wafuu-stat-label`** — ラベルのサブテキスト
5. **`.wafuu-progress-bar`** — 勝率プログレスバー（アニメーション付き）
6. **`.wafuu-divider`** — セクション区切り線

---

## 技術的に面白いポイント

### 1. CSS `@property` を使ったプログレスバーアニメーション

```css
@property --progress-width {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}
```

CSS Houdini の `@property` を使うと、**カスタムプロパティ自体にアニメーション**をかけられます。通常CSSカスタムプロパティ（`--var`）はアニメーション不可ですが、`@property` で型（`<percentage>`）を宣言することで `transition` が効くようになります。これにより勝率バーが0%からスムーズに伸びるアニメーションを実現できます。

### 2. `background: conic-gradient()` による円形統計チャート

勝率を視覚的に表現する方法として、`conic-gradient()` を使った円形グラフも可能です。SVGを使わずCSSだけで円グラフを作れます。

### 3. 単方向データフロー（表示/編集の分離）

プロフィール画面を「表示」と「編集」に明確に分離することで、**CQRSパターン**（Command/Query Responsibility Segregation）に近い設計になります。読み取り専用画面は `GET` のみ、編集画面は `PUT` のみを担当します。

---

## 未解決の質問

> [!NOTE]
> 1. プロフィール表示画面に戦績データ以外に表示したい情報はありますか？（例：最近の対戦履歴、称号など）
> 2. 将来的に「他のユーザーのプロフィールも見られる」機能は予定していますか？（URL設計に影響）

## 検証計画

### 自動テスト
- `npm run build` でビルドエラーがないことを確認

### 手動検証
- ブラウザで `/profile` にアクセスし、プロフィール情報が正しく表示される
- 「プロフィールを編集」から `/profile/edit` に遷移し、編集 → 保存後に `/profile` に戻って反映されている
- TOPページからプロフィールボタンでアクセスできる
- ヘッダーのユーザー名クリックでプロフィール表示画面に遷移する
