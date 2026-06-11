"""
Gestion de la connexion à Supabase
"""

import logging
import os

from supabase import Client, create_client

logger = logging.getLogger(__name__)

_supabase: Client | None = None


def _url() -> str:
    return os.environ.get("SUPABASE_URL", "").strip()


def _anon_key() -> str:
    return os.environ.get("SUPABASE_KEY", "").strip()


def _service_key() -> str:
    return os.environ.get("SUPABASE_SERVICE_KEY", "").strip()


def init_supabase() -> None:
    """Initialise le client Auth (lifespan FastAPI)."""
    global _supabase
    url, key = _url(), _anon_key()
    if not url or not key:
        _supabase = None
        logger.error("SUPABASE_URL ou SUPABASE_KEY manquant")
        return
    try:
        _supabase = create_client(url, key)
        logger.info("Client Supabase Auth initialisé")
    except Exception as e:
        _supabase = None
        logger.error("Erreur initialisation Supabase Auth : %s", e)


def get_supabase() -> Client:
    if _supabase is None:
        init_supabase()
    if _supabase is None:
        raise RuntimeError("Client Supabase non initialisé")
    return _supabase


def get_supabase_admin() -> Client:
    """Client service_role — variables d'environnement directes (fiable en Docker)."""
    url, key = _url(), _service_key()
    if not url or not key:
        raise RuntimeError("SUPABASE_URL ou SUPABASE_SERVICE_KEY manquant")
    return create_client(url, key)
