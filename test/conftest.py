"""
Configuration pytest partagée — fixtures pour les tests unitaires et d'intégration.
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "etl"))


# --------------- Fixtures API (FastAPI TestClient) ---------------

@pytest.fixture(scope="session")
def _mock_supabase():
    """Mock Supabase globalement avant tout import de l'app."""
    mock_client = MagicMock()
    mock_admin = MagicMock()

    with patch.dict(os.environ, {
        "SUPABASE_URL": "http://localhost:54321",
        "SUPABASE_KEY": "fake-anon-key",
        "SUPABASE_SERVICE_KEY": "fake-service-key",
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:54322/postgres",
        "JWT_SECRET": "test-secret-key-for-unit-tests-min-32-chars-ok-123",
        "JWT_ALGORITHM": "HS256",
    }):
        with patch("app.core.database.create_client", return_value=mock_client):
            with patch("app.core.database.supabase", mock_client):
                with patch("app.core.database.supabase_admin", mock_admin):
                    yield mock_admin


@pytest.fixture()
def client(_mock_supabase):
    """FastAPI TestClient avec Supabase mocké et garde admin contournable pour /utilisateurs."""
    from fastapi.testclient import TestClient
    from app.main import app
    from app.api.v1 import deps

    async def _fake_require_admin():
        return {
            "id": "admin-uuid",
            "email": "admin@example.com",
            "profile": {
                "app_role": "admin",
                "id_utilisateur": "00000000-0000-0000-0000-000000000001",
            },
        }

    app.dependency_overrides[deps.require_admin] = _fake_require_admin
    yield TestClient(app, raise_server_exceptions=False)


@pytest.fixture()
def supabase_mock(_mock_supabase, monkeypatch):
    """
    Même instance que le client DB pour les tests racine, synchronisée sur les modules
    endpoints (le scope api/ peut y avoir rattaché un autre mock).
    """
    _mock_supabase.reset_mock()
    import app.core.database as dbc
    import app.api.v1.endpoints.utilisateurs as u_mod
    import app.api.v1.endpoints.aliments as a_mod
    import app.api.v1.endpoints.exercices as e_mod
    import app.api.v1.endpoints.journal as j_mod
    import app.api.v1.endpoints.sessions as s_mod
    import app.api.v1.endpoints.mesures as m_mod

    monkeypatch.setattr(dbc, "supabase_admin", _mock_supabase)
    for m in (u_mod, a_mod, e_mod, j_mod, s_mod, m_mod):
        monkeypatch.setattr(m, "supabase_admin", _mock_supabase)
    return _mock_supabase


@pytest.fixture()
def auth_headers():
    """JWT de test, compatible avec app.core.security.verify_token."""
    from jose import jwt as jose_jwt
    from app.core.config import settings

    payload = {"sub": "00000000-0000-0000-0000-0000000000aa", "email": "user@test.com"}
    token = jose_jwt.encode(
        payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    return {"Authorization": f"Bearer {token}"}
