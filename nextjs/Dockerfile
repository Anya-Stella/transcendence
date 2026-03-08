FROM node:20-alpine AS base

# Install dependencies for argon2 and C++ engine
RUN apk add --no-cache python3 make g++ libc6-compat libstdc++

WORKDIR /app

# ---- Engine Builder ----
FROM base AS engine-builder
WORKDIR /engine
COPY ../55engine/ ./
RUN make clean || true && make

# ---- Dependencies ----
FROM base AS deps
COPY package.json ./
RUN npm install

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Copy 55engine binary
COPY --from=engine-builder /engine/engine ./engine/55engine
COPY --from=engine-builder /engine/legal_checker ./engine/legal_checker

RUN chmod +x entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
