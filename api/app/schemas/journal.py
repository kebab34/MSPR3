"""
Schémas Pydantic pour le journal alimentaire
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class JournalAlimentaireBase(BaseModel):
    """Schéma de base pour une entrée du journal alimentaire"""
    id_utilisateur: UUID
    id_aliment: UUID
    quantite: float = Field(..., gt=0)
    date_consommation: Optional[datetime] = None


class JournalAlimentaireCreate(JournalAlimentaireBase):
    """Schéma pour créer une entrée du journal"""
    pass


class JournalAlimentaireUpdate(BaseModel):
    """Schéma pour mettre à jour une entrée du journal"""
    quantite: Optional[float] = Field(None, gt=0)
    date_consommation: Optional[datetime] = None


class JournalAlimentaireRead(JournalAlimentaireBase):
    """Schéma pour lire une entrée du journal"""
    id_journal: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
