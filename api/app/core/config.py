"""
Configuration de l'application utilisant Pydantic Settings
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

# Trouver le fichier .env : racine repo (api/app/core → 4 niveaux) ou /app en Docker (3 niveaux)
_config_file = Path(__file__).resolve()
_candidates = [_config_file.parents[i] for i in (3, 4) if len(_config_file.parents) > i]
BASE_DIR = next((p for p in _candidates if (p / ".env").exists()), _candidates[0])
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    """Configuration de l'application"""
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    # Database
    DATABASE_URL: str
    
    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 3600  # 1 heure
    
    # Admins (emails) : promotion automatique app_role=admin à la connexion /me
    ADMIN_EMAILS: str = ""

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8003",
        "http://127.0.0.1:8003",
    ]
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    
    class Config:
        env_file = str(ENV_FILE) if ENV_FILE.exists() else None
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Ignorer les variables supplémentaires dans .env


settings = Settings()


def get_admin_email_set() -> List[str]:
    if not (settings.ADMIN_EMAILS and settings.ADMIN_EMAILS.strip()):
        return []
    return [e.strip().lower() for e in settings.ADMIN_EMAILS.split(",") if e.strip()]

