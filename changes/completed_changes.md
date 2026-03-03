# 実施済み変更一覧（2026-03-03）

## 目的

Docker Compose で全サービス（postgres, nextjs, ws-server, nginx）が正常に起動するよう修正。

---

## 変更内容

### 1. `nextjs/Dockerfile` — インラインコメント除去

```diff
-RUN npm ci  # installよりciの方が確実です
+RUN npm ci
```

**理由**: Dockerfile の `RUN` 命令でインラインコメント `#` を書くと、シェルが `#` 以降も引数として解釈し、`npm ci` コマンドが失敗していた。

---

### 2. `nextjs/prisma/schema.prisma` — sqlite → postgresql

- `provider` を `"sqlite"` から `"postgresql"` に変更
- 全 UUID カラムに `@db.Uuid` アノテーションを追加
- 既存の `schema.prisma.pg.bak` の内容を適用

**理由**: docker-compose で PostgreSQL コンテナを使用しているが、Prisma スキーマが SQLite 用のままだった。

---

### 3. `nextjs/prisma/migrations/20260303090514_init/migration.sql` — PostgreSQL 構文に変換

主な変更:
- `TEXT NOT NULL PRIMARY KEY` → `UUID NOT NULL DEFAULT gen_random_uuid()` + `CONSTRAINT ... PRIMARY KEY`
- `DATETIME` → `TIMESTAMP(3)`
- インライン FK 制約 → `ALTER TABLE ... ADD CONSTRAINT` 文に分離

**理由**: マイグレーション SQL が SQLite 構文で書かれており、PostgreSQL では実行できなかった。

---

### 4. `nextjs/prisma/migrations/migration_lock.toml` — プロバイダ変更

```diff
-provider = "sqlite"
+provider = "postgresql"
```

**理由**: `prisma migrate deploy` がプロバイダの不一致でエラーになっていた。

---

### 5. `.dockerignore` ファイル新規作成

- `nextjs/.dockerignore` — `node_modules`, `.next`, `dev.db`, `.env`, `.git` を除外
- `ws-server/.dockerignore` — `node_modules`, `dist`, `.env`, `.git` を除外

**理由**: ビルドコンテキストに不要なファイルが含まれ、ビルドが遅くなっていた。

---

### 6. `docker-compose.yml` — `version` 属性削除

```diff
-version: "3.9"
-
 services:
```

**理由**: Docker Compose V2 では `version` は非推奨で、毎回警告が表示されていた。

---

### 7. `ws-server/Dockerfile` — `npm install` → `npm ci`

```diff
-COPY package.json ./
-RUN npm install
+COPY package.json package-lock.json ./
+RUN npm ci
```

**理由**: `npm ci` は `package-lock.json` に基づいて正確にインストールするため、ビルドの再現性が向上する。

---

### 8. `.gitignore` — `dev.db` 追加

```diff
+dev.db
+dev.db-journal
```

**理由**: SQLite 時代の開発用 DB ファイルが Git に含まれないようにする。

---

### 9. `docker-compose.yml` — 内部サービスのポート公開を制限

```diff
 # postgres, nextjs, ws-server すべて同様の変更
-    ports:
-      - "3000:3000"
+    expose:
+      - "3000"
```

対象: `postgres` (5432), `nextjs` (3000), `ws-server` (3001)

**理由**: nextjs（:3000）や ws-server（:3001）、postgres（:5432）がホストに直接公開されており、nginx を経由せずにアクセスできてしまっていた。`ports` → `expose` に変更し、外部公開は nginx の `:8080` のみに限定。

---

## 変更したファイル一覧

| ファイル | 操作 |
|---------|------|
| `nextjs/Dockerfile` | 修正 |
| `nextjs/prisma/schema.prisma` | 修正 |
| `nextjs/prisma/migrations/20260303090514_init/migration.sql` | 修正 |
| `nextjs/prisma/migrations/migration_lock.toml` | 修正 |
| `nextjs/.dockerignore` | 新規作成 |
| `ws-server/.dockerignore` | 新規作成 |
| `docker-compose.yml` | 修正 |
| `ws-server/Dockerfile` | 修正 |
| `.gitignore` | 修正 |
