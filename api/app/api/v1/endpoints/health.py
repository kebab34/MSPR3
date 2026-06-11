"""
Endpoint de santé pour l'API
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("")
async def health():
    """Vérification de santé de l'API v1"""
    return {"status": "ok", "version": "v1"}


