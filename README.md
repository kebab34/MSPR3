# HealthAI Coach — Plateforme de démonstration

Application de coaching santé personnalisé avec suivi nutritionnel, sportif et monitoring.

## Prérequis

- Docker + Docker Compose
- Make (Linux/Mac) ou Git Bash (Windows)

## Démarrage rapide

```bash
cp .env.example .env   # remplir les variables
make up
```

## Services

| Service | URL | Description |
|---|---|---|
| API FastAPI | http://localhost:8001 | Backend principal |
| Interface Web | http://localhost:8000 | Front-end Next.js |
| ML Service | http://localhost:8003 | Recommandations IA |
| Prometheus | http://localhost:9090 | Métriques |
| Grafana | http://localhost:3001 | Dashboards (admin/admin) |

## Commandes

```bash
make up       # Démarrer tous les services
make down     # Arrêter
make reset    # Remettre à zéro (supprime les volumes)
make logs     # Voir les logs en temps réel
```

## Configurations

```bash
docker compose up -d                                   # Complète
docker compose -f docker-compose.offline.yml up -d    # Hors-ligne
docker compose -f docker-compose.perf.yml up -d       # Performance
```

## Sauvegarde / Restauration

```bash
./scripts/backup.sh
./scripts/restore.sh backups/grafana_XXX.tar.gz backups/etl_data_XXX.tar.gz
```

## CI/CD

Pipeline GitHub Actions : tests → build des 3 images Docker.
Les tests s'exécutent automatiquement à chaque push sur `main`.

## Variables d'environnement

| Variable | Description |
|---|---|
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_KEY` | Clé publique anon |
| `SUPABASE_SERVICE_KEY` | Clé service (admin) |
| `DATABASE_URL` | URL PostgreSQL |
| `JWT_SECRET` | Secret pour vérification des tokens |
| `ADMIN_EMAILS` | Emails des administrateurs (séparés par virgule) |
| `ML_TRAIN_TOKEN` | Token pour déclencher le ré-entraînement ML |
| `HUGGINGFACE_API_TOKEN` | Token HuggingFace (optionnel) |
