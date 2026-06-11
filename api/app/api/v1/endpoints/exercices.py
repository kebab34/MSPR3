"""
Endpoints pour la gestion des exercices
"""

from fastapi import APIRouter, HTTPException, Query, Depends, Response
from typing import List, Optional
from uuid import UUID
from app.core.postgrest_admin import select_list
from app.core.cache import api_cache
from app.schemas.exercice import ExerciceCreate, ExerciceUpdate, ExerciceRead
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[ExerciceRead])
async def get_exercices(
    response: Response,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    type: Optional[str] = None,
    groupe_musculaire: Optional[str] = None,
    niveau: Optional[str] = None,
    search: Optional[str] = None,
    _u: dict = Depends(get_current_user),
):
    """Récupérer la liste des exercices — mise en cache 120 s côté serveur."""
    cache_key = f"exercices:{skip}:{limit}:{type or ''}:{groupe_musculaire or ''}:{niveau or ''}:{search or ''}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        response.headers["X-Cache"] = "HIT"
        response.headers["Cache-Control"] = "private, max-age=120"
        return cached

    try:
        eq: dict[str, str] = {}
        if type:
            eq["type"] = type
        if groupe_musculaire:
            eq["groupe_musculaire"] = groupe_musculaire
        if niveau:
            eq["niveau"] = niveau
        ilike = ("nom", f"%{search}%") if search else None
        data = select_list(
            "exercices",
            "*",
            limit=limit,
            offset=skip,
            order="nom.asc",
            eq=eq or None,
            ilike=ilike,
        )
        api_cache.set(cache_key, data, ttl=120)
        response.headers["X-Cache"] = "MISS"
        response.headers["Cache-Control"] = "private, max-age=120"
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")


@router.get("/{exercice_id}", response_model=ExerciceRead)
async def get_exercice(exercice_id: UUID, _u: dict = Depends(get_current_user)):
    """Récupérer un exercice par son ID"""
    try:
        result = get_supabase_admin().table("exercices").select("*").eq("id_exercice", str(exercice_id)).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Exercice non trouvé")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")


@router.post("", response_model=ExerciceRead, status_code=201)
async def create_exercice(exercice: ExerciceCreate, _u: dict = Depends(get_current_user)):
    """Créer un nouvel exercice"""
    try:
        data = exercice.model_dump()
        result = get_supabase_admin().table("exercices").insert(data).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Erreur lors de la création")
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création: {str(e)}")


@router.put("/{exercice_id}", response_model=ExerciceRead)
async def update_exercice(
    exercice_id: UUID, exercice: ExerciceUpdate, _u: dict = Depends(get_current_user)
):
    """Mettre à jour un exercice"""
    try:
        data = exercice.model_dump(exclude_unset=True)
        
        if not data:
            raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")
        
        result = get_supabase_admin().table("exercices").update(data).eq("id_exercice", str(exercice_id)).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Exercice non trouvé")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour: {str(e)}")


@router.delete("/{exercice_id}", status_code=204)
async def delete_exercice(exercice_id: UUID, _u: dict = Depends(get_current_user)):
    """Supprimer un exercice"""
    try:
        result = get_supabase_admin().table("exercices").delete().eq("id_exercice", str(exercice_id)).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Exercice non trouvé")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")


