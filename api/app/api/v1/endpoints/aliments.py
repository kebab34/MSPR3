"""
Endpoints pour la gestion des aliments
"""

import logging

from fastapi import APIRouter, HTTPException, Query, Depends, Response
from typing import List, Optional
from uuid import UUID
from app.core.postgrest_admin import select_list
from app.core.cache import api_cache

logger = logging.getLogger(__name__)
from app.schemas.aliment import AlimentCreate, AlimentUpdate, AlimentRead
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[AlimentRead])
async def get_aliments(
    response: Response,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    _u: dict = Depends(get_current_user),
):
    """Récupérer la liste des aliments — mise en cache 60 s côté serveur."""
    cache_key = f"aliments:{skip}:{limit}:{search or ''}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        response.headers["X-Cache"] = "HIT"
        response.headers["Cache-Control"] = "private, max-age=60"
        return cached

    try:
        ilike = ("nom", f"%{search}%") if search else None
        data = select_list(
            "aliments",
            "*",
            limit=limit,
            offset=skip,
            order="nom.asc",
            ilike=ilike,
        )
        api_cache.set(cache_key, data, ttl=60)
        response.headers["X-Cache"] = "MISS"
        response.headers["Cache-Control"] = "private, max-age=60"
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Erreur lecture aliments")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")


@router.get("/{aliment_id}", response_model=AlimentRead)
async def get_aliment(aliment_id: UUID, _u: dict = Depends(get_current_user)):
    """Récupérer un aliment par son ID"""
    try:
        result = get_supabase_admin().table("aliments").select("*").eq("id_aliment", str(aliment_id)).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Aliment non trouvé")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")


@router.post("", response_model=AlimentRead, status_code=201)
async def create_aliment(aliment: AlimentCreate, _u: dict = Depends(get_current_user)):
    """Créer un nouvel aliment"""
    try:
        data = aliment.model_dump()
        result = get_supabase_admin().table("aliments").insert(data).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Erreur lors de la création")
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création: {str(e)}")


@router.put("/{aliment_id}", response_model=AlimentRead)
async def update_aliment(
    aliment_id: UUID, aliment: AlimentUpdate, _u: dict = Depends(get_current_user)
):
    """Mettre à jour un aliment"""
    try:
        data = aliment.model_dump(exclude_unset=True)
        
        if not data:
            raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")
        
        result = get_supabase_admin().table("aliments").update(data).eq("id_aliment", str(aliment_id)).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Aliment non trouvé")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour: {str(e)}")


@router.delete("/{aliment_id}", status_code=204)
async def delete_aliment(aliment_id: UUID, _u: dict = Depends(get_current_user)):
    """Supprimer un aliment"""
    try:
        result = get_supabase_admin().table("aliments").delete().eq("id_aliment", str(aliment_id)).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Aliment non trouvé")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")


