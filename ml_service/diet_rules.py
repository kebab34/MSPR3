"""
Règles métier : aligner le régime recommandé sur les objectifs utilisateur
lorsque le classifieur ML (entraîné sur pathologies Kaggle) est peu fiable.
"""
from __future__ import annotations


def _norm_objectifs(objectifs: list[str]) -> str:
    return " ".join((o or "").lower() for o in objectifs)


def resolve_diet_plan(
    ml_plan: str,
    confidence: float,
    objectifs: list[str],
    disease_type: str = "None",
) -> tuple[str, float, str | None]:
    """
    Retourne (plan, confiance, raison_override).
    raison_override est None si le plan ML est conservé.
    """
    objs = _norm_objectifs(objectifs)
    disease = (disease_type or "None").strip()

    if disease not in ("None", "", "Aucune"):
        return ml_plan, confidence, None

    if "perte" in objs:
        if ml_plan != "Balanced" or confidence < 0.7:
            return "Balanced", max(confidence, 0.75), "objectif_perte_poids"
        return ml_plan, confidence, None

    if "musculation" in objs or "prise" in objs:
        if ml_plan == "Low_Sodium":
            return "Low_Carb", max(confidence, 0.7), "objectif_musculation"
        return ml_plan, confidence, None

    if confidence < 0.55:
        return "Balanced", 0.65, "faible_confiance_ml"

    return ml_plan, confidence, None
