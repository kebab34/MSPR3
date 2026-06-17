import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from app.api.v1.deps import get_current_profile
from app.core.database import get_supabase_admin

router = APIRouter()


@router.get("/feed")
async def get_feed_stories(user: dict = Depends(get_current_profile)):
    admin = get_supabase_admin()
    follows_res = admin.table("follows").select("id_following") \
        .eq("id_follower", user["id_utilisateur"]).execute()
    ids = [f["id_following"] for f in (follows_res.data or [])]
    ids.append(user["id_utilisateur"])

    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    res = admin.table("stories") \
        .select("*, utilisateurs(id_utilisateur, nom, prenom, email, avatar_url)") \
        .in_("id_utilisateur", ids) \
        .gte("created_at", cutoff) \
        .order("created_at").execute()

    groups: dict = {}
    for story in (res.data or []):
        uid = story["id_utilisateur"]
        if uid not in groups:
            groups[uid] = {
                "user": story["utilisateurs"],
                "stories": [],
                "is_own": uid == user["id_utilisateur"],
            }
        groups[uid]["stories"].append(story)

    return sorted(groups.values(), key=lambda g: (not g["is_own"], g["stories"][0]["created_at"]))


@router.get("/archive")
async def get_archive_stories(user: dict = Depends(get_current_profile)):
    admin = get_supabase_admin()
    res = admin.table("stories") \
        .select("*") \
        .eq("id_utilisateur", user["id_utilisateur"]) \
        .order("created_at", desc=True).execute()
    return res.data or []


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_story(file: UploadFile = File(...), user: dict = Depends(get_current_profile)):
    admin = get_supabase_admin()
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    filename = f"stories/{uuid.uuid4()}.{ext}"
    content = await file.read()
    admin.storage.from_("media").upload(filename, content, {
        "content-type": file.content_type or "image/jpeg",
    })
    media_url = f"{admin.supabase_url}/storage/v1/object/public/media/{filename}"
    res = admin.table("stories").insert({
        "id_utilisateur": user["id_utilisateur"],
        "media_url": media_url,
    }).execute()
    return res.data[0]


@router.delete("/{id_story}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_story(id_story: str, user: dict = Depends(get_current_profile)):
    admin = get_supabase_admin()
    res = admin.table("stories").select("id_story, id_utilisateur") \
        .eq("id_story", id_story).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Story introuvable")
    if res.data[0]["id_utilisateur"] != user["id_utilisateur"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    admin.table("stories").delete().eq("id_story", id_story).execute()
