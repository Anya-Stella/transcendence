#!/bin/sh

# 1. DBが立ち上がるのを少し待つ（念のため）
echo "Waiting for database..."
sleep 3

# 2. テーブルを作成・同期
npx prisma db push

# 3. シードを実行
npx prisma db seed

# 4. 本来のコマンド（Next.jsの起動）を実行
exec "$@"