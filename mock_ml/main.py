from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(title="HealthAI Mock ML Service", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MOCK_RECOMMENDATIONS = [
    "Consommez 2L d'eau par jour",
    "Privilégiez les protéines maigres (poulet, poisson, légumineuses)",
    "Limitez les sucres rapides et les aliments ultra-transformés",
    "30 minutes d'activité physique modérée par jour",
    "Incluez des légumes variés à chaque repas",
]

MOCK_WEEKLY_PLAN = {
    "lundi":    {"nutrition": "Salade de quinoa + poulet grillé", "sport": "Course 30min"},
    "mardi":    {"nutrition": "Soupe de légumes + pain complet",  "sport": "Repos actif"},
    "mercredi": {"nutrition": "Saumon + légumes vapeur",          "sport": "Natation 45min"},
    "jeudi":    {"nutrition": "Omelette + salade verte",          "sport": "Vélo 40min"},
    "vendredi": {"nutrition": "Riz complet + légumineuses",       "sport": "Musculation 45min"},
    "samedi":   {"nutrition": "Smoothie protéiné + fruits",       "sport": "Yoga 60min"},
    "dimanche": {"nutrition": "Repas libre équilibré",            "sport": "Repos"},
}


@app.get("/health")
def health():
    return {"status": "healthy", "mode": "offline-mock"}


@app.get("/model/info")
def model_info():
    return {
        "model_type": "mock",
        "mode": "offline",
        "version": "1.0.0",
        "status": "ready",
    }


@app.post("/recommend")
def recommend(data: dict = {}):
    return {
        "recommendations": MOCK_RECOMMENDATIONS,
        "explanation": "Mode hors-ligne : recommandations génériques basées sur les bonnes pratiques nutritionnelles.",
        "confidence": 0.75,
        "mode": "offline-mock",
    }


@app.post("/train")
def train(data: dict = {}):
    return {"status": "skipped", "message": "Entraînement désactivé en mode hors-ligne."}


@app.get("/recommendations/logs")
def logs():
    return []


@app.post("/weekly-plan")
def weekly_plan(data: dict = {}):
    return {
        "plan": MOCK_WEEKLY_PLAN,
        "explanation": "Plan hebdomadaire standard. Mode hors-ligne actif.",
        "mode": "offline-mock",
    }


@app.post("/analyze-meal")
def analyze_meal(data: dict = {}):
    return {
        "analysis": "Analyse indisponible en mode hors-ligne.",
        "nutritional_balance": {"proteins": "modéré", "carbs": "modéré", "fats": "modéré"},
        "mode": "offline-mock",
    }


Instrumentator().instrument(app).expose(app)
