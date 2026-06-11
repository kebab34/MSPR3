"""
Tests pour les endpoints d'authentification : /api/v1/auth/
"""

import pytest
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------

class TestLogin:
    def test_login_success(self, client, mock_db):
        mock_supa, _ = mock_db
        session = MagicMock()
        session.access_token = "fake-jwt-token"
        session.expires_in = 3600
        mock_supa.auth.sign_in_with_password.return_value = MagicMock(session=session)

        response = client.post("/api/v1/auth/login", json={
            "email": "user@example.com",
            "password": "password123"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "fake-jwt-token"
        assert data["token_type"] == "bearer"
        assert data["expires_in"] == 3600

    def test_login_wrong_credentials(self, client, mock_db):
        mock_supa, _ = mock_db
        mock_supa.auth.sign_in_with_password.side_effect = Exception("Invalid credentials")

        response = client.post("/api/v1/auth/login", json={
            "email": "user@example.com",
            "password": "wrongpassword"
        })

        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_no_session(self, client, mock_db):
        mock_supa, _ = mock_db
        mock_supa.auth.sign_in_with_password.return_value = MagicMock(session=None)

        response = client.post("/api/v1/auth/login", json={
            "email": "user@example.com",
            "password": "password123"
        })

        assert response.status_code == 401

    def test_login_missing_email(self, client, mock_db):
        response = client.post("/api/v1/auth/login", json={"password": "password123"})
        assert response.status_code == 422

    def test_login_invalid_email_format(self, client, mock_db):
        response = client.post("/api/v1/auth/login", json={
            "email": "not-an-email",
            "password": "password123"
        })
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------

class TestRegister:
    def test_register_success(self, client, mock_db):
        mock_supa, mock_admin = mock_db
        user = MagicMock()
        user.id = "new-user-uuid"
        # session=None : sinon MagicMock(session) serait truthy et casserait la validation de RegisterResponse
        mock_supa.auth.sign_up.return_value = MagicMock(user=user, session=None)
        mock_admin.table.return_value.insert.return_value.execute.return_value = MagicMock()

        response = client.post("/api/v1/auth/register", json={
            "email": "new@example.com",
            "password": "securepass123",
            "nom": "Dupont",
            "prenom": "Jean"
        })

        assert response.status_code == 201
        data = response.json()
        assert "email" in data
        assert data["email"] == "new@example.com"

    def test_register_auth_failure(self, client, mock_db):
        mock_supa, _ = mock_db
        mock_supa.auth.sign_up.side_effect = Exception("Email already registered")

        response = client.post("/api/v1/auth/register", json={
            "email": "exists@example.com",
            "password": "pass123"
        })

        assert response.status_code == 400

    def test_register_no_user_returned(self, client, mock_db):
        mock_supa, _ = mock_db
        mock_supa.auth.sign_up.return_value = MagicMock(user=None)

        response = client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "password": "pass123"
        })

        assert response.status_code == 400

    def test_register_missing_password(self, client, mock_db):
        response = client.post("/api/v1/auth/register", json={"email": "a@b.com"})
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

class TestGetMe:
    @patch("app.api.v1.endpoints.auth.fetch_app_profile", return_value=None)
    def test_me_authenticated(self, _fetch, client, auth_headers):
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "user-test-uuid-1234"
        assert data["email"] == "test@example.com"
        assert data["app_role"] == "user"
        assert data["type_abonnement"] == "freemium"

    def test_me_no_token(self, client):
        response = client.get("/api/v1/auth/me")
        assert response.status_code in (401, 403)

    def test_me_invalid_token(self, client):
        response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# PATCH /auth/me
# ---------------------------------------------------------------------------

class TestPatchMe:
    @patch("app.api.v1.endpoints.auth.fetch_app_profile")
    @patch("app.api.v1.endpoints.auth.apply_admin_bootstrap")
    @patch("app.api.v1.endpoints.auth.supabase_admin")
    def test_patch_me_success(self, mock_admin, mock_bootstrap, mock_fetch, client, auth_headers):
        prof1 = {
            "id_utilisateur": "u-1",
            "email": "test@example.com",
            "app_role": "admin",
            "type_abonnement": "freemium",
            "nom": None,
            "prenom": None,
            "age": None,
            "sexe": None,
            "poids": None,
            "taille": None,
            "objectifs": [],
        }
        prof2 = {**prof1, "prenom": "Jean", "type_abonnement": "premium"}
        mock_fetch.side_effect = [prof1, prof2]
        mock_bootstrap.side_effect = lambda e, p, s: p

        response = client.patch(
            "/api/v1/auth/me",
            headers=auth_headers,
            json={"prenom": "Jean", "type_abonnement": "premium"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["prenom"] == "Jean"
        assert data["type_abonnement"] == "premium"

    @patch("app.api.v1.endpoints.auth.fetch_app_profile", return_value=None)
    def test_patch_me_no_profile(self, _fetch, client, auth_headers):
        r = client.patch(
            "/api/v1/auth/me",
            headers=auth_headers,
            json={"prenom": "X"},
        )
        assert r.status_code == 404
