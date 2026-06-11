#!/bin/bash

# Script d'initialisation du projet MSPR

echo "🚀 Initialisation du projet MSPR TPRE502"
echo ""

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas disponible (essayez : docker compose version)."
    exit 1
fi

echo "✅ Docker et Docker Compose sont installés"
echo ""

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env depuis .env.example..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Veuillez éditer le fichier .env avec vos credentials Supabase"
    echo ""
else
    echo "✅ Le fichier .env existe déjà"
    echo ""
fi

# Créer le dossier data pour l'ETL s'il n'existe pas
if [ ! -d "etl/data" ]; then
    mkdir -p etl/data
    echo "✅ Dossier etl/data créé"
fi

echo "📦 Construction des images Docker..."
docker compose build

echo ""
echo "✅ Initialisation terminée !"
echo ""

# Vérifier si Supabase est déjà lancé
if docker ps --filter name=supabase --format '{{.Names}}' | grep -q supabase; then
    echo "⚠️  Supabase semble déjà lancé."
    read -p "Voulez-vous le remettre à zéro ? (y/n) : " reset_supabase
    if [ "$reset_supabase" = "y" ] || [ "$reset_supabase" = "Y" ]; then
        echo "🔄 Remise à zéro de Supabase..."
        supabase db reset
    else
        echo "✅ Supabase laissé tel quel."
    fi
else
    echo "🚀 Démarrage de Supabase..."
    supabase start
fi

# Vérifier si les conteneurs MSPR sont déjà en cours
if docker ps --filter name=mspr --format '{{.Names}}' | grep -q mspr; then
    echo "⚠️  Les conteneurs MSPR semblent déjà en cours."
    read -p "Voulez-vous les supprimer ? (y/n) : " remove_mspr
    if [ "$remove_mspr" = "y" ] || [ "$remove_mspr" = "Y" ]; then
        echo "🗑️  Suppression des conteneurs MSPR..."
        docker compose down
    else
        echo "✅ Conteneurs MSPR laissés tels quels."
        echo "API : http://localhost:8001/docs"
        echo "Web : http://localhost:${WEB_PORT_DISPLAY}"
        exit 0
    fi
fi

echo ""
echo "➜  Démarrage des conteneurs (Ctrl+C pour arrêter)."
echo "   API : http://localhost:8001/docs"
echo "   Web : http://localhost:${WEB_PORT_DISPLAY}"
echo "   Astuce : port déjà utilisé → éditer WEB_PORT dans .env ou arrêter l’autre processus."
echo "   Anciens conteneurs (ex. streamlit) : nettoyés avec --remove-orphans."
echo ""
docker compose up --remove-orphans
echo ""
echo "API : http://localhost:8001/docs"
echo "Web : http://localhost:${WEB_PORT_DISPLAY}"
echo ""

  