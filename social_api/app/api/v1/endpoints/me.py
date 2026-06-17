from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.api.v1.deps import get_current_profile
from app.core.database import get_supabase_admin

router = APIRouter()

class ProfileUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None

@router.get("")
async def get_me(user: dict = Depends(get_current_profile)):
    admin = get_supabase_admin()
    followers_res = admin.table("follows").select("id_follow", count="exact") \
        .eq("id_following", user["id_utilisateur"]).execute()
    following_res = admin.table("follows").select("id_follow", count="exact") \
        .eq("id_follower", user["id_utilisateur"]).execute()
    return {
        "id_utilisateur": user["id_utilisateur"],
        "email": user["email"],
        "nom": user.get("nom"),
        "prenom": user.get("prenom"),
        "followers_count": followers_res.count or 0,
        "following_count": following_res.count or 0,
    }

@router.patch("")
async def update_me(body: ProfileUpdate, user: dict = Depends(get_current_profile)):
    admin = get_supabase_admin()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        admin.table("utilisateurs").update(updates)\
            .eq("id_utilisateur", user["id_utilisateur"]).execute()
    return {**user, **updates}
