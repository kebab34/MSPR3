#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups

# Sauvegarde du volume Grafana
docker run --rm \
    -v mspr3_grafana_data:/data \
    -v $(pwd)/backups:/backups \
    alpine tar czf /backups/grafana_$DATE.tar.gz -C /data .

# Sauvegarde des données ETL
tar czf backups/etl_data_$DATE.tar.gz etl/data/

echo "Backup terminé : backups/grafana_$DATE.tar.gz + backups/etl_data_$DATE.tar.gz"

