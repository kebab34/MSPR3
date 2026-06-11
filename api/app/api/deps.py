"""
Dépendances partagées pour l'injection FastAPI (authentification, etc.)
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_access_token

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict:
    """Valide le token JWT et retourne les données utilisateur."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token d'authentification requis",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict | None:
    """Retourne l'utilisateur si un token valide est fourni, None sinon."""
    if credentials is None:
        return None
    payload = decode_access_token(credentials.credentials)
    return payload
