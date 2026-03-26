#!/bin/sh
set -e

echo "Pushing Prisma schema to database..."
npx prisma db push

echo "Starting Next.js with npm run start..."
exec npm run start
