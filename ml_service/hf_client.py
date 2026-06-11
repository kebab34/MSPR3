"""
Client Hugging Face Inference API (router).
Génère des explications en ton coach sportif / nutrition sportive.

URL  : https://router.huggingface.co/hf-inference/models/{model}/v1/chat/completions
Format : OpenAI-compatible chat completions
Modèle : katanemo/Arch-Router-1.5B (gratuit, multilingue)
Fallback : explication template si l'API est indisponible ou le token absent.
"""
from __future__ import annotations

import os
import requests

HF_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "")
HF_MODEL = os.getenv("HUGGINGFACE_MODEL", "katanemo/Arch-Router-1.5B")
HF_API_URL = f"https://router.huggingface.co/hf-inference/models/{HF_MODEL}/v1/chat/completions"
HF_TIMEOUT = int(os.getenv("HUGGINGFACE_TIMEOUT", "20"))

# Libellés orientés coaching (pas vocabulaire médical)
PLAN_LABELS = {
    "Balanced": "alimentation équilibrée",
    "Low_Carb": "moins de glucides, plus de protéines",
    "Low_Sodium": "faible en sel",
}

GENDER_FR = {
    "Male": "homme",
    "Female": "femme",
    "Other": "non précisé",
}

COACH_SYSTEM = (
    "Tu es un coach sportif et nutrition sportive. "
    "Tu parles comme un entraîneur bienveillant : motivant, concret, orienté performance et bien-être. "
    "Tu ne fais PAS de diagnostic médical, tu ne cites pas de pathologies ni de symptômes. "
    "Tu parles d'entraînement, de récupération, d'énergie, de progression et d'alimentation adaptée au sport."
)


def _gender_label(gender: str | None) -> str:
    return GENDER_FR.get(gender or "", gender or "non précisé")


def _objectifs_text(data: dict) -> str:
    objs = data.get("objectifs") or []
    return ", ".join(objs) if objs else "forme générale"


def _build_prompt(data: dict, plan: str) -> str:
    plan_fr = PLAN_LABELS.get(plan, plan)
    objectifs = _objectifs_text(data)
    return (
        f"{COACH_SYSTEM}\n\n"
        f"En 2-3 phrases, explique pourquoi ce plan nutrition ({plan_fr}) colle aux objectifs "
        f"et au profil sportif de cette personne. Ton direct et encourageant.\n\n"
        f"Profil sportif :\n"
        f"- Âge : {data.get('age')} ans | Genre : {_gender_label(data.get('gender'))}\n"
        f"- Poids : {data.get('weight_kg')} kg | Taille : {data.get('height_cm')} cm | IMC : {data.get('bmi')}\n"
        f"- Objectifs : {objectifs}\n"
        f"- Niveau d'activité : {data.get('physical_activity_level')} "
        f"({data.get('weekly_exercise_hours')} h d'entraînement/semaine)\n"
        f"- Apport calorique cible : {data.get('daily_caloric_intake')} kcal/jour\n"
        f"- Restrictions alimentaires : {data.get('dietary_restrictions')} | "
        f"Allergies : {data.get('allergies')}\n\n"
        f"Plan nutrition : {plan_fr}\n"
        f"Message du coach :"
    )


def _fallback_explanation(data: dict, plan: str) -> str:
    plan_fr = PLAN_LABELS.get(plan, plan)
    objectifs = _objectifs_text(data)
    bmi = data.get("bmi")
    calories = data.get("daily_caloric_intake")
    activity = data.get("physical_activity_level", "")

    parts = [
        f"Pour vos objectifs ({objectifs}), je vous propose un plan {plan_fr} "
        f"autour de {calories} kcal/jour."
    ]

    obj_lower = objectifs.lower()
    if "perte" in obj_lower:
        parts.append(
            "L'objectif est de créer un léger déficit tout en gardant de l'énergie pour vos séances — "
            "c'est la clé d'une perte de poids durable sans frustration."
        )
    elif "musculation" in obj_lower or "force" in obj_lower:
        parts.append(
            "Les protéines et les glucides de qualité alimentent vos muscles et votre récupération "
            "entre les séances."
        )
    elif "cardio" in obj_lower or "endurance" in obj_lower:
        parts.append(
            "Ce plan soutient vos efforts cardio en maintenant un bon apport en énergie "
            "avant et après l'entraînement."
        )
    elif bmi and float(bmi) > 25:
        parts.append(
            f"Avec un IMC de {bmi}, l'équilibre entre nutrition et activité ({activity}) "
            "vous aidera à progresser semaine après semaine."
        )
    else:
        parts.append(
            "Restez régulier sur les séances et hydratez-vous bien — la constance fait la différence."
        )

    restrictions = data.get("dietary_restrictions", "")
    if restrictions and restrictions not in ("None", ""):
        parts.append(f"Vos préférences alimentaires ({restrictions}) sont intégrées au programme.")

    return " ".join(parts)


def generate_explanation(patient_data: dict, recommended_plan: str) -> str:
    """
    Appelle l'API HuggingFace pour générer une explication textuelle.
    Retourne le fallback en cas d'erreur ou de token absent.
    """
    if not HF_API_TOKEN:
        return _fallback_explanation(patient_data, recommended_plan)

    prompt = _build_prompt(patient_data, recommended_plan)

    try:
        response = requests.post(
            HF_API_URL,
            headers={
                "Authorization": f"Bearer {HF_API_TOKEN}",
                "Content-Type": "application/json",
            },
            json={
                "model": HF_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 150,
                "temperature": 0.6,
                "stream": False,
            },
            timeout=HF_TIMEOUT,
        )

        if response.status_code == 200:
            data = response.json()
            choices = data.get("choices", [])
            if choices:
                text = choices[0].get("message", {}).get("content", "").strip()
                if text and len(text) > 20:
                    return text

        return _fallback_explanation(patient_data, recommended_plan)

    except requests.exceptions.Timeout:
        return _fallback_explanation(patient_data, recommended_plan)
    except Exception:
        return _fallback_explanation(patient_data, recommended_plan)


MOOD_COACH: dict[str, str] = {
    "content": "Vous avez bonne énergie aujourd'hui — profitez-en pour rester régulier sur vos séances.",
    "normal": "Rythme équilibré cette semaine : constance et technique avant l'intensité.",
    "triste": "Pas besoin d'être à 100 % : des séances légères et une marche suffisent.",
    "colere": "Bonne journée pour dépenser votre énergie dans l'effort, avec une technique propre.",
}


def _greeting(prenom: str | None) -> str:
    name = (prenom or "").strip()
    return f"Bonjour {name}," if name else "Bonjour,"


def _injury_sentence(labels: list[str]) -> str:
    clean = [x.strip() for x in labels if x and x.strip()]
    if not clean:
        return "Aucune zone sensible signalée — tous vos exercices sélectionnés sont au programme."
    joined = ", ".join(clean)
    return f"J'ai adapté les séances pour ménager : {joined}."


def build_coach_weekly_message(patient_data: dict, plan: dict) -> str:
    """Message coach factuel — uniquement les données du profil et du plan généré."""
    plan_fr = PLAN_LABELS.get(plan.get("diet_plan", ""), plan.get("diet_plan", ""))
    objectifs = _objectifs_text(patient_data)
    injury_labels = patient_data.get("injury_labels") or []
    ex_count = sum(len(d.get("exercices") or []) for d in plan.get("jours") or [])
    meal_count = sum(len(d.get("repas") or []) for d in plan.get("jours") or [])
    genre = _gender_label(patient_data.get("gender"))
    age = int(patient_data.get("age") or 0)
    taille = int(round(float(patient_data.get("height_cm") or 0)))
    poids = int(round(float(patient_data.get("weight_kg") or 0)))
    bmi = round(float(patient_data.get("bmi") or 0), 1)
    calories = int(round(float(patient_data.get("daily_caloric_intake") or 0)))
    humeur = patient_data.get("humeur")
    mood_line = MOOD_COACH.get(humeur or "", "")

    parts = [
        _greeting(patient_data.get("prenom")),
        (
            f"Cette semaine, on vise {objectifs} avec un plan {plan_fr} "
            f"autour de {calories} kcal/jour."
        ),
        (
            f"Votre profil : {genre}, {age} ans, {poids} kg pour {taille} cm "
            f"(IMC {bmi})."
        ),
        (
            f"Programme : {ex_count} séance{'s' if ex_count != 1 else ''} sur 7 jours "
            f"et {meal_count} repas planifiés à partir de vos choix."
        ),
        _injury_sentence(injury_labels),
    ]
    if mood_line:
        parts.append(mood_line)
    parts.append(
        "Hydratez-vous, écoutez votre corps et gardez au moins un jour de récupération active."
    )
    return " ".join(parts)


def generate_weekly_explanation(patient_data: dict, plan: dict) -> str:
    """Résumé hebdomadaire — message coach déterministe (fiable, sans invention)."""
    return build_coach_weekly_message(patient_data, plan)
