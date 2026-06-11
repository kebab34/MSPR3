"""
Conftest pour les tests d'integration Supabase.
Ces tests necessitent une instance Supabase active.
"""

import os
import pytest
from dotenv import load_dotenv

load_dotenv()


@pytest.fixture(scope="session")
def supabase():
    """Client Supabase reel pour les tests d'integration."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key or key == "fake-service-key":
        pytest.skip("Supabase non disponible — test d'integration ignore")
    from supabase import create_client
    return create_client(url, key)


@pytest.fixture()
def user_id():
    pytest.skip("Necessite une instance Supabase active")


@pytest.fixture()
def aliment_id():
    pytest.skip("Necessite une instance Supabase active")


@pytest.fixture()
def exercice_id():
    pytest.skip("Necessite une instance Supabase active")


@pytest.fixture()
def session_id():
    pytest.skip("Necessite une instance Supabase active")
