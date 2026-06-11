#!/bin/bash
GRAFANA_BACKUP=$1
ETL_BACKUP=$2

if [ -z "$GRAFANA_BACKUP" ] || [ -z "$ETL_BACKUP" ]; then
    echo "Usage: ./scripts/restore.sh <grafana_backup.tar.gz> <etl_data_backup.tar.gz>"
    exit 1
fi

# Restauration Grafana
docker run --rm \
  -v mspr3_grafana_data:/data \
  -v $(pwd)/backups:/backups \
  alpine sh -c "rm -rf /data/* && tar xzf /backups/$(basename $GRAFANA_BACKUP) -C /data"

# Restauration ETL
tar xzf $ETL_BACKUP

echo "Restauration terminé."