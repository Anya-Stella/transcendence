FROM node:20-alpine AS base

# Install dependencies for argon2 and C++ engine
RUN apk add --no-cache python3 make g++ libc6-compat libstdc++

WORKDIR /app

# ---- Engine Builder ----
FROM base AS engine-builder
WORKDIR /engine
COPY nextjs/55engine/ ./
RUN make clean || true && make

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
RUN npm install --workspace=nextjs

# ---- Builder ----
FROM base AS builder
WORKDIR /app/nextjs
COPY --from=deps /app/nextjs/node_modules ./node_modules
COPY --from=deps /app/node_modules ../node_modules
COPY --from=shared-builder /app/packages/shogi-logic ../packages/shogi-logic
COPY nextjs/ .

RUN npx prisma generate
RUN npm run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/nextjs/public ./public
COPY --from=builder /app/nextjs/.next/standalone ./
COPY --from=builder /app/nextjs/.next/static ./.next/static
COPY --from=builder /app/nextjs/prisma ./prisma
COPY --from=builder /app/nextjs/node_modules ./node_modules
COPY --from=builder /app/nextjs/entrypoint.sh ./entrypoint.sh

# Copy 55engine binary
COPY --from=engine-builder /engine/engine ./engine/55engine
COPY --from=engine-builder /engine/legal_checker ./engine/legal_checker

RUN chmod +x entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
