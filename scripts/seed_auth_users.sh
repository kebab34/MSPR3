#!/usr/bin/env bash
# Crée deux comptes Supabase Auth puis applique les rôles (admin / abonnement freemium).
# Prérequis : .env à la racine du projet avec SUPABASE_URL et SUPABASE_SERVICE_KEY.
# Local : supabase start, puis lancer ce script.
#
#   chmod +x scripts/seed_auth_users.sh
#   ./scripts/seed_auth_users.sh
#
# Mots de passe (démo uniquement) : admin@admin.com / admin123 , user@user.com / user123

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT_DIR/.env"
  set +a
fi

: "${SUPABASE_URL:?Définir SUPABASE_URL (ex. http://127.0.0.1:54321)}"
: "${SUPABASE_SERVICE_KEY:?Définir SUPABASE_SERVICE_KEY (clé service_role)}"

# Pas de slash final
SUPABASE_URL="${SUPABASE_URL%/}"

create_auth_user() {
  local email="$1" password="$2"
  local http body
  body="$(curl -sS -w "\n%{http_code}" -X POST \
    "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\",\"email_confirm\":true}")"
  http=$(echo "$body" | tail -n1)
  body=$(echo "$body" | sed '$d')
  if [ "$http" = "200" ] || [ "$http" = "201" ]; then
    echo "OK — compte créé : ${email}"
    return 0
  fi
  if [ "$http" = "422" ] && echo "$body" | grep -qiE 'already|registered|exists'; then
    echo "Info — compte déjà présent (ignoré) : ${email}"
    return 0
  fi
  echo "Erreur HTTP ${http} pour ${email}" >&2
  echo "$body" >&2
  return 1
}

echo "Création / vérification des comptes auth…"
create_auth_user "admin@admin.com" "admin123"
create_auth_user "user@user.com" "user123"

SQL_FILE="$ROOT_DIR/supabase/seed_auth_roles.sql"
if [ -f "$SQL_FILE" ]; then
  if command -v psql >/dev/null 2>&1 && [ -n "${DATABASE_URL:-}" ]; then
    echo "Mise à jour public.utilisateurs (rôles / abonnements) via psql…"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
  else
    echo ""
    echo "psql ou DATABASE_URL absent : exécutez manuellement dans SQL Editor (ou : psql \"\$DATABASE_URL\" -f supabase/seed_auth_roles.sql) :"
    echo "  → $SQL_FILE"
  fi
else
  echo "Fichier manquant : $SQL_FILE" >&2
  exit 1
fi

echo "Terminé."
