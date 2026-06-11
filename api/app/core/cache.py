"""
Cache applicatif in-memory avec TTL.
Réduit les appels répétés à Supabase pour les ressources peu changeantes
(aliments, exercices) qui sont lues très fréquemment par le frontend.
"""
from __future__ import annotations

import time
from typing import Any


class TTLCache:
    """Cache dict avec expiration par entrée."""

    def __init__(self, ttl_seconds: int = 60):
        self._store: dict[str, tuple[float, Any]] = {}
        self._ttl = ttl_seconds

    def get(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.monotonic() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        ttl = ttl if ttl is not None else self._ttl
        self._store[key] = (time.monotonic() + ttl, value)

    def invalidate(self, prefix: str) -> None:
        keys = [k for k in self._store if k.startswith(prefix)]
        for k in keys:
            del self._store[k]

    def clear(self) -> None:
        self._store.clear()


# Instance partagée — aliments et exercices cachés 60 s, listes longues 120 s
api_cache = TTLCache(ttl_seconds=60)
