import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from app.api.v1.deps import get_current_profile
from app.core.database import get_supabase_admin

router = APIRouter()

@router.get("")
async def list_posts(
    limit: int = 20,
    offset: int = 0,
    user: dict = Depends(get_current_profile),
):
    admin = get_supabase_admin()
    res = admin.table("posts") \
        .select("*, utilisateurs(nom, prenom, email), likes(count), commentaires(count)") \
        .order("created_at", desc=True) \
        .range(offset, offset + limit - 1) \
        .execute()
    posts = res.data or []
    for post in posts:
        like_res = admin.table("likes").select("id_like") \
            .eq("id_post", post["id_post"]) \
            .eq("id_utilisateur", user["id_utilisateur"]).execute()
        post["liked_by_me"] = len(like_res.data) > 0
        post["likes_count"] = post.get("likes", [{}])[0].get("count", 0) if post.get("likes") else 0
        post["comments_count"] = post.get("commentaires", [{}])[0].get("count", 0) if post.get("commentaires") else 0
    return posts


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_post(
    contenu: str = Form(...),
    file: Optional[UploadFile] = File(None),
    user: dict = Depends(get_current_profile),
):
    admin = get_supabase_admin()
    media_url = None
    media_type = None
    if file:
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        media_type = "video" if ext in ("mp4", "mov", "avi", "webm") else "image"
        filename = f"{uuid.uuid4()}.{ext}"
        content = await file.read()
        admin.storage.from_("media").upload(filename, content,
                                            {"content-type": file.content_type})
        media_url = f"{admin.supabase_url}/storage/v1/object/public/media/{filename}"
    res = admin.table("posts").insert({
        "id_utilisateur": user["id_utilisateur"],
        "contenu": contenu,
        "media_url": media_url,
        "media_type": media_type,
    }).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Erreur création du post")
    return res.data[0]


@router.delete("/{id_post}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    id_post: str,
    user: dict = Depends(get_current_profile),
):
    admin = get_supabase_admin()
    res = admin.table("posts").select("id_post, id_utilisateur") \
        .eq("id_post", id_post).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Post introuvable")
    if res.data[0]["id_utilisateur"] != user["id_utilisateur"]:
        raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres posts")
    admin.table("posts").delete().eq("id_post", id_post).execute()
