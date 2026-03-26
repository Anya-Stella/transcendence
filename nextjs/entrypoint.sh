#!/bin/sh
set -e

# アバター保存先フォルダを確保（volume マウント後に実行されるため確実）
mkdir -p /app/public/images/icon

echo "Pushing Prisma schema to database..."
npx prisma db push

echo "Starting Next.js with npm run start..."
exec npm run start
