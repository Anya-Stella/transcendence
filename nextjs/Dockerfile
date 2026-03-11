FROM node:20-alpine AS base

<<<<<<< HEAD
# ---- Dependencies ----
FROM base AS deps
# argon2などのビルドに必要なパッケージをここだけでインストール
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
=======
# Install dependencies for argon2
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json ./
RUN npm install
>>>>>>> origin/dev

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
<<<<<<< HEAD
# ビルド時にPrisma Clientを生成
=======

>>>>>>> origin/dev
RUN npx prisma generate
RUN npm run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
<<<<<<< HEAD
ENV NEXT_TELEMETRY_DISABLED 1
=======
>>>>>>> origin/dev

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

<<<<<<< HEAD
# standaloneモードの成果物をコピー
=======
>>>>>>> origin/dev
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
<<<<<<< HEAD

# 【重要】entrypoint.sh で npx prisma を動かすために、
# builderステージの node_modules から prisma 関連を丸ごと持ってくる
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# Prismaのバイナリが実行できるように権限を調整（念のため）
RUN chown -R nextjs:nodejs /app
=======
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x entrypoint.sh
>>>>>>> origin/dev

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
