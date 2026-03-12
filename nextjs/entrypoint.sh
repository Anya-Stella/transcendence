#!/bin/sh
set -e

echo "Pushing Prisma schema to database..."
npx prisma db push

echo "Starting Next.js..."
exec node server.js
