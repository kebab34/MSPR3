"""
Profil application (rôle, abonnement) lié à la table utilisateurs.
Lecture/écriture via PostgREST HTTP (fiable sous uvicorn).
"""

import logging
from typing import Any, Optional

from app.core.postgrest_admin import insert_row, select_rows, update_rows

logger = logging.getLogger(__name__)

_COLS_PROFILE = (
    "id_utilisateur,email,app_role,type_abonnement,auth_id,"
    "nom,prenom,age,sexe,poids,taille,objectifs"
)
_COLS_MIN = "id_utilisateur,email,app_role,type_abonnement,auth_id"


def _fetch_row(cols: str, field: str, value: str) -> Optional[dict[str, Any]]:
    if not value:
        return None
    try:
        rows = select_rows("utilisateurs", cols, {field: value}, limit=1)
        return rows[0] if rows else None
    except Exception as e:
        logger.warning("Lecture profil (%s=%r) échouée : %s", field, value, e)
        return None


def _fetch_with_fallback(field: str, value: str) -> Optional[dict[str, Any]]:
    for cols in (_COLS_PROFILE, _COLS_MIN):
        row = _fetch_row(cols, field, value)
        if row is not None:
            return row
    return None


def fetch_app_profile(auth_id: str, email: str) -> Optional[dict[str, Any]]:
    """
    Récupère la ligne utilisateurs liée à auth (auth_id) ou, à défaut, à l'email
    (liaison rétroactive de comptes créés avant auth_id).
    """
    row = _fetch_with_fallback("auth_id", auth_id)
    if row:
        return row

    if not email:
        return None
    row = _fetch_with_fallback("email", email)
    if not row:
        return None
    if not row.get("auth_id") and auth_id:
        try:
            update_rows(
                "utilisateurs",
                {"id_utilisateur": str(row["id_utilisateur"])},
                {"auth_id": auth_id},
            )
        except Exception:
            pass
        row["auth_id"] = auth_id
    return row


def ensure_app_profile(auth_id: str, email: str) -> Optional[dict[str, Any]]:
    """Charge le profil métier ou le crée si absent (compte Auth sans ligne utilisateurs)."""
    prof = fetch_app_profile(auth_id, email)
    if prof:
        return prof
    if not email:
        return None
    try:
        created = insert_row(
            "utilisateurs",
            {
                "email": email,
                "auth_id": auth_id,
                "type_abonnement": "freemium",
                "app_role": "user",
            },
        )
        if created:
            return created[0]
    except Exception as e:
        logger.warning("Création profil métier à la volée : %s", e)
    return fetch_app_profile(auth_id, email)


def apply_admin_bootstrap(
    email: str, row: dict, admin_emails: list[str]
) -> dict[str, Any]:
    """Si l'email est listé en ADMIN, assure app_role=admin côté base."""
    em = (email or "").lower().strip()
    admins = {a.lower().strip() for a in admin_emails if a}
    if not admins or em not in admins:
        return row
    if str(row.get("app_role", "user")) == "admin":
        return row
    try:
        update_rows(
            "utilisateurs",
            {"id_utilisateur": str(row["id_utilisateur"])},
            {"app_role": "admin"},
        )
        row["app_role"] = "admin"
    except Exception:
        pass
    return row
