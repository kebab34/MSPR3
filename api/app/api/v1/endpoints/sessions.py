"""
Endpoints pour la gestion des sessions sport
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from uuid import UUID
from datetime import date
from app.core.database import get_supabase_admin
from app.schemas.session import SessionSportCreate, SessionSportUpdate, SessionSportRead
from app.api.v1.deps import get_current_profile

router = APIRouter()


@router.get("", response_model=List[SessionSportRead])
async def get_sessions(
    utilisateur_id: Optional[UUID] = None,
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current: dict = Depends(get_current_profile),
):
    try:
        if current["app_role"] != "admin":
            utilisateur_id = UUID(current["id_utilisateur"])

        query = get_supabase_admin().table("sessions_sport").select(
            "*, session_exercices(id_exercice, nombre_series, nombre_repetitions, poids, duree, exercices(nom))"
        )
        if utilisateur_id:
            query = query.eq("id_utilisateur", str(utilisateur_id))
        if date_debut:
            query = query.gte("date_session", str(date_debut))
        if date_fin:
            query = query.lte("date_session", str(date_fin))

        result = query.range(skip, skip + limit - 1).order("date_session", desc=True).execute()
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")


@router.get("/{session_id}", response_model=SessionSportRead)
async def get_session(session_id: UUID, current: dict = Depends(get_current_profile)):
    try:
        result = get_supabase_admin().table("sessions_sport").select(
            "*, session_exercices(id_exercice, nombre_series, nombre_repetitions, poids, duree, exercices(nom))"
        ).eq("id_session", str(session_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        row = result.data[0]
        if current["app_role"] != "admin" and str(row["id_utilisateur"]) != current["id_utilisateur"]:
            raise HTTPException(status_code=403, detail="Accès refusé")
        return row
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")


@router.post("", response_model=SessionSportRead, status_code=201)
async def create_session(session: SessionSportCreate, current: dict = Depends(get_current_profile)):
    try:
        exercices = session.exercices if hasattr(session, "exercices") else []
        session_data = session.model_dump(mode="json", exclude={"exercices"})
        if current["app_role"] != "admin":
            session_data["id_utilisateur"] = current["id_utilisateur"]

        result = get_supabase_admin().table("sessions_sport").insert(session_data).execute()
        if not result.data:
            raise HTTPException(status_code=400, detail="Erreur lors de la création de la session")

        session_id = result.data[0]["id_session"]
        if exercices:
            for exercice in exercices:
                exercice_data = exercice.model_dump(mode="json")
                exercice_data["id_session"] = session_id
                get_supabase_admin().table("session_exercices").insert(exercice_data).execute()

        result = get_supabase_admin().table("sessions_sport").select(
            "*, session_exercices(id_exercice, nombre_series, nombre_repetitions, poids, duree, exercices(nom))"
        ).eq("id_session", session_id).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création: {str(e)}")


@router.put("/{session_id}", response_model=SessionSportRead)
async def update_session(session_id: UUID, session: SessionSportUpdate, current: dict = Depends(get_current_profile)):
    try:
        existing = get_supabase_admin().table("sessions_sport").select("id_utilisateur").eq("id_session", str(session_id)).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        if current["app_role"] != "admin" and str(existing.data[0]["id_utilisateur"]) != current["id_utilisateur"]:
            raise HTTPException(status_code=403, detail="Accès refusé")

        data = session.model_dump(mode="json", exclude_unset=True)
        if not data:
            raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")

        result = get_supabase_admin().table("sessions_sport").update(data).eq("id_session", str(session_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour: {str(e)}")


@router.delete("/{session_id}", status_code=204)
async def delete_session(session_id: UUID, current: dict = Depends(get_current_profile)):
    try:
        existing = get_supabase_admin().table("sessions_sport").select("id_utilisateur").eq("id_session", str(session_id)).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        if current["app_role"] != "admin" and str(existing.data[0]["id_utilisateur"]) != current["id_utilisateur"]:
            raise HTTPException(status_code=403, detail="Accès refusé")

        get_supabase_admin().table("sessions_sport").delete().eq("id_session", str(session_id)).execute()
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")
