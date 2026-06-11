"""
Schémas Pydantic pour les aliments
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class AlimentBase(BaseModel):
    """Schéma de base pour un aliment"""
    nom: str
    calories: float = Field(..., ge=0)
    proteines: float = Field(0, ge=0)
    glucides: float = Field(0, ge=0)
    lipides: float = Field(0, ge=0)
    fibres: float = Field(0, ge=0)
    unite: str = "100g"
    source: Optional[str] = None


class AlimentCreate(AlimentBase):
    """Schéma pour créer un aliment"""
    pass


class AlimentUpdate(BaseModel):
    """Schéma pour mettre à jour un aliment"""
    nom: Optional[str] = None
    calories: Optional[float] = Field(None, ge=0)
    proteines: Optional[float] = Field(None, ge=0)
    glucides: Optional[float] = Field(None, ge=0)
    lipides: Optional[float] = Field(None, ge=0)
    fibres: Optional[float] = Field(None, ge=0)
    unite: Optional[str] = None
    source: Optional[str] = None


class AlimentRead(AlimentBase):
    """Schéma pour lire un aliment"""
    id_aliment: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


