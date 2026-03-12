FROM node:20-alpine AS base

# ---- Engine Builder ----
FROM base AS engine-builder
RUN apk add --no-cache python3 make g++ libc6-compat libstdc++
WORKDIR /engine
COPY ../55engine/ ./
RUN make clean || true && make

# ---- Dependencies ----
FROM base AS deps
# argon2などのビルドに必要なパッケージをここだけでインストール
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# ビルド時にPrisma Clientを生成
RUN npx prisma generate
RUN npm run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# standaloneモードの成果物をコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# 【重要】entrypoint.sh で npx prisma を動かすために、
# builderステージの node_modules から prisma 関連を丸ごと持ってくる
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Copy 55engine binary
COPY --from=engine-builder /engine/engine ./engine/55engine
COPY --from=engine-builder /engine/legal_checker ./engine/legal_checker

RUN chmod +x entrypoint.sh

# Prismaのバイナリが実行できるように権限を調整（念のため）
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
