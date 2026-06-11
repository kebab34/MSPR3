#!/usr/bin/env bash
# Libère les ports hôte souvent bloqués par des docker-proxy orphelins
# (typiquement après un `supabase start` interrompu ou un `supabase stop` incomplet).
# Usage : ./scripts/liberer-ports-docker-proxy.sh
# Nécessite sudo (les proxy écoutent en root).

set -euo pipefail

PORTS=(54322 54321 54323 54324 8000 8001)

for p in "${PORTS[@]}"; do
  if ss -tln 2>/dev/null | grep -qE ":$p[[:space:]]"; then
    echo "Port $p : tentative de libération (fuser -k)…"
    sudo fuser -k "${p}/tcp" 2>/dev/null || true
  fi
done

echo ""
echo "État des ports :"
ss -tlnp 2>/dev/null | grep -E ':54322|:54321|:8001|:8000' || echo "(aucun de ces ports n’écoute — OK)"
