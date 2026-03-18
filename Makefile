# 開発・テスト用 (今回作成した専用ファイルを使用)
test:
	docker compose -f docker-compose.dev.yml up --build -d
	@echo "開発用環境が起動しました（ホットリロード有効）"

# 本番用 (既存の docker-compose.yml を使用)
prod:
	docker compose -f docker-compose.yml up --build -d
	@echo "本番用環境が起動しました"

# 開発環境の停止 (dev 専用)
down:
	docker compose -f docker-compose.dev.yml down
	@echo "開発用環境を停止しました"