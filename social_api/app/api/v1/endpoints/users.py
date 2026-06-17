from fastapi import APIRouter, Depends, HTTPException, status
from app.api.v1.deps import get_current_profile
from app.core.database import get_supabase_admin

router = APIRouter()


@router.get("/{id_utilisateur}")
async def get_user_profile(id_utilisateur: str, user: dict = Depends(get_current_profile)):
    admin = get_supabase_admin()
    res = admin.table("utilisateurs").select("id_utilisateur, nom, prenom, email") \
        .eq("id_utilisateur", id_utilisateur).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    profile = res.data[0]

    followers_res = admin.table("follows").select("id_follow", count="exact") \
        .eq("id_following", id_utilisateur).execute()
    following_res = admin.table("follows").select("id_follow", count="exact") \
        .eq("id_follower", id_utilisateur).execute()
    is_following_res = admin.table("follows").select("id_follow") \
        .eq("id_follower", user["id_utilisateur"]) \
        .eq("id_following", id_utilisateur).execute()

    posts_res = admin.table("posts") \
        .select("*, likes(count), commentaires(count)") \
        .eq("id_utilisateur", id_utilisateur) \
        .order("created_at", desc=True).execute()
    posts = posts_res.data or []
    for post in posts:
        like_res = admin.table("likes").select("id_like") \
            .eq("id_post", post["id_post"]) \
            .eq("id_utilisateur", user["id_utilisateur"]).execute()
        post["liked_by_me"] = len(like_res.data) > 0
        post["likes_count"] = post.get("likes", [{}])[0].get("count", 0) if post.get("likes") else 0
        post["comments_count"] = post.get("commentaires", [{}])[0].get("count", 0) if post.get("commentaires") else 0

    return {
        **profile,
        "posts": posts,
        "posts_count": len(posts),
        "followers_count": followers_res.count or 0,
        "following_count": following_res.count or 0,
        "is_following": len(is_following_res.data) > 0,
    }


@router.post("/{id_utilisateur}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def follow_user(id_utilisateur: str, user: dict = Depends(get_current_profile)):
    if id_utilisateur == user["id_utilisateur"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous suivre vous-même")
    admin = get_supabase_admin()
    existing = admin.table("follows").select("id_follow") \
        .eq("id_follower", user["id_utilisateur"]) \
        .eq("id_following", id_utilisateur).execute()
    if not existing.data:
        admin.table("follows").insert({
            "id_follower": user["id_utilisateur"],
            "id_following": id_utilisateur,
        }).execute()


@router.delete("/{id_utilisateur}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_user(id_utilisateur: str, user: dict = Depends(get_current_profile)):
    admin = get_supabase_admin()
    admin.table("follows").delete() \
        .eq("id_follower", user["id_utilisateur"]) \
        .eq("id_following", id_utilisateur).execute()
