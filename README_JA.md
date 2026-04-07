# 5x5 ミニ将棋オンライン

*このプロジェクトは、42のカリキュラムの一部として <okaname>, <mkuida>, <tishihar>, <kosakats> によって作成されました。*

## 📝 概要

**5x5 ミニ将棋オンライン** は、伝統的な将棋を現代的かつスピーディな 3D 環境で楽しめる Web ベースのプロジェクトです。マルチプレイヤー対戦、AI 練習、そしてプレイヤー間のソーシャルエコシステムをサポートする堅牢なシングルページアプリケーション (SPA) の構築を目標としています。

### 主な機能
- **没入型 3D グラフィックス**: Three.js を使用したインタラクティブな盤面。
- **リアルタイムエンジン**: WebSocket による即時の指し手同期。
- **セキュアな認証**: OAuth とソルト付きハッシュによるユーザー管理。
- **観戦体験**: コミュニティ向けのライブ対局観戦機能。
- **AI 対戦**: コンピュータ相手の練習モード。

---

## 🚀 起動手順

### 前提条件
- **Docker & Docker Compose**: コンテナ環境の実行に必要です。
- **GNU Make**: 自動化コマンド (Makefile) を使用するために必要です。
- **メモリ**: Docker に最低 2GB の割り当てを推奨します。

### セットアップと起動 (Makefile)
本プロジェクトには、Docker 操作を簡略化するための `Makefile` が含まれています。

1. **リポジトリのクローン**:
   ```bash
   git clone <repository-url>
   cd transcendence
   ```

2. **環境変数の設定**:
   ルートディレクトリに `.env` ファイルを作成します。
   ```bash
   cp .env.example .env
   ```
   *`DATABASE_URL`, `AUTH_SECRET`, `POSTGRES_PASSWORD` などの設定が必要です。*

3. **アプリケーションの起動**:
   - **本番モード** (42の評価用標準設定):
     ```bash
     make prod
     ```
   - **開発モード** (ホットリロード有効):
     ```bash
     make test
     ```

4. **その他のコマンド**:
   - **サービスの停止**:
     ```bash
     make down-prod  # 本番環境の停止
     make down-test  # 開発環境の停止
     ```

5. **ブラウザでアクセス**:
   `http://localhost:8080` でアプリケーションにアクセスできます（Nginx 経由）。

---

## 🛠 技術スタック

### 使用技術とフレームワーク
- **フロントエンド**: **Next.js 14 (App Router)** - SEO、ルーティング効率、React との親和性のために採用。
- **バックエンド**: **Node.js (Next.js API Routes)** - 統一された開発体験と高速な起動を実現。
- **3D エンジン**: **React Three Fiber (Three.js)** & **Blender** - 高性能な盤面および駒の描画、3D モデルの作成に使用。
- **リアルタイム通信**: **Socket.IO** - 対局操作やチャットの双方向通信を可能にします。
- **ORM**: **Prisma** - DB とアプリケーションロジック間の型安全性を確保。

### 技術選定の理由
ネットワークレイヤー全体で厳密な型定義を行い、実行時エラーを最小限に抑えるために **T3 スタイル** (Next.js + Prisma + TypeScript) を選択しました。また、対局履歴や統計のデータ整合性を維持するため、NoSQL ではなく PostgreSQL を採用しています。

---

## 📊 データベーススキーマ

**PostgreSQL** 上でリレーショナルな整合性を維持しています：

- **User**: `id (UUID)`, `email`, `passwordHash`, `totalMatches`, `wins`。
- **Match**: `id (UUID)`, `blackUserId (FK)`, `whiteUserId (FK)`, `winnerUserId (FK)`。
- **Friendship**: `requesterId (FK)`, `addresseeId (FK)`, `status` (PENDING, ACCEPTED)。
- **Session/Account**: OAuth 永続化と JWT セッション管理用。

---

## 📋 機能リストと担当者

- **将棋コアロジック**: `<okaname>` - 指し手のバリデーション、成り、駒取りの実装。
- **3D ボード描画**: `<kosakats>` - 3D モデル作成とアニメーションフック。
- **リアルタイム同期**: `<okaname>` - ルーム管理と指し手ブロードキャストを行う WebSocket サーバー。
- **ユーザー管理 & 認証**: `<mkuida>` - サインアップ/ログインフロー、プロフィール編集、フレンド機能。
- **観戦者 UI**: `<okaname>` / `<kosakats>` - 観戦者向けの状態管理。
- **AI 対戦相手**: `<okaname>` - オフライン用の指し手検索アルゴリズム。
- **HTTPS**: `<tishihar>` - HTTPS 通信の実装。
- **OAuth**: `<mkuida>` - OAuth 認証の実装。
- **利用規約とプライバシーポリシー**: `<ishihar>` - 利用規約とプライバシーポリシーの実装。
---

## 🧩 モジュールとポイント計算

合計ポイント: **16**

| モジュール | 種類 | 実装詳細 | 担当者 | ポイント |
|---|---|---|---|---|
| **フルスタックフレームワーク** | Major | Next.js による SSR と Backend API。 | `<okaname>` / `<mkuida>` / `<kosakats>` / `<ishihar>` | 2 |
| **リアルタイム機能** | Major | WebSocket による対局状態の更新。 | `<okaname>` | 2 |
| **インタラクティブ・ソーシャル** | Major | プロフィール、フレンドリスト | `<mkuida>` | 2 |
| **パブリック API** | Major | 5つ以上のセキュアな REST エンドポイント。 | `<kosakats>` | 2 |
| **AI 対戦相手** | Major | オフライン用の指し手検索アルゴリズム。 | `<okaname>` | 2 |
| **リモートプレイヤー** | Major | デバイス間でのリアルタイム対局。 | `<okaname>` | 2 |
| **高度な 3D グラフィックス** | Major | Three.js による成駒アニメーション。 | `<kosakats>` | 2 |
| **観戦モード** | Minor | 複数アクティブユーザーによる同時観戦。 | `<okaname>` / `<kosakats>` | 1 |
| **ゲーム統計** | Minor | データベースによる Elo レーティング。 | `<okaname>` / `<mkuida>` | 1 |

---

## 👥 チーム情報

- **Product Owner**: `<mkuida>` - ロードマップ策定と将棋ファンのニーズ分析。
- **Project Manager**: `<ishihar>` - マイルストーン管理と Docker デプロイの調整。
- **Technical Lead**: `<kosakats>` - 3D レンダリングと駒の物理挙動の設計。
- **Developer**: `<okaname>` - 複雑なゲームルールとロジックエンジンの実装。

---

## 👤 個人の貢献と課題

- **`<okaname>`**: カスタム Prisma アダプタを使用した NextAuth 設定に苦労したが、JWT 用のカスタムセッションコールバックで解決。
- **`<mkuida>`**: WebSocket のルーム参加時におけるレースコンディションを、サーバー側のロックとアトミックな通信で解決。
- **`<ishihar>`**: Web パフォーマンスのための 3D テクスチャ最適化が課題だったが、圧縮 GLB モデルとインスタンス描画で改善。
- **`<kosakats>`**: 3D と UI の境界を越えた「成り」ロジックの実装。論理状態をアニメーションタイマーから分離することで解決。

---

## 🤖 リソースと AI の利用

### AI 利用ポリシー
42 のポリシーに従い、AI ツール (Cursor / Antigravity) を以下の目的で使用しました：
- **リファクタリング**: 将棋エンジン内の冗長なロジックの整理。
- **テスト**: 盤面状態バリデーションのためのエッジケース用モックデータの作成。
- **コンフリクト解消**: ブランチマージ時のビルド成果物の競合解消の自動化。

### 参考文献
- [Next.js 日本語ドキュメント](https://nextjs.org/)
- [Prisma リファレンス](https://www.prisma.io/)
- [Socket.IO ルームロジック](https://socket.io/)
