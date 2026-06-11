#!/bin/bash

# Script de test de la configuration

echo "🔍 Test de la configuration du projet MSPR"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier Docker
echo "1️⃣  Vérification de Docker..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker installé: $(docker --version)${NC}"
else
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose installé: $(docker-compose --version)${NC}"
else
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    exit 1
fi

echo ""

# Vérifier le fichier .env
echo "2️⃣  Vérification du fichier .env..."
if [ -f .env ]; then
    echo -e "${GREEN}✅ Le fichier .env existe${NC}"
    
    # Charger les variables
    source .env
    
    # Vérifier chaque variable
    echo ""
    echo "   Vérification des variables d'environnement:"
    
    if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "https://your-project.supabase.co" ]; then
        echo -e "   ${RED}❌ SUPABASE_URL n'est pas configuré${NC}"
    else
        echo -e "   ${GREEN}✅ SUPABASE_URL configuré${NC}"
    fi
    
    if [ -z "$SUPABASE_KEY" ] || [ "$SUPABASE_KEY" = "your-anon-key" ]; then
        echo -e "   ${RED}❌ SUPABASE_KEY n'est pas configuré${NC}"
    else
        echo -e "   ${GREEN}✅ SUPABASE_KEY configuré${NC}"
    fi
    
    if [ -z "$SUPABASE_SERVICE_KEY" ] || [ "$SUPABASE_SERVICE_KEY" = "your-service-role-key" ]; then
        echo -e "   ${RED}❌ SUPABASE_SERVICE_KEY n'est pas configuré${NC}"
    else
        echo -e "   ${GREEN}✅ SUPABASE_SERVICE_KEY configuré${NC}"
    fi
    
    if [ -z "$DATABASE_URL" ] || [[ "$DATABASE_URL" == *"your-project"* ]]; then
        echo -e "   ${RED}❌ DATABASE_URL n'est pas configuré${NC}"
    else
        echo -e "   ${GREEN}✅ DATABASE_URL configuré${NC}"
    fi
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-jwt-secret-key-here" ]; then
        echo -e "   ${RED}❌ JWT_SECRET n'est pas configuré${NC}"
    else
        echo -e "   ${GREEN}✅ JWT_SECRET configuré${NC}"
    fi
    
else
    echo -e "${RED}❌ Le fichier .env n'existe pas${NC}"
    echo "   Créez-le avec: cp .env.example .env"
    exit 1
fi

echo ""

# Vérifier la structure des dossiers
echo "3️⃣  Vérification de la structure du projet..."
required_dirs=("api" "web" "etl")
all_present=true

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "   ${GREEN}✅ Dossier $dir existe${NC}"
    else
        echo -e "   ${RED}❌ Dossier $dir manquant${NC}"
        all_present=false
    fi
done

if [ "$all_present" = false ]; then
    echo -e "${RED}❌ Structure du projet incomplète${NC}"
    exit 1
fi

echo ""

# Vérifier les fichiers Docker
echo "4️⃣  Vérification des fichiers Docker..."
if [ -f "docker-compose.yml" ]; then
    echo -e "   ${GREEN}✅ docker-compose.yml existe${NC}"
else
    echo -e "   ${RED}❌ docker-compose.yml manquant${NC}"
    exit 1
fi

if [ -f "api/Dockerfile" ]; then
    echo -e "   ${GREEN}✅ api/Dockerfile existe${NC}"
else
    echo -e "   ${RED}❌ api/Dockerfile manquant${NC}"
fi

if [ -f "web/Dockerfile" ]; then
    echo -e "   ${GREEN}✅ web/Dockerfile existe${NC}"
else
    echo -e "   ${RED}❌ web/Dockerfile manquant${NC}"
fi

if [ -f "etl/Dockerfile" ]; then
    echo -e "   ${GREEN}✅ etl/Dockerfile existe${NC}"
else
    echo -e "   ${RED}❌ etl/Dockerfile manquant${NC}"
fi

echo ""
echo "=========================================="
echo ""

# Résumé
source .env 2>/dev/null

if [ ! -z "$SUPABASE_URL" ] && [ "$SUPABASE_URL" != "https://your-project.supabase.co" ] && \
   [ ! -z "$SUPABASE_KEY" ] && [ "$SUPABASE_KEY" != "your-anon-key" ] && \
   [ ! -z "$SUPABASE_SERVICE_KEY" ] && [ "$SUPABASE_SERVICE_KEY" != "your-service-role-key" ] && \
   [ ! -z "$DATABASE_URL" ] && [[ "$DATABASE_URL" != *"your-project"* ]]; then
    echo -e "${GREEN}✅ Configuration complète !${NC}"
    echo ""
    echo "🚀 Vous pouvez maintenant lancer les services avec:"
    echo "   docker-compose up --build"
else
    echo -e "${YELLOW}⚠️  Configuration Supabase incomplète${NC}"
    echo ""
    echo "📝 Suivez les instructions dans SETUP_SUPABASE.md pour configurer Supabase"
    echo "   Une fois configuré, relancez ce script pour vérifier"
fi

echo ""


