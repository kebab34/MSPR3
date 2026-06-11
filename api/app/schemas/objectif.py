"""
Schémas Pydantic pour les objectifs
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID


class ObjectifBase(BaseModel):
    """Schéma de base pour un objectif"""
    id_utilisateur: UUID
    type_objectif: str = Field(..., pattern="^(perte_poids|prise_masse|sommeil|endurance|force|autre)$")
    valeur_cible: Optional[float] = None
    valeur_actuelle: Optional[float] = None
    date_debut: date
    date_fin: Optional[date] = None
    statut: str = Field("actif", pattern="^(actif|atteint|abandonne)$")


class ObjectifCreate(ObjectifBase):
    """Schéma pour créer un objectif"""
    pass


class ObjectifUpdate(BaseModel):
    """Schéma pour mettre à jour un objectif"""
    type_objectif: Optional[str] = Field(None, pattern="^(perte_poids|prise_masse|sommeil|endurance|force|autre)$")
    valeur_cible: Optional[float] = None
    valeur_actuelle: Optional[float] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    statut: Optional[str] = Field(None, pattern="^(actif|atteint|abandonne)$")


class ObjectifRead(ObjectifBase):
    """Schéma pour lire un objectif"""
    id_objectif: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


