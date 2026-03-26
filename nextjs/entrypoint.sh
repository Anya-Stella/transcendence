#!/bin/sh
set -e

# アバター保存先フォルダを確保（volume マウント後に実行されるため確実）
if ! mkdir -p /app/public/images/icon 2>/dev/null; then
  echo "Warning: could not create /app/public/images/icon. Check volume permissions or ownership." >&2
fi

echo "Pushing Prisma schema to database..."
npx prisma db push

echo "Starting Next.js with npm run start..."
exec npm run start
