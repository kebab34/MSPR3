"""
Utilitaires de sécurité : vérification JWT Supabase
(Supabase récent : JWT ES256 + JWKS ; anciens projets / config : HS256 + JWT_SECRET)
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from typing import Any, Optional

from fastapi import HTTPException, status
from jose import JWTError, jwk, jwt

from app.core.config import settings

# Cache JWKS (rotation rare ; invalidé si kid introuvable)
_jwks_cache: Optional[tuple[float, dict[str, Any]]] = None
JWKS_TTL_SEC = 300


def _invalidate_jwks_cache() -> None:
    global _jwks_cache
    _jwks_cache = None


def _jwks_url() -> str:
    return f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"


def _fetch_jwks() -> dict[str, Any]:
    global _jwks_cache
    now = time.time()
    if _jwks_cache is not None and now - _jwks_cache[0] < JWKS_TTL_SEC:
        return _jwks_cache[1]
    try:
        req = urllib.request.Request(_jwks_url(), method="GET")
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode())
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Impossible de charger les clés JWT Supabase (JWKS) : {e}",
        ) from e
    _jwks_cache = (now, data)
    return data


def _decode_es256(token: str) -> dict:
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    if not kid:
        raise JWTError("JWT ES256 sans kid")

    def _try_with(jwks_data: dict[str, Any]) -> Optional[dict]:
        raw = next((k for k in jwks_data.get("keys", []) if k.get("kid") == kid), None)
        if not raw:
            return None
        pub = jwk.construct(raw)
        return jwt.decode(
            token,
            pub,
            algorithms=["ES256"],
            options={"verify_aud": False},
        )

    jwks_data = _fetch_jwks()
    payload = _try_with(jwks_data)
    if payload is None:
        _invalidate_jwks_cache()
        payload = _try_with(_fetch_jwks())
    if payload is None:
        raise JWTError(f"Aucune clé JWKS pour kid={kid}")
    return payload


def verify_token(token: str) -> dict:
    """Vérifie et décode un token JWT Supabase (ES256 via JWKS ou HS256 via JWT_SECRET)."""
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg") or "HS256"
        if alg == "ES256":
            return _decode_es256(token)
        return jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_aud": False},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )
