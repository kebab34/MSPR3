"""
Schémas Pydantic pour les mesures biométriques
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class MesureBiometriqueBase(BaseModel):
    """Schéma de base pour une mesure biométrique"""
    id_utilisateur: UUID
    poids: Optional[float] = Field(None, gt=0)
    frequence_cardiaque: Optional[int] = Field(None, gt=0, lt=300)
    sommeil: Optional[float] = Field(None, ge=0)
    calories_brulees: Optional[float] = Field(None, ge=0)


class MesureBiometriqueCreate(MesureBiometriqueBase):
    """Schéma pour créer une mesure biométrique"""
    pass


class MesureBiometriqueUpdate(BaseModel):
    """Schéma pour mettre à jour une mesure biométrique"""
    poids: Optional[float] = Field(None, gt=0)
    frequence_cardiaque: Optional[int] = Field(None, gt=0, lt=300)
    sommeil: Optional[float] = Field(None, ge=0)
    calories_brulees: Optional[float] = Field(None, ge=0)


class MesureBiometriqueRead(MesureBiometriqueBase):
    """Schéma pour lire une mesure biométrique"""
    id_mesure: UUID
    date_mesure: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
