from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(
    title="HealthAI Social API",
    description="Mini réseau social — posts, likes, commentaires",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"service": "social_api", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


Instrumentator().instrument(app).expose(app)
