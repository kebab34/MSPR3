"""
Application FastAPI principale pour le projet MSPR
Domaine : Santé connectée et coaching personnalisé
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.database import init_supabase
from app.core.rate_limit import limiter
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Après le fork du worker uvicorn (--reload) : évite un client HTTP Supabase corrompu
    init_supabase()
    yield


app = FastAPI(
    title="MSPR API - Santé Connectée",
    description="API pour la gestion de la santé connectée et du coaching personnalisé",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes API
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/")
async def root():
    """Point d'entrée de l'API"""
    return {
        "message": "Bienvenue sur l'API MSPR - Santé Connectée",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Vérification de santé de l'API"""
    return {"status": "healthy"}


