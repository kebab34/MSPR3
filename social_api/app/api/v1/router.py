from fastapi import APIRouter
from app.api.v1.endpoints import health, posts, likes, commentaires, me, users

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(me.router, prefix="/auth/me", tags=["me"])
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])
api_router.include_router(likes.router, prefix="/posts", tags=["likes"])
api_router.include_router(commentaires.router, prefix="/posts", tags=["commentaires"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
