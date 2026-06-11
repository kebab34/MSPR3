"""
Dépendances FastAPI — auth et rôles
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.security import verify_token
from app.core.config import get_admin_email_set
from app.core.user_profile import apply_admin_bootstrap, ensure_app_profile

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Token JWT valide : identité Supabase Auth (sub, email)."""
    payload = verify_token(credentials.credentials)
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide : champ 'sub' manquant",
        )
    email = payload.get("email") or payload.get("user_metadata", {}).get("email") or ""
    return {"id": user_id, "email": email}


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Gestion des profils, utilisateurs, etc. — rôle application admin requis."""
    prof = ensure_app_profile(user["id"], user.get("email", ""))
    if not prof:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aucun profil métier lié à ce compte. Contactez un administrateur.",
        )
    prof = apply_admin_bootstrap(
        user.get("email", ""), prof, get_admin_email_set()
    )
    if str(prof.get("app_role", "user")) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Réservé aux administrateurs",
        )
    return {**user, "profile": prof}


async def get_current_profile(user: dict = Depends(get_current_user)) -> dict:
    """Authenticated user enriched with id_utilisateur and app_role from DB."""
    prof = ensure_app_profile(user["id"], user.get("email", ""))
    if not prof:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aucun profil métier lié à ce compte.",
        )
    prof = apply_admin_bootstrap(user.get("email", ""), prof, get_admin_email_set())
    id_utilisateur = str(prof.get("id_utilisateur") or "")
    if not id_utilisateur:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Profil incomplet (id_utilisateur manquant).",
        )
    return {
        **user,
        "id_utilisateur": id_utilisateur,
        "app_role": str(prof.get("app_role", "user")),
    }


async def require_user(user: dict = Depends(get_current_user)) -> dict:
    """Toute ressource connectée (user ou admin)."""
    return user
