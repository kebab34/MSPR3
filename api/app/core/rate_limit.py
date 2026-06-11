"""
Configuration du rate limiting via slowapi.

Limites appliquées :
  - Endpoints d'authentification (login, register) : 10 req/minute
  - Endpoints de lecture (GET) : 60 req/minute
  - Endpoints d'écriture (POST/PUT/DELETE) : 30 req/minute
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
