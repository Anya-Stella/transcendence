# ==========================================
# 0. Base: 共通設定
# ==========================================
FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++ libc6-compat libstdc++

# ==========================================
# 1. Engine Builder (C++エンジンのビルド)
# ==========================================
FROM base AS engine-builder
WORKDIR /engine
COPY nextjs/55engine/ ./
RUN make clean || true && make

# ==========================================
# 2. Pruner (TurboRepo）
# ==========================================
FROM base AS pruner
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --no-save --workspaces=false turbo@2.9.5

COPY . .

RUN npx turbo prune torassen-nextjs --docker

# ==========================================
# 3. Installer (キャッシュ用の依存関係インストール)
# ==========================================
FROM base AS installer
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

RUN npm ci

# ==========================================
# 4. Builder (ソースコード本体を結合してビルド)
# ==========================================
FROM base AS builder
WORKDIR /app

# Installerで作った node_modules を引き継ぐ
COPY --from=installer /app/ .

# 次に、out/full/（抽出済みの純粋なソースコード！ws-server等はない）を上書きコピー
COPY --from=pruner /app/out/full/ .

# ① 依存元の shogi-logic をビルド
RUN npm run build --workspace=@torassen/shogi-logic

# ② Prisma 生成
RUN cd nextjs && npx prisma generate

RUN npm run build --workspace=torassen-nextjs

# 4.5. Prune (本番に不要なものを捨てる)
RUN npm prune --omit=dev
RUN cd nextjs && npm prune --omit=dev

# ==========================================
# 6. Runner (本番実行環境)
# ==========================================
FROM base AS runner
WORKDIR /app/nextjs
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN apk add --no-cache su-exec

COPY --from=builder --chown=nextjs:nodejs /app/nextjs/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/nextjs/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/nextjs/package.json ./package.json

COPY --from=builder --chown=nextjs:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/nextjs/node_modules /app/nextjs/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages /app/packages

COPY --from=builder --chown=nextjs:nodejs /app/nextjs/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/nextjs/entrypoint.sh ./entrypoint.sh

# 55engine
COPY --from=engine-builder /engine/engine ./engine/55engine
COPY --from=engine-builder /engine/legal_checker ./engine/legal_checker

RUN chmod +x entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
