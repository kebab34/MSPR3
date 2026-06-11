"""
Tests unitaires pour l'authentification JWT de l'API.
"""

import pytest
from unittest.mock import MagicMock, patch
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))


class TestSecurityModule:
    """Tests du module core/security.py (pur Python, pas besoin de Supabase)."""

    def test_hash_and_verify_password(self):
        os.environ.setdefault("SUPABASE_URL", "http://localhost:54321")
        os.environ.setdefault("SUPABASE_KEY", "fake")
        os.environ.setdefault("SUPABASE_SERVICE_KEY", "fake")
        os.environ.setdefault("DATABASE_URL", "postgresql://x:x@localhost/x")
        os.environ.setdefault("JWT_SECRET", "test-secret")

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

    def test_register_success(self, client, supabase_mock):
        mock_response = MagicMock()
        mock_response.data = [
            {"id_utilisateur": "aaa-bbb", "email": "new@test.com"}
        ]
        supabase_mock.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        supabase_mock.table.return_value.insert.return_value.execute.return_value = mock_response

        resp = client.post("/api/v1/auth/register", json={
            "email": "new@test.com",
            "password": "Secret123!",
        })
        assert resp.status_code == 201
        assert "access_token" in resp.json()

    def test_register_duplicate_email(self, client, supabase_mock):
        supabase_mock.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"id_utilisateur": "exists"}]
        )
        resp = client.post("/api/v1/auth/register", json={
            "email": "existing@test.com",
            "password": "Secret123!",
        })
        assert resp.status_code == 409

    def test_login_success(self, client, supabase_mock):
        from app.core.security import hash_password
        hashed = hash_password("correct_password")

        supabase_mock.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{
                "id_utilisateur": "aaa-bbb",
                "email": "user@test.com",
                "password_hash": hashed,
            }]
        )
        resp = client.post("/api/v1/auth/login", json={
            "email": "user@test.com",
            "password": "correct_password",
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_login_wrong_password(self, client, supabase_mock):
        from app.core.security import hash_password
        hashed = hash_password("correct_password")

        supabase_mock.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{
                "id_utilisateur": "aaa-bbb",
                "email": "user@test.com",
                "password_hash": hashed,
            }]
        )
        resp = client.post("/api/v1/auth/login", json={
            "email": "user@test.com",
            "password": "wrong_password",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client, supabase_mock):
        supabase_mock.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        resp = client.post("/api/v1/auth/login", json={
            "email": "nobody@test.com",
            "password": "anything",
        })
        assert resp.status_code == 401

    def test_me_authenticated(self, client, supabase_mock, auth_headers):
        supabase_mock.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"id_utilisateur": "aaa", "email": "test@healthai.com", "nom": "Test"}]
        )
        resp = client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == "test@healthai.com"

    def test_me_unauthenticated(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401
