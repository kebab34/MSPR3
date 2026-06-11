from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

_config_file = Path(__file__).resolve()
_candidates = [_config_file.parents[i] for i in (3, 4) if len (_config_file.parents) > i]
BASE_DIR = next((p for p in _candidates if (p / ".env").exists()), _candidates[0])
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    class Config:
            env_file = str(ENV_FILE) if ENV_FILE.exists() else None
            env_file_encoding = "utf-8"
            case_sensitive = True
            extra = "ignore"

settings = Settings()
