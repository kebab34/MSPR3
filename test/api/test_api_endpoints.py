"""
Tests pytest pour les endpoints CRUD de l'API.
Remplace l'ancien script de test manuel.
"""

import pytest
from unittest.mock import MagicMock
from uuid import uuid4
from datetime import datetime


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_utilisateur(overrides=None):
    base = {
        "id_utilisateur": str(uuid4()),
        "email": "user@example.com",
        "nom": "Dupont",
        "prenom": "Jean",
        "age": 30,
        "sexe": "M",
        "poids": 75.0,
        "taille": 180.0,
        "objectifs": ["perte_de_poids"],
        "type_abonnement": "freemium",
        "app_role": "user",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    if overrides:
        base.update(overrides)
    return base


def make_aliment(overrides=None):
    base = {
        "id_aliment": str(uuid4()),
        "nom": "Poulet rôti",
        "calories": 250.0,
        "proteines": 30.0,
        "glucides": 0.0,
        "lipides": 12.0,
        "fibres": 0.0,
        "unite": "100g",
        "source": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    if overrides:
        base.update(overrides)
    return base


def make_exercice(overrides=None):
    base = {
        "id_exercice": str(uuid4()),
        "nom": "Squat",
        "type_exercice": "force",
        "groupe_musculaire": "jambes",
        "niveau": "debutant",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    if overrides:
        base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class TestHealth:
    def test_health_root(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_health_v1(self, client):
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    def test_root(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert "version" in response.json()


# ---------------------------------------------------------------------------
# Utilisateurs
# ---------------------------------------------------------------------------

class TestUtilisateurs:
    def test_get_list(self, client, mock_db):
        _, mock_admin = mock_db
        utilisateurs = [make_utilisateur(), make_utilisateur({"email": "b@b.com"})]
        mock_admin.table.return_value.select.return_value.range.return_value.execute.return_value = MagicMock(data=utilisateurs)

        response = client.get("/api/v1/utilisateurs")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_get_list_filter_by_type(self, client, mock_db):
        _, mock_admin = mock_db
        mock_admin.table.return_value.select.return_value.eq.return_value.range.return_value.execute.return_value = MagicMock(data=[make_utilisateur({"type_abonnement": "premium"})])

        response = client.get("/api/v1/utilisateurs?type_abonnement=premium")
        assert response.status_code == 200

    def test_get_one_found(self, client, mock_db):
        _, mock_admin = mock_db
        uid = str(uuid4())
        utilisateur = make_utilisateur({"id_utilisateur": uid})
        mock_admin.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[utilisateur])

        response = client.get(f"/api/v1/utilisateurs/{uid}")
        assert response.status_code == 200
        assert response.json()["id_utilisateur"] == uid

    def test_get_one_not_found(self, client, mock_db):
        _, mock_admin = mock_db
        mock_admin.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

        response = client.get(f"/api/v1/utilisateurs/{uuid4()}")
        assert response.status_code == 404

    def test_create(self, client, mock_db):
        _, mock_admin = mock_db
        created = make_utilisateur()
        mock_admin.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[created])

        payload = {
            "email": "new@example.com",
            "nom": "Martin",
            "prenom": "Paul",
            "type_abonnement": "freemium",
        }
        response = client.post("/api/v1/utilisateurs", json=payload)
        assert response.status_code == 201

    def test_create_invalid_abonnement(self, client, mock_db):
        response = client.post("/api/v1/utilisateurs", json={
            "email": "x@x.com",
            "type_abonnement": "invalid_type",
        })
        assert response.status_code == 422

    def test_update(self, client, mock_db):
        _, mock_admin = mock_db
        uid = str(uuid4())
        updated = make_utilisateur({"id_utilisateur": uid, "nom": "NouveauNom"})
        mock_admin.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[updated])

        response = client.put(f"/api/v1/utilisateurs/{uid}", json={"nom": "NouveauNom"})
        assert response.status_code == 200
        assert response.json()["nom"] == "NouveauNom"

    def test_delete(self, client, mock_db):
        _, mock_admin = mock_db
        uid = str(uuid4())
        mock_admin.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock(data=[make_utilisateur()])

        response = client.delete(f"/api/v1/utilisateurs/{uid}")
        assert response.status_code == 204


# ---------------------------------------------------------------------------
# Aliments
# ---------------------------------------------------------------------------

class TestAliments:
    def test_get_list(self, client, mock_db, auth_headers):
        _, mock_admin = mock_db
        mock_admin.table.return_value.select.return_value.range.return_value.order.return_value.execute.return_value = MagicMock(data=[make_aliment()])

        response = client.get("/api/v1/aliments", headers=auth_headers)
        assert response.status_code == 200

    def test_get_one_not_found(self, client, mock_db, auth_headers):
        _, mock_admin = mock_db
        mock_admin.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

        response = client.get(f"/api/v1/aliments/{uuid4()}", headers=auth_headers)
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Exercices
# ---------------------------------------------------------------------------

class TestExercices:
    def test_get_list(self, client, mock_db, auth_headers):
        _, mock_admin = mock_db
        mock_admin.table.return_value.select.return_value.range.return_value.order.return_value.execute.return_value = MagicMock(data=[make_exercice()])

        response = client.get("/api/v1/exercices", headers=auth_headers)
        assert response.status_code == 200

    def test_get_one_not_found(self, client, mock_db, auth_headers):
        _, mock_admin = mock_db
        mock_admin.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

        response = client.get(f"/api/v1/exercices/{uuid4()}", headers=auth_headers)
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Journal (routes protégées)
# ---------------------------------------------------------------------------

class TestJournal:
    def _journal_entry(self):
        return {
            "id_journal": str(uuid4()),
            "id_utilisateur": str(uuid4()),
            "id_aliment": str(uuid4()),
            "quantite": 150.0,
            "date_consommation": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

    def test_get_list_public(self, client, mock_db, auth_headers):
        _, mock_admin = mock_db
        mock_admin.table.return_value.select.return_value.range.return_value.order.return_value.execute.return_value = MagicMock(data=[self._journal_entry()])

        response = client.get("/api/v1/journal", headers=auth_headers)
        assert response.status_code == 200

    def test_create_requires_auth(self, client, mock_db):
        payload = {
            "id_utilisateur": str(uuid4()),
            "id_aliment": str(uuid4()),
            "quantite": 200.0,
        }
        response = client.post("/api/v1/journal", json=payload)
        assert response.status_code in (401, 403)

    def test_create_with_auth(self, client, mock_db, auth_headers):
        _, mock_admin = mock_db
        entry = self._journal_entry()
        mock_admin.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[entry])

        payload = {
            "id_utilisateur": str(uuid4()),
            "id_aliment": str(uuid4()),
            "quantite": 200.0,
        }
        response = client.post("/api/v1/journal", json=payload, headers=auth_headers)
        assert response.status_code == 201

    def test_delete_requires_auth(self, client, mock_db):
        response = client.delete(f"/api/v1/journal/{uuid4()}")
        assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Sessions (routes protégées)
# ---------------------------------------------------------------------------

class TestSessions:
    def _session(self):
        return {
            "id_session": str(uuid4()),
            "id_utilisateur": str(uuid4()),
            "duree": 60,
            "intensite": "moderee",
            "date_session": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

    def test_get_list_public(self, client, mock_db, auth_headers):
        _, mock_admin = mock_db
        mock_admin.table.return_value.select.return_value.range.return_value.order.return_value.execute.return_value = MagicMock(data=[self._session()])

        response = client.get("/api/v1/sessions", headers=auth_headers)
        assert response.status_code == 200

    def test_create_requires_auth(self, client, mock_db):
        payload = {
            "id_utilisateur": str(uuid4()),
            "duree": 45,
            "intensite": "elevee",
        }
        response = client.post("/api/v1/sessions", json=payload)
        assert response.status_code in (401, 403)

    def test_create_with_auth(self, client, mock_db, auth_headers):
        _, mock_admin = mock_db
        session = self._session()
        mock_admin.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[session])
        mock_admin.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[session])

        payload = {
            "id_utilisateur": str(uuid4()),
            "duree": 45,
            "intensite": "elevee",
        }
        response = client.post("/api/v1/sessions", json=payload, headers=auth_headers)
        assert response.status_code == 201


# ---------------------------------------------------------------------------
# Mesures (routes protégées)
# ---------------------------------------------------------------------------

class TestMesures:
    def test_create_requires_auth(self, client, mock_db):
        response = client.post("/api/v1/mesures", json={
            "id_utilisateur": str(uuid4()),
            "poids": 72.5,
        })
        assert response.status_code in (401, 403)
