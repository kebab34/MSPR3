"""
Endpoints pour la gestion du journal alimentaire
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from uuid import UUID
from datetime import date
from app.core.database import get_supabase_admin
from app.schemas.journal import JournalAlimentaireCreate, JournalAlimentaireUpdate, JournalAlimentaireRead
from app.api.v1.deps import get_current_profile

router = APIRouter()


@router.get("", response_model=List[JournalAlimentaireRead])
async def get_journal_entries(
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

        query = get_supabase_admin().table("journal_alimentaire").select("*")
        if utilisateur_id:
            query = query.eq("id_utilisateur", str(utilisateur_id))
        if date_debut:
            query = query.gte("date_consommation", str(date_debut))
        if date_fin:
            query = query.lte("date_consommation", str(date_fin))

        result = query.range(skip, skip + limit - 1).order("date_consommation", desc=True).execute()
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")


@router.get("/{journal_id}", response_model=JournalAlimentaireRead)
async def get_journal_entry(journal_id: UUID, current: dict = Depends(get_current_profile)):
    try:
        result = get_supabase_admin().table("journal_alimentaire").select("*").eq("id_journal", str(journal_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Entrée du journal non trouvée")
        row = result.data[0]
        if current["app_role"] != "admin" and str(row["id_utilisateur"]) != current["id_utilisateur"]:
            raise HTTPException(status_code=403, detail="Accès refusé")
        return row
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")


@router.post("", response_model=JournalAlimentaireRead, status_code=201)
async def create_journal_entry(entry: JournalAlimentaireCreate, current: dict = Depends(get_current_profile)):
    try:
        data = entry.model_dump(mode="json")
        if current["app_role"] != "admin":
            data["id_utilisateur"] = current["id_utilisateur"]
        result = get_supabase_admin().table("journal_alimentaire").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=400, detail="Erreur lors de la création")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création: {str(e)}")


@router.put("/{journal_id}", response_model=JournalAlimentaireRead)
async def update_journal_entry(journal_id: UUID, entry: JournalAlimentaireUpdate, current: dict = Depends(get_current_profile)):
    try:
        existing = get_supabase_admin().table("journal_alimentaire").select("id_utilisateur").eq("id_journal", str(journal_id)).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Entrée du journal non trouvée")
        if current["app_role"] != "admin" and str(existing.data[0]["id_utilisateur"]) != current["id_utilisateur"]:
            raise HTTPException(status_code=403, detail="Accès refusé")

        data = entry.model_dump(mode="json", exclude_unset=True)
        if not data:
            raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")

        result = get_supabase_admin().table("journal_alimentaire").update(data).eq("id_journal", str(journal_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Entrée du journal non trouvée")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour: {str(e)}")


@router.delete("/{journal_id}", status_code=204)
async def delete_journal_entry(journal_id: UUID, current: dict = Depends(get_current_profile)):
    try:
        existing = get_supabase_admin().table("journal_alimentaire").select("id_utilisateur").eq("id_journal", str(journal_id)).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Entrée du journal non trouvée")
        if current["app_role"] != "admin" and str(existing.data[0]["id_utilisateur"]) != current["id_utilisateur"]:
            raise HTTPException(status_code=403, detail="Accès refusé")

        get_supabase_admin().table("journal_alimentaire").delete().eq("id_journal", str(journal_id)).execute()
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")
