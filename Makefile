.PHONY: up down build dev lint test test-watch openapi migrate generate logs clean

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose exec jqplay npm run build

dev:
	npm run dev

lint:
	docker compose exec jqplay npm run lint

test:
	docker compose exec jqplay npm test

test-watch:
	docker compose exec jqplay npm run test:watch

openapi:
	docker compose exec jqplay npm run openapi

migrate:
	docker compose exec jqplay npx prisma migrate dev

generate:
	docker compose exec jqplay npx prisma generate

logs:
	docker compose logs -f jqplay

clean:
	docker compose down -v --rmi local
