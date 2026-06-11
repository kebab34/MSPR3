from fastapi import APIRouter, Depends
from app.api.v1.deps import get_current_profile
from app.core.database import get_supabase_admin

router = APIRouter()


@router.post("/{id_post}/likes")
async def toggle_like(
    id_post: str,
    user: dict = Depends(get_current_profile),
):
    admin = get_supabase_admin()
    id_utilisateur = user["id_utilisateur"]
    existing = admin.table("likes").select("id_like") \
        .eq("id_post", id_post) \
        .eq("id_utilisateur", id_utilisateur).execute()
    if existing.data:
        admin.table("likes").delete().eq("id_like", existing.data[0]["id_like"]).execute()
        return {"liked": False}
    admin.table("likes").insert({
        "id_post": id_post,
        "id_utilisateur": id_utilisateur,
    }).execute()
    return {"liked": True}
