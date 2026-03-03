# 今後実施を推奨する改善

## 🔴 優先度: 高

### 1. JWT_SECRET を安全な値に変更

現在 `.env` の `JWT_SECRET` がプレースホルダーのままです。

```bash
# ランダムな秘密鍵を生成
openssl rand -base64 48
```

生成した値を `.env` の `JWT_SECRET` に設定してください。

**リスク**: 現在の値は推測可能で、トークン偽造による不正アクセスが可能。

---

### 2. `schema.prisma.pg.bak` の削除

PostgreSQL への移行が完了したため、バックアップファイルは不要です。

```bash
rm nextjs/prisma/schema.prisma.pg.bak
```

---

### 3. `nextjs/prisma/dev.db` の削除

SQLite 時代の開発用 DB ファイルです。PostgreSQL に移行済みのため不要。

```bash
rm nextjs/prisma/dev.db
```

---

## 🟡 優先度: 中

### 4. nextjs Dockerfile の runner ステージ軽量化

現在、runner ステージで `node_modules` を丸ごとコピーしています（L38）。
standalone モードを使っているため、本来は最小限のファイルだけで動作可能です。

**現状**:
```dockerfile
COPY --from=builder /app/node_modules ./node_modules
```

**改善案**: `prisma` 関連のパッケージだけをコピーする。

```dockerfile
# Prisma CLI と Client のみコピー
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
```

**効果**: Docker イメージサイズの大幅な削減。

---

### 5. ヘルスチェックの追加（nextjs, ws-server）

現在 PostgreSQL にはヘルスチェックがありますが、他のサービスにはありません。

```yaml
# docker-compose.yml - nextjs に追加
nextjs:
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/"]
    interval: 10s
    timeout: 5s
    retries: 5

# docker-compose.yml - ws-server に追加
ws-server:
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://localhost:3001/"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**効果**: nginx が依存サービスの起動完了を待てるようになり、起動直後の502エラーを防止。

---

### 6. nginx に depends_on の condition 追加

ヘルスチェック（上記 #5）を追加した後、nginx の depends_on に条件を追加。

```yaml
nginx:
  depends_on:
    nextjs:
      condition: service_healthy
    ws-server:
      condition: service_healthy
```

---

### 7. Docker ネットワークの明示的定義

現在はデフォルトネットワークを使用しています。明示的に定義することで、意図が明確になります。

```yaml
# docker-compose.yml に追加
networks:
  app-network:
    driver: bridge

# 各サービスに追加
services:
  postgres:
    networks:
      - app-network
  # ... 他のサービスも同様
```

---

## 🟢 優先度: 低

### 8. マルチステージビルドの ws-server への適用

現在 ws-server は単一ステージビルドです。nextjs と同様にマルチステージにすることで、
本番イメージには TypeScript コンパイラや devDependencies が含まれなくなります。

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

**効果**: イメージサイズ削減、セキュリティ向上。

---

### 9. ログローテーションの設定

長期運行する場合、ログが肥大化する可能性があります。

```yaml
# docker-compose.yml の各サービスに追加
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

### 10. 本番用 docker-compose のオーバーライド構成

開発用と本番用の設定を分離する。

```
docker-compose.yml           # 共通設定
docker-compose.override.yml  # 開発用（ポート公開、volume mount 等）
docker-compose.prod.yml      # 本番用（restart policy、リソース制限等）
```

```bash
# 本番起動
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
