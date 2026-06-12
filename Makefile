.PHONY: up down reset logs up-offline up-perf

# Configuration complète (défaut)
up:
		docker compose up -d

down:
		docker compose down

reset:
		docker compose down -v
		docker compose up -d

logs:
		docker compose logs -f

# Configuration hors-ligne (sans HuggingFace ni Kaggle)
up-offline:
		docker compose -f docker-compose.offline.yml up -d

# Configuration performance (matériel modeste, sans Grafana)
up-perf:
		docker compose -f docker-compose.perf.yml up -d