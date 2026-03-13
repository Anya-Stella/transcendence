FROM node:20-alpine AS base

WORKDIR /app

# ---- Shared Package Build ----
FROM base AS shared-builder
WORKDIR /shared
COPY packages/shogi-logic/package.json ./
COPY packages/shogi-logic/tsconfig.json ./
COPY packages/shogi-logic/src/ ./src/
RUN npm install
RUN npm run build

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
COPY ws-server/package.json ./
RUN node -e "const p=require('./package.json'); delete p.dependencies['@torassen/shogi-logic']; require('fs').writeFileSync('./package.json', JSON.stringify(p,null,2))"
RUN npm install

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /shared ./node_modules/@torassen/shogi-logic
COPY ws-server/ .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
