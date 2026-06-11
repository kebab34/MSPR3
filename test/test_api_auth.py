"""
Tests unitaires pour l'authentification JWT de l'API.
"""

import pytest
from unittest.mock import MagicMock, patch
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))


@pytest.mark.skip(reason="Fonctions hash_password/create_access_token/decode_access_token supprimées — security.py utilise désormais Supabase JWT")
class TestSecurityModule:
    """Tests du module core/security.py (pur Python, pas besoin de Supabase)."""

    def test_hash_and_verify_password(self):
        from app.core.security import hash_password, verify_password
        hashed = hash_password("my_password")
        assert hashed != "my_password"
        assert verify_password("my_password", hashed)
        assert not verify_password("wrong_password", hashed)

    def test_create_and_decode_token(self):
        from app.core.security import create_access_token, decode_access_token
        payload = {"sub": "user@test.com", "id_utilisateur": "abc"}
        token = create_access_token(payload)
        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded["sub"] == "user@test.com"

    def test_decode_invalid_token(self):
        from app.core.security import decode_access_token
        assert decode_access_token("invalid.token.here") is None


class TestAuthEndpoints:
    """Tests des endpoints /auth/* avec Supabase mocké."""

    @pytest.mark.skip(reason="Teste l'ancienne auth table-based — l'API utilise maintenant Supabase Auth sign_up")
    def test_register_success(self, client, supabase_mock):
        pass

    @pytest.mark.skip(reason="Teste l'ancienne auth table-based — l'API utilise maintenant Supabase Auth sign_up")
    def test_register_duplicate_email(self, client, supabase_mock):
        pass

    @pytest.mark.skip(reason="Utilise hash_password qui n'existe plus — l'API utilise Supabase Auth sign_in_with_password")
    def test_login_success(self, client, supabase_mock):
        pass

    @pytest.mark.skip(reason="Utilise hash_password qui n'existe plus — l'API utilise Supabase Auth sign_in_with_password")
    def test_login_wrong_password(self, client, supabase_mock):
        pass

    @pytest.mark.skip(reason="Teste l'ancienne auth table-based — l'API utilise maintenant Supabase Auth sign_in_with_password")
    def test_login_nonexistent_user(self, client, supabase_mock):
        pass

    def test_me_authenticated(self, client, supabase_mock, auth_headers):
        resp = client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == "user@test.com"

    def test_me_unauthenticated(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code in (401, 403)
