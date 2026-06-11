"""
Script de seed - Génération de données synthétiques cohérentes
Tables : journal_alimentaire, sessions_sport, session_exercices, progressions
"""

import os
import random
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger(__name__)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

client = create_client(SUPABASE_URL, SUPABASE_KEY)

random.seed(42)  # Reproductibilité


def fetch_ids(table: str, id_col: str, limit: int = 500) -> list:
    res = client.table(table).select(id_col).limit(limit).execute()
    return [r[id_col] for r in res.data]


def random_date(days_back: int = 90) -> str:
    delta = random.randint(0, days_back)
    dt = datetime.now() - timedelta(days=delta, hours=random.randint(0, 23), minutes=random.randint(0, 59))
    return dt.isoformat()


def insert_batches(table: str, records: list, batch_size: int = 200) -> int:
    total = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        client.table(table).insert(batch).execute()
        total += len(batch)
    return total


# ─────────────────────────────────────────────────────────────────────────────
# 1. JOURNAL ALIMENTAIRE
# ─────────────────────────────────────────────────────────────────────────────

def seed_journal(user_ids: list, aliment_ids: list, entries_per_user: int = 20) -> int:
    logger.info(f"[1/3] Journal alimentaire : {len(user_ids)} users × {entries_per_user} entrées...")

    quantites = [50.0, 80.0, 100.0, 150.0, 200.0, 250.0, 300.0, 350.0, 400.0, 500.0]
    records = []

    for uid in user_ids:
        for _ in range(entries_per_user):
            records.append({
                "id_utilisateur": uid,
                "id_aliment": random.choice(aliment_ids),
                "quantite": random.choice(quantites),
                "date_consommation": random_date(90),
            })

    total = insert_batches("journal_alimentaire", records)
    logger.info(f"  ✅ {total} entrées journal insérées")
    return total


# ─────────────────────────────────────────────────────────────────────────────
# 2. SESSIONS SPORT + SESSION_EXERCICES
# ─────────────────────────────────────────────────────────────────────────────

def seed_sessions(user_ids: list, exercice_ids: list, sessions_per_user: int = 8) -> tuple:
    logger.info(f"[2/3] Sessions sport : {len(user_ids)} users × {sessions_per_user} sessions...")

    intensites = ["faible", "moderee", "elevee"]
    durees = [30, 45, 60, 75, 90, 120]

    # Générer toutes les sessions
    all_sessions = []
    for uid in user_ids:
        for _ in range(sessions_per_user):
            all_sessions.append({
                "id_utilisateur": uid,
                "duree": random.choice(durees),
                "intensite": random.choice(intensites),
                "date_session": random_date(90),
            })

    # Insérer par batches et récupérer les IDs générés
    session_ids = []
    batch_size = 200
    for i in range(0, len(all_sessions), batch_size):
        batch = all_sessions[i:i + batch_size]
        res = client.table("sessions_sport").insert(batch).execute()
        session_ids.extend([r["id_session"] for r in res.data])

    logger.info(f"  ✅ {len(session_ids)} sessions insérées")

    # Générer les exercices liés à chaque session
    session_exercice_records = []
    for sid in session_ids:
        nb_exercices = random.randint(2, 4)
        exos = random.sample(exercice_ids, min(nb_exercices, len(exercice_ids)))
        for exo_id in exos:
            session_exercice_records.append({
                "id_session": sid,
                "id_exercice": exo_id,
                "nombre_series": random.randint(2, 5),
                "nombre_repetitions": random.randint(6, 15),
                "poids": round(random.uniform(5.0, 100.0), 1),
            })

    total_exos = insert_batches("session_exercices", session_exercice_records)
    logger.info(f"  ✅ {total_exos} exercices liés aux sessions insérés")

    return len(session_ids), total_exos


# ─────────────────────────────────────────────────────────────────────────────
# 3. PROGRESSIONS
# ─────────────────────────────────────────────────────────────────────────────

def seed_progressions(user_ids: list, exercice_ids: list, progressions_per_user: int = 5) -> int:
    logger.info(f"[3/3] Progressions : {len(user_ids)} users × {progressions_per_user} entrées...")

    types_progression = ["poids", "repetitions", "duree"]
    records = []

    for uid in user_ids:
        exos_choisis = random.sample(exercice_ids, min(progressions_per_user, len(exercice_ids)))
        for exo_id in exos_choisis:
            type_prog = random.choice(types_progression)
            valeur_avant = round(random.uniform(10.0, 80.0), 1)
            amelioration = round(random.uniform(1.0, 15.0), 1)
            records.append({
                "id_utilisateur": uid,
                "id_exercice": exo_id,
                "date_progression": random_date(60),
                "valeur_avant": valeur_avant,
                "valeur_apres": round(valeur_avant + amelioration, 1),
                "type_progression": type_prog,
            })

    total = insert_batches("progressions", records)
    logger.info(f"  ✅ {total} progressions insérées")
    return total


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    logger.info("=" * 60)
    logger.info("SEED — Génération de données synthétiques")
    logger.info("=" * 60)

    # Récupérer les IDs existants en base
    logger.info("Récupération des IDs en base...")
    user_ids = fetch_ids("utilisateurs", "id_utilisateur", limit=200)
    aliment_ids = fetch_ids("aliments", "id_aliment", limit=500)
    exercice_ids = fetch_ids("exercices", "id_exercice", limit=500)

    logger.info(f"  {len(user_ids)} utilisateurs, {len(aliment_ids)} aliments, {len(exercice_ids)} exercices")

    if not user_ids or not aliment_ids or not exercice_ids:
        logger.error("❌ Données manquantes en base — lancez d'abord le pipeline ETL.")
        return

    # Utiliser un sous-ensemble pour garder des volumes raisonnables
    users_journal = user_ids[:150]
    users_sessions = user_ids[:100]
    users_progressions = user_ids[:80]

    total_journal = seed_journal(users_journal, aliment_ids, entries_per_user=20)
    total_sessions, total_session_exos = seed_sessions(users_sessions, exercice_ids, sessions_per_user=8)
    total_progressions = seed_progressions(users_progressions, exercice_ids, progressions_per_user=5)

    logger.info("")
    logger.info("=" * 60)
    logger.info("✅ SEED TERMINÉ")
    logger.info(f"  journal_alimentaire  : {total_journal} entrées")
    logger.info(f"  sessions_sport       : {total_sessions} sessions")
    logger.info(f"  session_exercices    : {total_session_exos} liens")
    logger.info(f"  progressions         : {total_progressions} entrées")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
