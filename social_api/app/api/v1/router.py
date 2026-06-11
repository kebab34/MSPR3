from fastapi import APIRouter
from app.api.v1.endpoints import health, posts, likes, commentaires

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])
api_router.include_router(likes.router, prefix="/posts", tags=["likes"])
api_router.include_router(commentaires.router, prefix="/posts", tags=["commentaires"])
