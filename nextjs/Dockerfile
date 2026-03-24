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
# FROM base AS shared-builder
# WORKDIR /shared
# COPY packages/shogi-logic/package.json ./
# COPY packages/shogi-logic/tsconfig.json ./
# COPY packages/shogi-logic/src/ ./src/
# RUN npm install
# RUN npm run build
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
COPY nextjs/package.json ./
RUN node -e "const p=require('./package.json'); delete p.dependencies['@torassen/shogi-logic']; require('fs').writeFileSync('./package.json', JSON.stringify(p,null,2))"
RUN npm install

# ---- Builder ----
# FROM base AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY --from=shared-builder /shared ./node_modules/@torassen/shogi-logic
# COPY nextjs/ .

# RUN npx prisma generate
# RUN npm run build

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
RUN mkdir -p ./node_modules/@torassen/shogi-logic
COPY --from=shared-builder /app/packages/shogi-logic/package.json ./node_modules/@torassen/shogi-logic/
COPY --from=shared-builder /app/packages/shogi-logic/dist ./node_modules/@torassen/shogi-logic/dist
COPY --from=shared-builder /app/packages/shogi-logic/src ./node_modules/@torassen/shogi-logic/src
COPY nextjs/ .
RUN ls /app/node_modules/@torassen/shogi-logic/ && cat /app/node_modules/@torassen/shogi-logic/package.json | grep main
RUN npx prisma generate
RUN npm run build


# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

# Copy 55engine binary
COPY --from=engine-builder /engine/engine ./engine/55engine
COPY --from=engine-builder /engine/legal_checker ./engine/legal_checker

RUN chmod +x entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
