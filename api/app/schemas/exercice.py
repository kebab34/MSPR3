"""
Schémas Pydantic pour les exercices
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class ExerciceBase(BaseModel):
    """Schéma de base pour un exercice"""
    nom: str
    type: Optional[str] = Field(None, pattern="^(cardio|force|flexibilite|equilibre|autre)$")
    groupe_musculaire: Optional[str] = None
    niveau: Optional[str] = Field(None, pattern="^(debutant|intermediaire|avance)$")
    equipement: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    source: str = "ExerciseDB API"


class ExerciceCreate(ExerciceBase):
    """Schéma pour créer un exercice"""
    pass


class ExerciceUpdate(BaseModel):
    """Schéma pour mettre à jour un exercice"""
    nom: Optional[str] = None
    type: Optional[str] = Field(None, pattern="^(cardio|force|flexibilite|equilibre|autre)$")
    groupe_musculaire: Optional[str] = None
    niveau: Optional[str] = Field(None, pattern="^(debutant|intermediaire|avance)$")
    equipement: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    source: Optional[str] = None


class ExerciceRead(ExerciceBase):
    """Schéma pour lire un exercice"""
    id_exercice: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


