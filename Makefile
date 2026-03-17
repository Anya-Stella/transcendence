.PHONY: test prod down-test down-prod rmi

# 開発・テスト用
test:
	docker compose -f docker-compose.dev.yml up --build -d
	@echo "開発用環境が起動しました（ホットリロード有効）"

# 本番用
prod:
	docker compose -f docker-compose.yml up --build -d
	@echo "本番用環境が起動しました"

# 開発環境の停止
down-test:
	docker compose -f docker-compose.dev.yml down

# 本番環境の停止
down-prod:
	docker compose down

# 未使用イメージの削除
rmi:
	docker image prune -a

studio:
	docker compose -f docker-compose.dev.yml exec nextjs npx prisma studio