"""
Configuration pytest pour les tests API.
Patche le client Supabase avant l'import de l'app pour ne pas nécessiter de vraie connexion.
"""

import os
import sys
from unittest.mock import MagicMock, patch

# Ajouter le dossier api/ au path Python
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "api"))

# Variables d'environnement factices pour les tests
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
os.environ.setdefault("JWT_SECRET", "super-secret-test-key-for-pytest-only-1234567890")

import pytest

# Mock du client Supabase avant tout import de l'app
_mock_supabase = MagicMock()
_mock_supabase_admin = MagicMock()

with patch("supabase.create_client", return_value=_mock_supabase):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.api.v1 import deps as _deps
    import app.core.database as db
    db._supabase = _mock_supabase
    db.get_supabase_admin = lambda: _mock_supabase_admin
    db.get_supabase = lambda: _mock_supabase

    async def _fake_require_admin():
        return {
            "id": "admin-test-uuid",
            "email": "admin@example.com",
            "profile": {"app_role": "admin", "id_utilisateur": "00000000-0000-0000-0000-000000000001"},
        }

    async def _fake_get_current_profile():
        return {
            "id": "user-test-uuid-1234",
            "email": "test@example.com",
            "id_utilisateur": "00000000-0000-0000-0000-000000000001",
            "app_role": "user",
        }

    app.dependency_overrides[_deps.require_admin] = _fake_require_admin
    app.dependency_overrides[_deps.get_current_profile] = _fake_get_current_profile


@pytest.fixture
def client():
    from app.main import app
    from fastapi.testclient import TestClient
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def mock_db(monkeypatch):
    """
    Fixture qui expose les deux mocks Supabase.
    Utilise des MagicMock frais pour isoler chaque test.
    """
    mock_supa = MagicMock()
    mock_admin = MagicMock()
    import app.core.database as dbc
    monkeypatch.setattr(dbc, "get_supabase_admin", lambda: mock_admin)
    monkeypatch.setattr(dbc, "get_supabase", lambda: mock_supa)
    monkeypatch.setattr(dbc, "create_client", lambda url, key: mock_admin)
    return mock_supa, mock_admin


@pytest.fixture
def auth_headers():
    """
    Headers Bearer avec un token JWT valide pour les tests.
    Le token est signé avec JWT_SECRET défini plus haut.
    """
    from jose import jwt as jose_jwt
    from app.core.config import settings

    payload = {"sub": "user-test-uuid-1234", "email": "test@example.com"}
    token = jose_jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return {"Authorization": f"Bearer {token}"}
