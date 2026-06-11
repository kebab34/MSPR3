from __future__ import annotations
import json, time, urllib.error, urllib.request
from typing import Any, Optional
from fastapi import HTTPException, status
from jose import JWTError, jwk, jwt
from app.core.config import settings

_jwks_cache: Optional[tuple[float, dict[str, Any]]] = None
JWKS_TTL_SEC = 300

def _invalidate_jwks_cache() -> None:
    global _jwks_cache
    _jwks_cache = None

def _fetch_jwks() -> dict[str, Any]:
    global _jwks_cache
    now = time.time()
    if _jwks_cache is not None and now - _jwks_cache[0] < JWKS_TTL_SEC:
        return _jwks_cache[1]
    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
    try:
        with urllib.request.urlopen(url, timeout=8) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail=f"Impossible de charger les clés JWKS : {e}")
    _jwks_cache = (now, data)
    return data

def verify_token(token: str) -> dict:
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg") or "HS256"
        if alg == "ES256":
            kid = header.get("kid")
            jwks_data = _fetch_jwks()
            raw = next((k for k in jwks_data.get("keys", []) if k.get("kid") == kid), None)
            if not raw:
                _invalidate_jwks_cache()
                raw = next((k for k in _fetch_jwks().get("keys", []) if k.get("kid") == kid), None)
            if not raw:
                raise JWTError(f"Aucune clé JWKS pour kid={kid}")
            pub = jwk.construct(raw)
            return jwt.decode(token, pub, algorithms=["ES256"], options={"verify_aud": False})
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM],
                          options={"verify_aud": False})
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Token invalide ou expiré",
                            headers={"WWW-Authenticate": "Bearer"})
