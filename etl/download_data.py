"""
Téléchargement automatique des datasets Kaggle nécessaires au pipeline ETL.

Le paquet Python `kaggle` impose un fichier kaggle.json avec "username" et "key"
(ou les variables KAGGLE_USERNAME + KAGGLE_KEY), pas un token seul.

- Linux : si le dossier ~/.kaggle n’existe pas, le fichier attendu est
  ~/.config/kaggle/kaggle.json (voir erreur "Could not find kaggle.json").

Options :
  1) Settings → « Legacy API Credentials » → Create Legacy API Key → placer le JSON
     au bon chemin ci-dessus.

  2) Export avant de lancer le script :
       export KAGGLE_USERNAME='ton_pseudo_kaggle'
       export KAGGLE_KEY='ta_clé_api'   # ou KAGGLE_API_TOKEN si elle joue le rôle de clé

  pip install kaggle
  python3 download_data.py
"""

import json
import os
import shutil
import sys

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# Slugs vérifiés sur Kaggle (les anciens utsavdesai26/… et waqi786/… peuvent être supprimés ou inaccessibles).
DATASETS = [
    {
        "slug": "adilshamim8/daily-food-and-nutrition-dataset",
        "file": "daily_food_nutrition_dataset.csv",
        "kaggle_file": "daily_food_nutrition_dataset.csv",
    },
    {
        "slug": "valakhorasani/gym-members-exercise-dataset",
        "file": "gym_members_exercise_tracking.csv",
        "kaggle_file": "gym_members_exercise_tracking.csv",
    },
    {
        "slug": "ziya07/diet-recommendations-dataset",
        "file": "diet_recommendations_dataset.csv",
        "kaggle_file": "diet_recommendations_dataset.csv",
    },
]


def _kaggle_config_dir() -> str:
    """Même logique que kaggle/api/kaggle_api_extended.py (KAGGLE_CONFIG_DIR, XDG sous Linux)."""
    override = os.environ.get("KAGGLE_CONFIG_DIR")
    if override:
        return override
    legacy = os.path.expanduser("~/.kaggle")
    if sys.platform.startswith("linux") and not os.path.exists(legacy):
        return os.path.join(
            os.environ.get("XDG_CONFIG_HOME") or os.path.expanduser("~/.config"),
            "kaggle",
        )
    return legacy


def _ensure_kaggle_json() -> None:
    """Crée ~/.config/kaggle/kaggle.json ou ~/.kaggle/kaggle.json si possible via l’env."""
    cfg_dir = _kaggle_config_dir()
    path = os.path.join(cfg_dir, "kaggle.json")
    if os.path.isfile(path):
        return

    user = os.environ.get("KAGGLE_USERNAME", "").strip()
    key = (os.environ.get("KAGGLE_KEY") or os.environ.get("KAGGLE_API_TOKEN") or "").strip()
    if user and key:
        os.makedirs(cfg_dir, mode=0o700, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"username": user, "key": key}, f)
        os.chmod(path, 0o600)
        print(f"ℹ️  kaggle.json écrit : {path}\n")


def check_kaggle_credentials() -> None:
    """Le module `kaggle` appelle authenticate() à l’import : il lui faut un vrai kaggle.json."""
    _ensure_kaggle_json()

    path = os.path.join(_kaggle_config_dir(), "kaggle.json")
    if os.path.isfile(path):
        return

    raise RuntimeError(
        "Credentials Kaggle manquants. "
        "Définissez KAGGLE_USERNAME et KAGGLE_KEY dans le .env "
        "(obtenez-les sur https://www.kaggle.com/settings → API → Legacy API Credentials)."
    )


def _print_kaggle_403_help() -> None:
    """Kaggle renvoie souvent 403 tant que les règles / prérequis ne sont pas validés côté site."""
    print()
    print("💡 Erreur 403 (Forbidden) — pistes courantes :")
    print("  • Va sur la page web du dataset (connecté avec le compte lié à ton kaggle.json).")
    print("  • Clique sur « Download » une première fois : une fenêtre peut demander")
    print("    d’accepter les conditions ; valide-les.")
    print("  • Kaggle impose parfois un téléphone vérifié : Account → ton profil → Phone Verification.")
    print("  • Ensuite relance : python3 download_data.py")
    print()
    print("  Plan B : télécharge le .zip depuis le site, dézippe le CSV dans etl/data/,")
    print("  puis renomme-le exactement comme dans la liste DATASETS du script.")
    print()


def download_datasets():
    check_kaggle_credentials()

    try:
        import kaggle
    except ImportError:
        raise RuntimeError("Package 'kaggle' non installé. Ajoutez-le dans requirements.txt.")

    os.makedirs(DATA_DIR, exist_ok=True)

    for ds in DATASETS:
        target = os.path.join(DATA_DIR, ds["file"])

        if os.path.exists(target):
            print(f"⏭️  {ds['file']} déjà présent, on passe.")
            continue

        print(f"📥 Téléchargement : {ds['slug']} ...")
        try:
            kaggle.api.dataset_download_files(
                ds["slug"],
                path=DATA_DIR,
                unzip=True,
                quiet=False,
            )

            # Renommer si le nom du fichier Kaggle diffère
            kaggle_path = os.path.join(DATA_DIR, ds["kaggle_file"])
            if ds["kaggle_file"] != ds["file"] and os.path.exists(kaggle_path):
                shutil.move(kaggle_path, target)

            if os.path.exists(target):
                print(f"✅ {ds['file']} téléchargé avec succès.")
            else:
                # Lister les fichiers téléchargés pour aider au debug
                files = os.listdir(DATA_DIR)
                print(f"⚠️  Fichier attendu '{ds['file']}' introuvable.")
                print(f"   Fichiers présents dans data/ : {files}")
                print(f"   Renomme manuellement le bon fichier en : {ds['file']}")

        except Exception as e:
            print(f"❌ Erreur pour {ds['slug']} : {e}")
            if "403" in str(e):
                _print_kaggle_403_help()

    print()
    print("Fichiers présents dans etl/data/ :")
    for f in os.listdir(DATA_DIR):
        print(f"  - {f}")


if __name__ == "__main__":
    download_datasets()
