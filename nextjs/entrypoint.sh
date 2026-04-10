#!/bin/sh
set -e

ICON_DIR="/app/nextjs/public/images/icon"

# ディレクトリが存在しない場合のみ初期化（初回起動時の一回限り）
if [ ! -d "$ICON_DIR" ]; then
  mkdir -p "$ICON_DIR" 2>/dev/null \
    || { echo "Warning: could not create $ICON_DIR" >&2; }
  chown nextjs:nodejs "$ICON_DIR" 2>/dev/null \
    || { echo "Warning: could not chown $ICON_DIR, continuing anyway." >&2; }
fi

echo "Pushing Prisma schema to database..."
su-exec nextjs npx prisma db push

echo "Starting Next.js with npm run start..."
exec su-exec nextjs npm run start
