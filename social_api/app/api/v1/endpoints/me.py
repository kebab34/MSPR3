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
    return {
        "id_utilisateur": user["id_utilisateur"],
        "email": user["email"],
        "nom": user.get("nom"),
        "prenom": user.get("prenom"),
    }

@router.patch("")
async def update_me(body: ProfileUpdate, user: dict = Depends(get_current_profile)):
    admin = get_supabase_admin()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        admin.table("utilisateurs").update(updates)\
            .eq("id_utilisateur", user["id_utilisateur"]).execute()
    return {**user, **updates}
