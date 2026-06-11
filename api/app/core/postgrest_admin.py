"""
Accès PostgREST (service_role) via HTTP — contourne le client supabase-py
qui renvoie des listes vides sous uvicorn dans certains environnements Docker.
"""

from __future__ import annotations

import os
from typing import Any, Optional

import httpx

_TIMEOUT = 15.0


def _base() -> str:
    return os.environ.get("SUPABASE_URL", "").rstrip("/")


def _key() -> str:
    return os.environ.get("SUPABASE_SERVICE_KEY", "").strip()


def _headers() -> dict[str, str]:
    k = _key()
    return {
        "apikey": k,
        "Authorization": f"Bearer {k}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def select_rows(
    table: str,
    columns: str,
    filters: dict[str, str],
    *,
    limit: Optional[int] = None,
    order: Optional[str] = None,
) -> list[dict[str, Any]]:
    params: dict[str, str] = {"select": columns}
    for col, val in filters.items():
        params[col] = f"eq.{val}"
    if limit is not None:
        params["limit"] = str(limit)
    if order:
        params["order"] = order

    url = f"{_base()}/rest/v1/{table}"
    with httpx.Client(timeout=_TIMEOUT) as client:
        r = client.get(url, headers=_headers(), params=params)
        r.raise_for_status()
        data = r.json()
        return data if isinstance(data, list) else []


def update_rows(
    table: str,
    filters: dict[str, str],
    payload: dict[str, Any],
) -> list[dict[str, Any]]:
    params = {col: f"eq.{val}" for col, val in filters.items()}
    url = f"{_base()}/rest/v1/{table}"
    with httpx.Client(timeout=_TIMEOUT) as client:
        r = client.patch(url, headers=_headers(), params=params, json=payload)
        r.raise_for_status()
        if not r.content:
            return []
        data = r.json()
        return data if isinstance(data, list) else [data]


def select_list(
    table: str,
    columns: str = "*",
    *,
    limit: int = 100,
    offset: int = 0,
    order: Optional[str] = None,
    eq: Optional[dict[str, str]] = None,
    ilike: Optional[tuple[str, str]] = None,
) -> list[dict[str, Any]]:
    params: dict[str, str] = {"select": columns, "limit": str(limit), "offset": str(offset)}
    if order:
        params["order"] = order
    if eq:
        for col, val in eq.items():
            params[col] = f"eq.{val}"
    if ilike:
        col, pattern = ilike
        params[col] = f"ilike.{pattern}"

    url = f"{_base()}/rest/v1/{table}"
    with httpx.Client(timeout=_TIMEOUT) as client:
        r = client.get(url, headers=_headers(), params=params)
        r.raise_for_status()
        data = r.json()
        return data if isinstance(data, list) else []


def insert_row(table: str, payload: dict[str, Any]) -> list[dict[str, Any]]:
    url = f"{_base()}/rest/v1/{table}"
    with httpx.Client(timeout=_TIMEOUT) as client:
        r = client.post(url, headers=_headers(), json=payload)
        r.raise_for_status()
        data = r.json()
        return data if isinstance(data, list) else [data]
