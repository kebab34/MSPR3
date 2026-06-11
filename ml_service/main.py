import os
from fastapi import FastAPI, HTTPException, Header, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from model import ModelService
from schemas import (
    RecommendationRequest,
    RecommendationResponse,
    ModelInfo,
    TrainResponse,
    RecommendationLog,
    WeeklyPlanRequest,
    WeeklyPlanResponse,
)
from db import log_recommendation, get_logs
from hf_client import generate_explanation, generate_weekly_explanation
from planner import build_weekly_plan
from diet_rules import resolve_diet_plan
from vision_client import identify_food
from nutrition_db import get_nutrition, analyze_balance
from prometheus_fastapi_instrumentator import Instrumentator


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="MSPR IA Recommandations",
    version="1.0.0",
    description="Microservice IA coach sportif : recommandations nutrition et programmes hebdomadaires.",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model_service = ModelService()

ML_TRAIN_TOKEN = os.getenv("ML_TRAIN_TOKEN", "")


class TrainRequest(BaseModel):
    dataset_path: Optional[str] = None


@app.on_event("startup")
async def startup_event() -> None:
    if model_service.model is None and model_service.dataset_path:
        try:
            model_service.train(model_service.dataset_path)
        except Exception:
            pass


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "ml_service"}


@app.get("/model/info", response_model=ModelInfo)
async def get_model_info() -> ModelInfo:
    return ModelInfo(**model_service.model_info())


@app.post("/recommend", response_model=RecommendationResponse)
@limiter.limit("30/minute")
async def recommend(request: Request, body: RecommendationRequest, authorization: Optional[str] = Header(None)) -> RecommendationResponse:
    try:
        result = model_service.predict(body.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    explanation = generate_explanation(body.model_dump(), result["recommended_plan"])

    response = RecommendationResponse(
        recommended_plan=result["recommended_plan"],
        confidence=round(result["confidence"], 4),
        explanation=explanation,
    )

    log_recommendation(body.model_dump(), response.model_dump(), user_email=None)
    return response


@app.post("/train", response_model=TrainResponse)
async def train(request: TrainRequest, authorization: Optional[str] = Header(None)) -> TrainResponse:
    if ML_TRAIN_TOKEN and authorization != f"Bearer {ML_TRAIN_TOKEN}":
        raise HTTPException(status_code=401, detail="Token d'entraînement invalide")

    info = model_service.train(request.dataset_path)
    return TrainResponse(message="Modèle entraîné avec succès", model_path=info["model_path"], trained=True)


@app.get("/recommendations/logs")
async def recommendation_logs() -> list[RecommendationLog]:
    logs = get_logs()
    return [RecommendationLog(**log) for log in logs]


@app.post("/weekly-plan", response_model=WeeklyPlanResponse)
@limiter.limit("20/minute")
async def weekly_plan(request: Request, body: WeeklyPlanRequest) -> WeeklyPlanResponse:
    """Programme hebdomadaire : plan nutrition + répartition entraînements/repas selon profil sportif."""
    payload = body.model_dump(by_alias=True)
    ml_payload = {k: payload[k] for k in RecommendationRequest.model_fields if k in payload}

    try:
        diet = model_service.predict(ml_payload)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    final_plan, final_conf, _override = resolve_diet_plan(
        diet["recommended_plan"],
        diet["confidence"],
        payload.get("objectifs") or [],
        payload.get("disease_type") or "None",
    )

    plan = build_weekly_plan(payload, final_plan)
    explanation = generate_weekly_explanation(payload, plan)

    response = WeeklyPlanResponse(
        recommended_plan=final_plan,
        confidence=round(final_conf, 4),
        explanation=explanation,
        objectifs=plan["objectifs"],
        zones_blessure=plan["zones_blessure"],
        injury_labels=plan["injury_labels"],
        humeur=plan.get("humeur"),
        exercices_exclus_blessure=plan["exercices_exclus_blessure"],
        conseils=plan["conseils"],
        jours=plan["jours"],
    )

    log_recommendation(
        {**payload, "type": "weekly_plan"},
        response.model_dump(),
        user_email=None,
    )
    return response


@app.post("/analyze-meal")
@limiter.limit("20/minute")
async def analyze_meal(
    request: Request,
    file: UploadFile = File(..., description="Photo du repas (JPEG/PNG)"),
    objectif: str = Form("equilibre", description="equilibre | perte_de_poids | prise_de_masse | performance_sportive"),
) -> dict:
    """
    Analyse une photo de repas via HuggingFace Vision (nateraw/food — Food101).
    Identifie les aliments, calcule les apports nutritionnels et génère
    des recommandations via LLM selon l'objectif santé.
    """
    if file.content_type not in ("image/jpeg", "image/jpg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Format non supporté. Utilisez JPEG ou PNG.")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image trop volumineuse (max 10 Mo).")

    identified = identify_food(image_bytes)
    top_food = identified[0] if identified else {"label": "unknown", "label_fr": "Inconnu", "score": 0}

    nutrition = get_nutrition(top_food["label"])
    alerts = analyze_balance(nutrition, objectif)
    suggestions = _generate_meal_suggestions(top_food["label_fr"], nutrition, objectif, alerts)

    return {
        "aliments_identifies": identified,
        "aliment_principal": top_food["label_fr"],
        "confiance": top_food["score"],
        "nutrition": {**nutrition, "unite": "par portion (~150-200g)"},
        "desequilibres": alerts,
        "objectif": objectif,
        "suggestions": suggestions,
    }


def _generate_meal_suggestions(food_fr: str, nutrition: dict, objectif: str, alerts: dict) -> str:
    objectif_labels = {
        "equilibre": "alimentation équilibrée",
        "perte_de_poids": "perte de poids",
        "prise_de_masse": "prise de masse musculaire",
        "performance_sportive": "performance sportive",
    }
    obj_fr = objectif_labels.get(objectif, objectif)
    problems = " | ".join(alerts.values()) if alerts else "aucun déséquilibre majeur"

    prompt = (
        f"Tu es un coach nutrition. Un sportif avec un objectif {obj_fr} vient de manger : {food_fr}. "
        f"Apports : {nutrition['calories']} kcal, {nutrition['proteines']}g protéines, "
        f"{nutrition['glucides']}g glucides, {nutrition['lipides']}g lipides, {nutrition['fibres']}g fibres. "
        f"Points d'attention : {problems}. "
        f"En 2-3 phrases, donne des conseils concrets pour améliorer ce repas."
    )

    from hf_client import HF_API_TOKEN, HF_MODEL
    import requests as req

    if not HF_API_TOKEN:
        return f"Pour un objectif {obj_fr}, complétez ce repas avec des légumes et des protéines maigres."

    try:
        url = f"https://router.huggingface.co/hf-inference/models/{HF_MODEL}/v1/chat/completions"
        r = req.post(
            url,
            headers={"Authorization": f"Bearer {HF_API_TOKEN}", "Content-Type": "application/json"},
            json={"model": HF_MODEL, "messages": [{"role": "user", "content": prompt}], "max_tokens": 150, "temperature": 0.6},
            timeout=20,
        )
        if r.status_code == 200:
            choices = r.json().get("choices", [])
            if choices:
                text = choices[0].get("message", {}).get("content", "").strip()
                if text and len(text) > 20:
                    return text
    except Exception:
        pass

    return f"Pour un objectif {obj_fr}, complétez ce repas avec des légumes frais et des protéines maigres."

Instrumentator().instrument(app).expose(app)
