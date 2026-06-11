"""
Schémas Pydantic pour les sessions sport
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class SessionExerciceCreate(BaseModel):
    """Exercice rattaché à une session (table session_exercices)"""
    id_exercice: UUID
    nombre_series: Optional[int] = Field(None, gt=0)
    nombre_repetitions: Optional[int] = Field(None, gt=0)
    poids: Optional[float] = Field(None, ge=0)
    duree: Optional[int] = Field(None, gt=0)


class SessionSportBase(BaseModel):
    """Schéma de base pour une session sport"""
    id_utilisateur: UUID
    duree: Optional[int] = Field(None, gt=0)
    intensite: Optional[str] = Field(None, pattern="^(faible|moderee|elevee)$")
    date_session: Optional[datetime] = None


class SessionSportCreate(SessionSportBase):
    """Schéma pour créer une session sport avec ses exercices"""
    exercices: List[SessionExerciceCreate] = []


class SessionSportUpdate(BaseModel):
    """Schéma pour mettre à jour une session sport"""
    duree: Optional[int] = Field(None, gt=0)
    intensite: Optional[str] = Field(None, pattern="^(faible|moderee|elevee)$")
    date_session: Optional[datetime] = None


class SessionExerciceRead(BaseModel):
    """Exercice tel que retourné dans une session"""
    id_exercice: UUID
    nombre_series: Optional[int] = None
    nombre_repetitions: Optional[int] = None
    poids: Optional[float] = None
    duree: Optional[int] = None
    exercices: Optional[dict] = None  # contient {"nom": "..."} via la jointure Supabase

    class Config:
        from_attributes = True


class SessionSportRead(SessionSportBase):
    """Schéma pour lire une session sport avec ses exercices"""
    id_session: UUID
    created_at: datetime
    updated_at: datetime
    session_exercices: List[SessionExerciceRead] = []

    class Config:
        from_attributes = True
