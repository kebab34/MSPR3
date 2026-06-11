"""
Router principal pour l'API v1
"""

from fastapi import APIRouter
from app.api.v1.endpoints import health, utilisateurs, aliments, exercices, journal, sessions, mesures, auth

api_router = APIRouter()

# Auth (public)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Ressources
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(utilisateurs.router, prefix="/utilisateurs", tags=["utilisateurs"])
api_router.include_router(aliments.router, prefix="/aliments", tags=["aliments"])
api_router.include_router(exercices.router, prefix="/exercices", tags=["exercices"])
api_router.include_router(journal.router, prefix="/journal", tags=["journal"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(mesures.router, prefix="/mesures", tags=["mesures"])


