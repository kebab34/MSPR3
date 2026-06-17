from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.api.v1.deps import get_current_profile
from app.core.database import get_supabase_admin

router = APIRouter()


class CommentaireCreate(BaseModel):
    contenu: str


@router.get("/{id_post}/commentaires")
async def list_commentaires(
    id_post: str,
    user: dict = Depends(get_current_profile),
):
    admin = get_supabase_admin()
    res = admin.table("commentaires") \
        .select("*, utilisateurs(nom, prenom, email, avatar_url)") \
        .eq("id_post", id_post) \
        .order("created_at") \
        .execute()
    return res.data or []


@router.post("/{id_post}/commentaires", status_code=status.HTTP_201_CREATED)
async def create_commentaire(
    id_post: str,
    body: CommentaireCreate,
    user: dict = Depends(get_current_profile),
):
    admin = get_supabase_admin()
    res = admin.table("commentaires").insert({
        "id_post": id_post,
        "id_utilisateur": user["id_utilisateur"],
        "contenu": body.contenu,
    }).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Erreur création commentaire")
    return res.data[0]


@router.delete("/commentaires/{id_commentaire}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_commentaire(
    id_commentaire: str,
    user: dict = Depends(get_current_profile),
):
    admin = get_supabase_admin()
    res = admin.table("commentaires").select("id_commentaire, id_utilisateur") \
        .eq("id_commentaire", id_commentaire).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Commentaire introuvable")
    if res.data[0]["id_utilisateur"] != user["id_utilisateur"]:
        raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres commentaires")
    admin.table("commentaires").delete().eq("id_commentaire", id_commentaire).execute()
