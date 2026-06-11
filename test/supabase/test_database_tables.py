#!/usr/bin/env python3
"""
Script de test pour vérifier que toutes les tables de la base de données sont créées
et fonctionnent correctement.
"""

import os
import sys
from datetime import date, time, datetime
from decimal import Decimal
from dotenv import load_dotenv
from supabase import create_client, Client

# Charger les variables d'environnement
load_dotenv()

def get_supabase_client() -> Client:
    """Crée et retourne un client Supabase."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")  # Utiliser service key pour les tests
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis dans .env")
    
    return create_client(supabase_url, supabase_key)

def test_table_exists(supabase: Client, table_name: str) -> bool:
    """Vérifie si une table existe en essayant une requête simple."""
    try:
        result = supabase.table(table_name).select("count", count="exact").limit(1).execute()
        return True
    except Exception as e:
        print(f"❌ Table {table_name} n'existe pas ou erreur: {e}")
        return False

def test_insert_utilisateur(supabase: Client) -> str:
    """Teste l'insertion d'un utilisateur."""
    print("\n📝 Test insertion utilisateur...")
    try:
        data = {
            "email": f"test_{datetime.now().timestamp()}@example.com",
            "nom": "Dupont",
            "prenom": "Jean",
            "age": 30,
            "sexe": "M",
            "poids": 75.5,
            "taille": 180.0,
            "objectifs": ["perte_poids", "endurance"],
            "type_abonnement": "premium"
        }
        result = supabase.table("utilisateurs").insert(data).execute()
        user_id = result.data[0]["id_utilisateur"]
        print(f"✅ Utilisateur créé avec ID: {user_id}")
        return user_id
    except Exception as e:
        print(f"❌ Erreur lors de l'insertion utilisateur: {e}")
        raise

def test_insert_aliment(supabase: Client) -> str:
    """Teste l'insertion d'un aliment."""
    print("\n📝 Test insertion aliment...")
    try:
        data = {
            "nom": "Pomme",
            "calories": 52.0,
            "proteines": 0.3,
            "glucides": 14.0,
            "lipides": 0.2,
            "fibres": 2.4,
            "unite": "100g",
            "source": "Kaggle"
        }
        result = supabase.table("aliments").insert(data).execute()
        aliment_id = result.data[0]["id_aliment"]
        print(f"✅ Aliment créé avec ID: {aliment_id}")
        return aliment_id
    except Exception as e:
        print(f"❌ Erreur lors de l'insertion aliment: {e}")
        raise

def test_insert_exercice(supabase: Client) -> str:
    """Teste l'insertion d'un exercice."""
    print("\n📝 Test insertion exercice...")
    try:
        data = {
            "nom": "Pompes",
            "type": "force",
            "groupe_musculaire": "pectoraux",
            "niveau": "debutant",
            "equipement": "aucun",
            "description": "Exercice de musculation au poids du corps",
            "source": "ExerciseDB API"
        }
        result = supabase.table("exercices").insert(data).execute()
        exercice_id = result.data[0]["id_exercice"]
        print(f"✅ Exercice créé avec ID: {exercice_id}")
        return exercice_id
    except Exception as e:
        print(f"❌ Erreur lors de l'insertion exercice: {e}")
        raise

def test_insert_objectif(supabase: Client, user_id: str) -> str:
    """Teste l'insertion d'un objectif."""
    print("\n📝 Test insertion objectif...")
    try:
        data = {
            "id_utilisateur": user_id,
            "type_objectif": "perte_poids",
            "valeur_cible": 70.0,
            "valeur_actuelle": 75.5,
            "date_debut": str(date.today()),
            "statut": "actif"
        }
        result = supabase.table("objectifs").insert(data).execute()
        objectif_id = result.data[0]["id_objectif"]
        print(f"✅ Objectif créé avec ID: {objectif_id}")
        return objectif_id
    except Exception as e:
        print(f"❌ Erreur lors de l'insertion objectif: {e}")
        raise

def test_insert_journal_alimentaire(supabase: Client, user_id: str, aliment_id: str):
    """Teste l'insertion dans le journal alimentaire."""
    print("\n📝 Test insertion journal alimentaire...")
    try:
        data = {
            "id_utilisateur": user_id,
            "id_aliment": aliment_id,
            "date": str(date.today()),
            "heure": "08:00:00",
            "quantite": 150.0,
            "calories_totales": 78.0,
            "repas": "petit_dejeuner"
        }
        result = supabase.table("journal_alimentaire").insert(data).execute()
        journal_id = result.data[0]["id_journal"]
        print(f"✅ Entrée journal alimentaire créée avec ID: {journal_id}")
        return journal_id
    except Exception as e:
        print(f"❌ Erreur lors de l'insertion journal alimentaire: {e}")
        raise

def test_insert_session_sport(supabase: Client, user_id: str) -> str:
    """Teste l'insertion d'une session sport."""
    print("\n📝 Test insertion session sport...")
    try:
        data = {
            "id_utilisateur": user_id,
            "date": str(date.today()),
            "heure_debut": "18:00:00",
            "heure_fin": "19:00:00",
            "duree_minutes": 60,
            "intensite": "moderee",
            "calories_brûlees": 350.0
        }
        result = supabase.table("sessions_sport").insert(data).execute()
        session_id = result.data[0]["id_session"]
        print(f"✅ Session sport créée avec ID: {session_id}")
        return session_id
    except Exception as e:
        print(f"❌ Erreur lors de l'insertion session sport: {e}")
        raise

def test_insert_session_exercice(supabase: Client, session_id: str, exercice_id: str):
    """Teste l'insertion d'un exercice dans une session."""
    print("\n📝 Test insertion session_exercices...")
    try:
        data = {
            "id_session": session_id,
            "id_exercice": exercice_id,
            "serie": 1,
            "repetitions": 15,
            "poids": 0.0,
            "repos_secondes": 60,
            "ordre": 1
        }
        result = supabase.table("session_exercices").insert(data).execute()
        print(f"✅ Exercice ajouté à la session")
    except Exception as e:
        print(f"❌ Erreur lors de l'insertion session_exercices: {e}")
        raise

def test_insert_mesure_biometrique(supabase: Client, user_id: str):
    """Teste l'insertion d'une mesure biométrique."""
    print("\n📝 Test insertion mesure biométrique...")
    try:
        data = {
            "id_utilisateur": user_id,
            "date": str(date.today()),
            "poids": 75.2,
            "frequence_cardiaque_rest": 65,
            "duree_sommeil_heures": 7.5,
            "qualite_sommeil": 8,
            "calories_brûlees_jour": 2200.0,
            "pas": 8500
        }
        result = supabase.table("mesures_biometriques").insert(data).execute()
        mesure_id = result.data[0]["id_mesure"]
        print(f"✅ Mesure biométrique créée avec ID: {mesure_id}")
        return mesure_id
    except Exception as e:
        print(f"❌ Erreur lors de l'insertion mesure biométrique: {e}")
        raise

def test_queries(supabase: Client, user_id: str):
    """Teste des requêtes de lecture."""
    print("\n📊 Test des requêtes de lecture...")
    
    # Test 1: Récupérer un utilisateur
    try:
        result = supabase.table("utilisateurs").select("*").eq("id_utilisateur", user_id).execute()
        if result.data:
            print(f"✅ Utilisateur récupéré: {result.data[0]['prenom']} {result.data[0]['nom']}")
        else:
            print("❌ Utilisateur non trouvé")
    except Exception as e:
        print(f"❌ Erreur lors de la récupération utilisateur: {e}")
    
    # Test 2: Compter les objectifs
    try:
        result = supabase.table("objectifs").select("id_objectif", count="exact").eq("id_utilisateur", user_id).execute()
        print(f"✅ Nombre d'objectifs: {result.count}")
    except Exception as e:
        print(f"❌ Erreur lors du comptage objectifs: {e}")
    
    # Test 3: Récupérer le journal alimentaire
    try:
        result = supabase.table("journal_alimentaire").select("*, aliments(*)").eq("id_utilisateur", user_id).execute()
        print(f"✅ Entrées journal alimentaire: {len(result.data)}")
    except Exception as e:
        print(f"❌ Erreur lors de la récupération journal: {e}")

def cleanup_test_data(supabase: Client, user_id: str):
    """Nettoie les données de test."""
    print("\n🧹 Nettoyage des données de test...")
    try:
        # Supprimer l'utilisateur (cascade supprimera les données liées)
        supabase.table("utilisateurs").delete().eq("id_utilisateur", user_id).execute()
        print("✅ Données de test supprimées")
    except Exception as e:
        print(f"⚠️  Erreur lors du nettoyage: {e}")

def main():
    """Fonction principale de test."""
    print("=" * 60)
    print("🧪 TEST DES TABLES DE LA BASE DE DONNÉES")
    print("=" * 60)
    
    # Liste des tables attendues
    tables_attendues = [
        "utilisateurs",
        "objectifs",
        "aliments",
        "recettes",
        "recette_aliments",
        "journal_alimentaire",
        "exercices",
        "sessions_sport",
        "session_exercices",
        "mesures_biometriques",
        "progressions"
    ]
    
    try:
        # Connexion à Supabase
        print("\n🔌 Connexion à Supabase...")
        supabase = get_supabase_client()
        print("✅ Connecté à Supabase")
        
        # Vérifier que toutes les tables existent
        print("\n📋 Vérification de l'existence des tables...")
        tables_ok = []
        tables_ko = []
        
        for table in tables_attendues:
            if test_table_exists(supabase, table):
                tables_ok.append(table)
                print(f"✅ Table {table} existe")
            else:
                tables_ko.append(table)
        
        print(f"\n📊 Résultat: {len(tables_ok)}/{len(tables_attendues)} tables trouvées")
        
        if tables_ko:
            print(f"\n⚠️  Tables manquantes: {', '.join(tables_ko)}")
            return
        
        # Tests d'insertion
        print("\n" + "=" * 60)
        print("📝 TESTS D'INSERTION")
        print("=" * 60)
        
        user_id = test_insert_utilisateur(supabase)
        aliment_id = test_insert_aliment(supabase)
        exercice_id = test_insert_exercice(supabase)
        objectif_id = test_insert_objectif(supabase, user_id)
        test_insert_journal_alimentaire(supabase, user_id, aliment_id)
        session_id = test_insert_session_sport(supabase, user_id)
        test_insert_session_exercice(supabase, session_id, exercice_id)
        test_insert_mesure_biometrique(supabase, user_id)
        
        # Tests de lecture
        print("\n" + "=" * 60)
        print("📊 TESTS DE LECTURE")
        print("=" * 60)
        test_queries(supabase, user_id)
        
        # Nettoyage
        print("\n" + "=" * 60)
        print("🧹 NETTOYAGE")
        print("=" * 60)
        cleanup_test_data(supabase, user_id)
        
        print("\n" + "=" * 60)
        print("✅ TOUS LES TESTS SONT PASSÉS !")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Erreur critique: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()


