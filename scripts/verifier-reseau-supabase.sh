#!/usr/bin/env bash
# Diagnostic : les services Supabase doivent joindre supabase_db_MSPR1:5432 (TCP) sur le réseau bridge.
# Si "Operation timed out" / "tcp connect: timeout" dans les logs, le trafic inter-conteneurs est filtré.
# Usage (depuis la racine du dépôt) : ./scripts/verifier-reseau-supabase.sh

set -euo pipefail
cd "$(dirname "$0")/.."
NET="supabase_network_MSPR1"

if ! docker network inspect "$NET" &>/dev/null; then
  echo "Réseau $NET introuvable. Lance d'abord : supabase start (même s'il échoue après)."
  exit 1
fi

DB_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' supabase_db_MSPR1 2>/dev/null || true)
if [ -z "$DB_IP" ]; then
  echo "Conteneur supabase_db_MSPR1 introuvable (supabase en cours d'exécution ?)."
  exit 1
fi

echo "Réseau : $NET"
echo "IP PostgreSQL (conteneur) : $DB_IP"
echo "Test TCP depuis un conteneur éphémère (doit afficher 'open' en <2s) :"
if docker run --rm --network "$NET" alpine:3.20 sh -c "apk add -q netcat-openbsd 2>/dev/null; nc -z -w 2 $DB_IP 5432 && echo OK || echo ECHEC"; then
  echo "=> Connexion conteneur -> DB : OK"
else
  echo "=> Connexion conteneur -> DB : ECHEC (même symptôme que Realtime/Storage/PostgREST)"
  echo ""
  echo "Pistes (Ubuntu/Debian, à essayer, puis : sudo systemctl restart docker) :"
  echo "  sudo ufw default allow FORWARD"
  echo "  sudo ufw allow in on docker0"
  echo "  sudo iptables -P FORWARD ACCEPT"
  echo "Vérifie aussi VPN, corpo firewall, ou /etc/docker/daemon.json (iptables: true)."
  exit 1
fi
