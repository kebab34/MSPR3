"""
ETL Scheduler — pipeline d'ingestion et de transformation automatisé.

Modes d'exécution :
  python scheduler.py        → démarre le scheduler (exécution immédiate + cron)
  python scheduler.py run    → exécution unique (debug / CI)

Logs :
  - stdout (console Docker)
  - etl/logs/etl_YYYY-MM-DD.log  (rotation journalière)

Rapports d'exécution :
  - etl/logs/reports/report_YYYY-MM-DD_HH-MM-SS.json
    Contient : timestamp, durée, statut de chaque source, nombre de lignes,
    liste d'erreurs, résultat global (success / partial / failure).
"""

import json
import logging
import os
import sys
import time
import traceback
from datetime import datetime, timezone
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

import pandas as pd
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv

from download_data import DATA_DIR, DATASETS, download_datasets
from extract import extract_exercises_from_exercisedb, extract_from_csv
from load import SupabaseLoader
from transform import (
    clean_data,
    restore_list_columns,
    transform_diet_reco_to_utilisateurs,
    transform_exercises_from_exercisedb,
    transform_gym_members_to_mesures,
    transform_gym_members_to_utilisateurs,
    transform_nutrition_dataset,
    validate_data,
)

from ml_model import run_training as run_ml_training

# Racine du repo (MSPR1/.env) puis etl/.env — Render injecte les vars sans fichier.
_repo_root = Path(__file__).resolve().parent.parent
load_dotenv(_repo_root / ".env")
load_dotenv()

# ---------------------------------------------------------------------------
# Répertoires de logs
# ---------------------------------------------------------------------------
LOGS_DIR = Path(__file__).parent / "logs"
REPORTS_DIR = LOGS_DIR / "reports"
LOGS_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Configuration du logger (stdout + fichier tournant)
# ---------------------------------------------------------------------------
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s — %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

logger = logging.getLogger("etl")
logger.setLevel(logging.DEBUG)

if not logger.handlers:
    # Handler console
    _console = logging.StreamHandler(sys.stdout)
    _console.setLevel(logging.INFO)
    _console.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))
    logger.addHandler(_console)

    # Handler fichier (rotation quotidienne, conservation 30 jours)
    _log_file = LOGS_DIR / f"etl_{datetime.now().strftime('%Y-%m-%d')}.log"
    _file = TimedRotatingFileHandler(
        _log_file, when="midnight", backupCount=30, encoding="utf-8"
    )
    _file.setLevel(logging.DEBUG)
    _file.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))
    logger.addHandler(_file)


# ---------------------------------------------------------------------------
# Rapport d'exécution
# ---------------------------------------------------------------------------

class ExecutionReport:
    """Collecte les métriques de chaque source et génère un rapport JSON."""

    def __init__(self):
        self.started_at = datetime.now(timezone.utc)
        self.sources: list[dict] = []
        self._errors: list[str] = []

    def record_source(self, name: str, rows: int, ok: bool, error: str | None = None):
        entry = {"source": name, "rows_loaded": rows, "success": ok}
        if error:
            entry["error"] = error
            self._errors.append(f"[{name}] {error}")
        self.sources.append(entry)
        if ok:
            logger.info("  ✅ %s — %d ligne(s) chargée(s)", name, rows)
        else:
            logger.error("  ❌ %s — %s", name, error or "erreur inconnue")

    def save(self):
        finished_at = datetime.now(timezone.utc)
        duration_s = round((finished_at - self.started_at).total_seconds(), 2)

        all_ok = all(s["success"] for s in self.sources)
        any_ok = any(s["success"] for s in self.sources)
        status = "success" if all_ok else ("partial" if any_ok else "failure")

        payload = {
            "started_at": self.started_at.isoformat(),
            "finished_at": finished_at.isoformat(),
            "duration_seconds": duration_s,
            "status": status,
            "sources": self.sources,
            "errors": self._errors,
        }

        ts = self.started_at.strftime("%Y-%m-%d_%H-%M-%S")
        report_path = REPORTS_DIR / f"report_{ts}.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        logger.info(
            "Rapport sauvegardé : %s (statut=%s, durée=%.1fs)",
            report_path.name, status, duration_s,
        )
        return payload


# ---------------------------------------------------------------------------
# Pipeline principal
# ---------------------------------------------------------------------------

def run_etl_pipeline():
    """
    Pipeline ETL principal — 4 sources :
      1. ExerciseDB API (GitHub mirror public)  → exercices
      2. Daily Food & Nutrition (Kaggle)         → aliments
      3. Gym Members Exercise (Kaggle)           → utilisateurs + mesures_biometriques
      4. Diet Recommendations (Kaggle)           → utilisateurs
    """
    logger.info("=" * 60)
    logger.info("Démarrage du pipeline ETL — %s", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    logger.info("=" * 60)

    report = ExecutionReport()

    # ------------------------------------------------------------------
    # Téléchargement automatique des datasets Kaggle manquants
    # ------------------------------------------------------------------
    missing = [
        ds["file"] for ds in DATASETS
        if not os.path.exists(os.path.join(DATA_DIR, ds["file"]))
    ]
    if missing:
        logger.info("Fichiers manquants : %s — lancement du téléchargement Kaggle…", missing)
        try:
            download_datasets()
        except RuntimeError as exc:
            logger.warning("Téléchargement Kaggle impossible : %s", exc)
            logger.warning(
                "Placez les CSV manuellement dans etl/data/ "
                "ou définissez KAGGLE_USERNAME + KAGGLE_KEY dans .env"
            )

    loader = SupabaseLoader()

    # ------------------------------------------------------------------
    # 1. EXERCICES — ExerciseDB API
    # ------------------------------------------------------------------
    logger.info("\n[1/4] Extraction des exercices (ExerciseDB API)…")
    try:
        df_ex = extract_exercises_from_exercisedb(limit=200)
        df_ex = transform_exercises_from_exercisedb(df_ex)
        df_ex = clean_data(df_ex)

        if validate_data(df_ex, ["nom"]):
            ok = loader.upsert_dataframe(df_ex, "exercices", on_conflict="nom")
            report.record_source("exercices", len(df_ex), bool(ok))
        else:
            report.record_source("exercices", 0, False, "Validation échouée (colonne 'nom' manquante)")
    except Exception as exc:
        report.record_source("exercices", 0, False, traceback.format_exc(limit=3))
        logger.debug("Traceback complet :", exc_info=True)

    # ------------------------------------------------------------------
    # 2. ALIMENTS — Daily Food & Nutrition Dataset (Kaggle)
    # ------------------------------------------------------------------
    logger.info("\n[2/4] Extraction aliments (Daily Food & Nutrition Dataset)…")
    nutrition_path = os.path.join(DATA_DIR, "daily_food_nutrition_dataset.csv")
    try:
        df_nutrition = extract_from_csv(nutrition_path)
        df_aliments = transform_nutrition_dataset(df_nutrition)
        df_aliments = clean_data(df_aliments)

        if validate_data(df_aliments, ["nom", "calories"]):
            ok = loader.upsert_dataframe(df_aliments, "aliments", on_conflict="nom")
            report.record_source("aliments", len(df_aliments), bool(ok))
        else:
            report.record_source("aliments", 0, False, "Validation échouée (colonnes 'nom'/'calories')")
    except Exception as exc:
        report.record_source("aliments", 0, False, traceback.format_exc(limit=3))
        logger.debug("Traceback complet :", exc_info=True)

    # ------------------------------------------------------------------
    # 3. UTILISATEURS + MESURES — Gym Members Exercise Dataset (Kaggle)
    # ------------------------------------------------------------------
    logger.info("\n[3/4] Extraction utilisateurs (Gym Members Exercise Dataset)…")
    gym_path = os.path.join(DATA_DIR, "gym_members_exercise_tracking.csv")
    try:
        df_gym = extract_from_csv(gym_path)

        # 3a. Utilisateurs
        df_gym_users = transform_gym_members_to_utilisateurs(df_gym)
        df_gym_users = clean_data(df_gym_users)
        df_gym_users = restore_list_columns(df_gym_users, ["objectifs"])

        if validate_data(df_gym_users, ["email"]):
            ok = loader.upsert_dataframe(df_gym_users, "utilisateurs", on_conflict="email")
            report.record_source("utilisateurs_gym", len(df_gym_users), bool(ok))
        else:
            report.record_source("utilisateurs_gym", 0, False, "Validation échouée (colonne 'email')")

        # 3b. Mesures biométriques — récupérer les UUIDs insérés
        logger.info("Récupération des UUIDs pour les mesures biométriques…")
        gym_emails = list(df_gym_users["email"].dropna().unique())
        email_to_id: dict[str, str] = {}

        # Requête par batch de 100 (limite Supabase par défaut)
        for i in range(0, len(gym_emails), 100):
            batch = gym_emails[i : i + 100]
            res = (
                loader.client.table("utilisateurs")
                .select("id_utilisateur,email")
                .in_("email", batch)
                .execute()
            )
            for row in res.data:
                email_to_id[row["email"]] = row["id_utilisateur"]

        logger.info("  %d/%d utilisateurs retrouvés pour les mesures", len(email_to_id), len(gym_emails))

        df_mesures = transform_gym_members_to_mesures(df_gym, email_to_id)
        if len(df_mesures) > 0:
            ok = loader.load_dataframe(df_mesures, "mesures_biometriques")
            report.record_source("mesures_biometriques", len(df_mesures), bool(ok))
        else:
            report.record_source("mesures_biometriques", 0, False, "Aucune mesure à charger")

    except Exception as exc:
        report.record_source("gym_members", 0, False, traceback.format_exc(limit=3))
        logger.debug("Traceback complet :", exc_info=True)

    # ------------------------------------------------------------------
    # 4. UTILISATEURS — Diet Recommendations Dataset (Kaggle)
    # ------------------------------------------------------------------
    logger.info("\n[4/4] Extraction utilisateurs (Diet Recommendations Dataset)…")
    diet_path = os.path.join(DATA_DIR, "diet_recommendations_dataset.csv")
    try:
        df_diet = extract_from_csv(diet_path)
        df_diet_users = transform_diet_reco_to_utilisateurs(df_diet)
        df_diet_users = clean_data(df_diet_users)
        df_diet_users = restore_list_columns(df_diet_users, ["objectifs"])

        if validate_data(df_diet_users, ["email"]):
            ok = loader.upsert_dataframe(df_diet_users, "utilisateurs", on_conflict="email")
            report.record_source("utilisateurs_diet", len(df_diet_users), bool(ok))
        else:
            report.record_source("utilisateurs_diet", 0, False, "Validation échouée (colonne 'email')")
    except Exception as exc:
        report.record_source("utilisateurs_diet", 0, False, traceback.format_exc(limit=3))
        logger.debug("Traceback complet :", exc_info=True)

    if os.getenv("ETL_TRAIN_MODEL", "false").lower() in {"1", "true", "yes"}:
        logger.info("\n[5/5] Entraînement du modèle prédictif de recommandations diététiques…")
        try:
            ml_result = run_ml_training()
            report.record_source(
                "model_training",
                ml_result["train_size"] + ml_result["test_size"],
                True,
                None,
            )
        except Exception as exc:
            report.record_source("model_training", 0, False, traceback.format_exc(limit=3))
            logger.debug("Traceback complet :", exc_info=True)

    # ------------------------------------------------------------------
    # Clôture
    # ------------------------------------------------------------------
    logger.info("\n" + "=" * 60)
    payload = report.save()
    logger.info("Pipeline ETL terminé — statut : %s", payload["status"].upper())
    logger.info("=" * 60)
    return payload


# ---------------------------------------------------------------------------
# Scheduler (mode continu)
# ---------------------------------------------------------------------------

def _parse_schedule(expr: str) -> CronTrigger:
    """
    Convertit une expression cron 5-champs en CronTrigger.
    Format : 'minute heure jour mois jour_semaine'
    Exemple : '0 2 * * 1'  → tous les lundis à 02h00
    """
    parts = expr.strip().split()
    if len(parts) == 5:
        minute, hour, day, month, day_of_week = parts
        return CronTrigger(
            minute=minute, hour=hour, day=day,
            month=month, day_of_week=day_of_week,
        )
    # Expression invalide → fallback hebdomadaire
    logger.warning("Expression cron invalide '%s' — fallback : 0 2 * * 1 (lundi 02h00)", expr)
    return CronTrigger(minute=0, hour=2, day_of_week=1)


def main():
    """
    Démarre le scheduler APScheduler.
    - Exécution immédiate au démarrage (pour valider la conf en production)
    - Puis selon ETL_SCHEDULE (défaut : '0 2 * * 1' = lundi 02h00)
    """
    schedule = os.getenv("ETL_SCHEDULE", "0 2 * * 1")
    trigger = _parse_schedule(schedule)

    scheduler = BlockingScheduler(timezone="UTC")
    scheduler.add_job(
        run_etl_pipeline,
        trigger=trigger,
        id="etl_job",
        name="ETL Pipeline",
        replace_existing=True,
        misfire_grace_time=3600,  # tolère 1h de retard (restart Docker, etc.)
    )

    logger.info("ETL scheduler démarré — planification : %s", schedule)
    logger.info("Répertoire des logs    : %s", LOGS_DIR.resolve())
    logger.info("Répertoire des rapports: %s", REPORTS_DIR.resolve())

    # Exécution immédiate au démarrage
    logger.info("Exécution immédiate au démarrage…")
    run_etl_pipeline()

    logger.info("Prochaine exécution planifiée selon cron : %s", schedule)
    logger.info("Appuyez sur Ctrl+C pour arrêter.")

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler arrêté proprement.")
        scheduler.shutdown()


# ---------------------------------------------------------------------------
# Point d'entrée
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # 'python scheduler.py run' → exécution unique (debug / CI)
    if len(sys.argv) > 1 and sys.argv[1] == "run":
        logger.info("Mode exécution unique (argument 'run')…")
        run_etl_pipeline()
    else:
        # Mode scheduler continu
        main()
