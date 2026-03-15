# FROM node:20-alpine AS base

# WORKDIR /app

# # ---- Shared Package Build ----
# FROM base AS shared-builder
# WORKDIR /shared
# COPY packages/shogi-logic/package.json ./
# COPY packages/shogi-logic/tsconfig.json ./
# COPY packages/shogi-logic/src/ ./src/
# RUN npm install
# RUN npm run build

# # ---- Dependencies ----
# FROM base AS deps
# WORKDIR /app
# COPY ws-server/package.json ./
# RUN node -e "const p=require('./package.json'); delete p.dependencies['@torassen/shogi-logic']; require('fs').writeFileSync('./package.json', JSON.stringify(p,null,2))"
# RUN npm install

# ---- Builder ----
# FROM base AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY --from=shared-builder /shared ./node_modules/@torassen/shogi-logic
# COPY ws-server/ .

# COPY ws-server/ .

# RUN npm run build

# EXPOSE 3001

# CMD ["npm", "start"]

FROM node:20-alpine AS base
WORKDIR /app

# ---- 1. Shared Package Build (共通ロジックのビルド) ----
FROM base AS shared-builder
WORKDIR /app/packages/shogi-logic
# 依存関係と設定ファイルをコピー
COPY packages/shogi-logic/package*.json ./
COPY packages/shogi-logic/tsconfig.json ./
COPY packages/shogi-logic/src ./src

RUN npm install
# これで /app/packages/shogi-logic/dist が生成される
RUN npm run build

# ---- 2. Dependencies (外部ライブラリの取得) ----
FROM base AS deps
WORKDIR /app/ws-server
COPY ws-server/package*.json ./
# 依存関係から自作パッケージを一時的に除外して install
RUN node -e "const p=require('./package.json'); delete p.dependencies['@torassen/shogi-logic']; require('fs').writeFileSync('./package.json', JSON.stringify(p,null,2))"
RUN npm install

# ---- 3. Builder (最終的なビルド) ----
FROM base AS builder
WORKDIR /app/ws-server

# node_modules の準備
COPY --from=deps /app/ws-server/node_modules ./node_modules

# 自作パッケージを node_modules に注入
RUN mkdir -p ./node_modules/@torassen/shogi-logic
COPY --from=shared-builder /app/packages/shogi-logic/package.json ./node_modules/@torassen/shogi-logic/
COPY --from=shared-builder /app/packages/shogi-logic/dist ./node_modules/@torassen/shogi-logic/dist
COPY --from=shared-builder /app/packages/shogi-logic/src ./node_modules/@torassen/shogi-logic/src

# サーバー本体をコピー
COPY ws-server/ .

# ここでビルド！(shogi-logic/dist があるので @torassen/shogi-logic が解決される)
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
