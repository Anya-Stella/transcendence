#!/bin/sh
set -e

ICON_DIR="/app/nextjs/public/images/icon"

mkdir -p "$ICON_DIR" 2>/dev/null || true

# 所有者が nextjs (1001) でない、または書き込み権限がない場合
if [ "$(stat -c '%u' "$ICON_DIR" 2>/dev/null)" != "1001" ] || [ ! -w "$ICON_DIR" ]; then
  echo "Repairing permissions for $ICON_DIR..."
  chown -R nextjs:nodejs "$ICON_DIR" 2>/dev/null \
    || { echo "Warning: could not chown $ICON_DIR, continuing anyway." >&2; }
fi

echo "Pushing Prisma schema to database..."
su-exec nextjs npx prisma db push

echo "Starting Next.js with npm run start..."
exec su-exec nextjs npm run start
