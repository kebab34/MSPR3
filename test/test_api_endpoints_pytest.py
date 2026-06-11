"""
Tests d'intégration des endpoints CRUD de l'API (avec Supabase mocké).
"""

import pytest
from unittest.mock import MagicMock


class TestHealthEndpoint:
    def test_health_root(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    def test_health_v1(self, client):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


class TestUtilisateursEndpoints:
    def test_get_utilisateurs(self, client, supabase_mock):
        supabase_mock.table.return_value.select.return_value.range.return_value.execute.return_value = MagicMock(
            data=[{
                "id_utilisateur": "00000000-0000-0000-0000-000000000001",
                "email": "a@b.com",
                "type_abonnement": "freemium",
                "app_role": "user",
                "created_at": "2026-01-01T00:00:00",
                "updated_at": "2026-01-01T00:00:00",
            }]
        )
        resp = client.get("/api/v1/utilisateurs")
        assert resp.status_code == 200

    def test_create_utilisateur_with_auth(self, client, supabase_mock, auth_headers):
        supabase_mock.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=[{
                "id_utilisateur": "00000000-0000-0000-0000-000000000002",
                "email": "new@test.com",
                "type_abonnement": "freemium",
                "app_role": "user",
                "created_at": "2026-01-01T00:00:00",
                "updated_at": "2026-01-01T00:00:00",
            }]
        )
        resp = client.post("/api/v1/utilisateurs", json={
            "email": "new@test.com",
            "type_abonnement": "freemium",
        }, headers=auth_headers)
        assert resp.status_code == 201


class TestAlimentsEndpoints:
    def test_get_aliments_public(self, client, supabase_mock, auth_headers):
        supabase_mock.table.return_value.select.return_value.range.return_value.order.return_value.execute.return_value = MagicMock(
            data=[]
        )
        resp = client.get("/api/v1/aliments", headers=auth_headers)
        assert resp.status_code == 200

    def test_create_aliment_requires_auth(self, client):
        resp = client.post("/api/v1/aliments", json={"nom": "Test"})
        assert resp.status_code in (401, 403)


class TestExercicesEndpoints:
    def test_get_exercices_public(self, client, supabase_mock, auth_headers):
        supabase_mock.table.return_value.select.return_value.range.return_value.order.return_value.execute.return_value = MagicMock(
            data=[]
        )
        resp = client.get("/api/v1/exercices", headers=auth_headers)
        assert resp.status_code == 200

    def test_create_exercice_requires_auth(self, client):
        resp = client.post("/api/v1/exercices", json={"nom": "Test"})
        assert resp.status_code in (401, 403)


class TestJournalEndpoints:
    def test_get_journal_public(self, client, supabase_mock, auth_headers):
        supabase_mock.table.return_value.select.return_value.range.return_value.order.return_value.execute.return_value = MagicMock(
            data=[]
        )
        resp = client.get("/api/v1/journal", headers=auth_headers)
        assert resp.status_code == 200

    def test_create_journal_requires_auth(self, client):
        resp = client.post("/api/v1/journal", json={})
        assert resp.status_code in (401, 403)


class TestSessionsEndpoints:
    def test_get_sessions_public(self, client, supabase_mock, auth_headers):
        supabase_mock.table.return_value.select.return_value.range.return_value.order.return_value.execute.return_value = MagicMock(
            data=[]
        )
        resp = client.get("/api/v1/sessions", headers=auth_headers)
        assert resp.status_code == 200


class TestMesuresEndpoints:
    def test_get_mesures_public(self, client, supabase_mock, auth_headers):
        supabase_mock.table.return_value.select.return_value.range.return_value.order.return_value.execute.return_value = MagicMock(
            data=[]
        )
        resp = client.get("/api/v1/mesures", headers=auth_headers)
        assert resp.status_code == 200
