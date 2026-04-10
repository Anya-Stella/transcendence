#!/bin/sh
set -e

mkdir -p "/app/nextjs/public/images/icon" 2>/dev/null || true
chown -R nextjs:nodejs "/app/nextjs/public/images/icon"

echo "Pushing Prisma schema to database..."
su-exec nextjs npx prisma db push

echo "Starting Next.js with npm run start..."
exec su-exec nextjs npm run start
