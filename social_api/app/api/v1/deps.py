from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.security import verify_token
from app.core.database import get_supabase_admin

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    payload = verify_token(credentials.credentials)
    auth_id = payload.get("sub")
    if not auth_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Token invalide")
    email = payload.get("email") or payload.get("user_metadata", {}).get("email") or ""
    return {"auth_id": auth_id, "email": email}

async def get_current_profile(user: dict = Depends(get_current_user)) -> dict:
    admin = get_supabase_admin()
    res = admin.table("utilisateurs").select("id_utilisateur, nom, prenom") \
        .eq("auth_id", user["auth_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Aucun profil lié à ce compte.")
    profile = res.data[0]
    return {**user, "id_utilisateur": profile["id_utilisateur"],
            "nom": profile.get("nom"), "prenom": profile.get("prenom")}
