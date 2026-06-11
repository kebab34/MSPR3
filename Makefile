.PHONY: up down reset logs

up: 
		docker compose up -d

down:
		docker compose down

reset:
		docker compose down -v
		docker compose up -d

logs:
		docker compose logs -f