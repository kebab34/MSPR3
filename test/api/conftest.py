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
    db.supabase = _mock_supabase
    db.supabase_admin = _mock_supabase_admin

    async def _fake_require_admin():
        return {
            "id": "admin-test-uuid",
            "email": "admin@example.com",
            "profile": {"app_role": "admin", "id_utilisateur": "00000000-0000-0000-0000-000000000001"},
        }

    # Utilisateurs : rôle admin sans JWT dans les tests unitaires
    app.dependency_overrides[_deps.require_admin] = _fake_require_admin


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
    monkeypatch.setattr("app.core.database.supabase", mock_supa)
    monkeypatch.setattr("app.core.database.supabase_admin", mock_admin)
    # Propager aux modules déjà importés
    import app.api.v1.endpoints.journal as j_mod
    import app.api.v1.endpoints.sessions as s_mod
    import app.api.v1.endpoints.mesures as m_mod
    import app.api.v1.endpoints.utilisateurs as u_mod
    import app.api.v1.endpoints.aliments as al_mod
    import app.api.v1.endpoints.exercices as ex_mod
    import app.api.v1.endpoints.auth as auth_mod
    for mod in [j_mod, s_mod, m_mod, u_mod, al_mod, ex_mod]:
        monkeypatch.setattr(mod, "supabase_admin", mock_admin)
    monkeypatch.setattr(auth_mod, "supabase", mock_supa)
    monkeypatch.setattr(auth_mod, "supabase_admin", mock_admin)
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
