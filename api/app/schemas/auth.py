"""
Schémas Pydantic pour l'authentification
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal

MoodLiteral = Literal["content", "normal", "triste", "colere"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    nom: Optional[str] = None
    prenom: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserInfo(BaseModel):
    id: str
    email: str
    id_utilisateur: Optional[str] = None
    app_role: str = "user"
    type_abonnement: Optional[str] = "freemium"
    nom: Optional[str] = None
    prenom: Optional[str] = None
    age: Optional[int] = None
    sexe: Optional[str] = None
    poids: Optional[float] = None
    taille: Optional[float] = None
    objectifs: Optional[List[str]] = None
    humeur: Optional[MoodLiteral] = None
    zones_blessure: Optional[List[str]] = None


class ProfileMeUpdate(BaseModel):
    """Mise à jour du profil connecté (sans modifier e-mail, auth_id, rôle app)."""

    nom: Optional[str] = None
    prenom: Optional[str] = None
    age: Optional[int] = Field(None, gt=0, lt=150)
    sexe: Optional[str] = Field(None, pattern="^(M|F|Autre)$")
    poids: Optional[float] = Field(None, gt=0)
    taille: Optional[float] = Field(None, gt=0)
    objectifs: Optional[List[str]] = None
    # Bascule démo : uniquement freemium ↔ premium
    type_abonnement: Optional[Literal["freemium", "premium"]] = None
    humeur: Optional[MoodLiteral] = None
    zones_blessure: Optional[List[str]] = None


class RegisterResponse(BaseModel):
    message: str
    email: str
    access_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: Optional[int] = None
