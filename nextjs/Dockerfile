FROM node:20-alpine AS base

# Install dependencies for argon2 and C++ engine
RUN apk add --no-cache python3 make g++ libc6-compat libstdc++

WORKDIR /app

# ---- Engine Builder ----
FROM base AS engine-builder
WORKDIR /engine
COPY nextjs/55engine/ ./
RUN make clean || true && make

# ==========================================
# 1. Dependencies (依存関係のインストール)
# ==========================================
FROM base AS deps
WORKDIR /app

# 親の設計図と辞書をコピー
COPY package.json package-lock.json ./

# 各子プロジェクトの設計図をコピー
COPY nextjs/package.json ./nextjs/
COPY packages/shogi-logic/package.json ./packages/shogi-logic/
COPY ws-server/package.json ./ws-server/

# 全体の依存関係を一括クリーンインストール！
RUN npm ci

# ==========================================
# 2. Builder (コンパイル作業)
# ==========================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app ./

# すべてのソースコードをコピー (※.dockerignoreが効いているため node_modules は上書きされずにマージされます)
COPY nextjs/ ./nextjs/
COPY packages/ ./packages/

# ① 依存元である shogi-logic を親から遠隔ビルド
RUN npm run build --workspace=@torassen/shogi-logic

# ② Prisma のクライアント生成 (nextjs フォルダ内で実行)
RUN cd nextjs && npx prisma generate

# ③ 本命の Next.js を親から遠隔ビルド
RUN npm run build --workspace=torassen-nextjs

# ==========================================
# 3. Runner (本番実行環境)
# ==========================================
FROM base AS runner
# 実行時のベースディレクトリを nextjs の中にしておく
WORKDIR /app/nextjs

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/nextjs/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/nextjs/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/nextjs/package.json ./package.json

COPY --from=builder --chown=nextjs:nodejs /app/node_modules ../node_modules
COPY --from=builder --chown=nextjs:nodejs /app/nextjs/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages ../packages

COPY --from=builder --chown=nextjs:nodejs /app/nextjs/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/nextjs/entrypoint.sh ./entrypoint.sh

# 55engine
COPY --from=engine-builder /engine/engine ./engine/55engine
COPY --from=engine-builder /engine/legal_checker ./engine/legal_checker

RUN chmod +x entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
