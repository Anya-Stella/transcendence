FROM node:20-alpine AS base

WORKDIR /app

# ---- Shared Package Build ----
FROM base AS shared-builder
WORKDIR /app/packages/shogi-logic
COPY packages/shogi-logic/package.json ./
COPY packages/shogi-logic/tsconfig.json ./
COPY packages/shogi-logic/src/ ./src/
RUN npm install
RUN npm run build

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY nextjs/package.json ./nextjs/
COPY ws-server/package.json ./ws-server/
COPY packages/shogi-logic/package.json ./packages/shogi-logic/
RUN npm install --workspace=ws-server

# ---- Builder ----
FROM base AS builder
WORKDIR /app/ws-server
COPY --from=deps /app/ws-server/node_modules ./node_modules
COPY --from=deps /app/node_modules ../node_modules
COPY --from=shared-builder /app/packages/shogi-logic ../packages/shogi-logic
COPY ws-server/ .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
