"""
Génération d'un programme hebdomadaire (exercices + repas) à partir du profil,
des blessures, des objectifs, de l'équipement disponible et du budget.
"""
from __future__ import annotations

import hashlib
from typing import Any

# Équipement requis par type d'exercice (termes détectés dans le champ `equipement`)
EQUIPMENT_TERMS: dict[str, set[str]] = {
    "salle_de_sport": {"machine", "cable", "poulie", "rack", "barre", "smith"},
    "halteres":       {"haltere", "haltères", "dumbbell", "kettlebell"},
    "barre":          {"barre", "barbell", "olympique"},
    "tapis":          {"tapis", "sol", "yoga", "mat"},
    "elastiques":     {"élastique", "elastique", "resistance band", "band"},
    "aucun":          set(),  # poids du corps uniquement
}

JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

REPAS_TYPES = ["petit-dejeuner", "dejeuner", "diner"]

# Zones blessées → groupes musculaires / types d'exercices à éviter
INJURY_AVOID: dict[str, set[str]] = {
    "epaule_gauche": {"épaules", "epaules", "shoulders", "épaule", "deltoïdes"},
    "epaule_droite": {"épaules", "epaules", "shoulders", "épaule", "deltoïdes"},
    "genou_gauche": {"quadriceps", "jambes", "legs", "genoux", "cuisses"},
    "genou_droit": {"quadriceps", "jambes", "legs", "genoux", "cuisses"},
    "dos_bas": {"dos", "lombaires", "lower back", "back"},
    "dos_haut": {"dos", "upper back", "trapèzes"},
    "cheville_gauche": {"mollets", "calves", "chevilles", "jambes"},
    "cheville_droite": {"mollets", "calves", "chevilles", "jambes"},
    "poitrine": {"pectoraux", "chest", "poitrine"},
    "abdominaux": {"abdominaux", "abs", "core"},
    "cou": {"cou", "neck"},
    "fessiers": {"fessiers", "glutes", "hanches"},
    "ischio_jambier_gauche": {"ischio", "jambes", "hamstrings"},
    "ischio_jambier_droit": {"ischio", "jambes", "hamstrings"},
}

OBJECTIF_EXERCISE_PREF: dict[str, set[str]] = {
    "perte_poids": {"cardio", "autre"},
    "perte de poids": {"cardio", "autre"},
    "musculation": {"force", "autre"},
    "cardio": {"cardio"},
    "endurance": {"cardio", "autre"},
    "flexibilite": {"flexibilite", "autre"},
    "flexibilité": {"flexibilite", "autre"},
    "force": {"force"},
    "forme_generale": {"cardio", "force", "flexibilite", "autre"},
    "forme générale": {"cardio", "force", "flexibilite", "autre"},
}


def _norm(s: str | None) -> str:
    return (s or "").strip().lower()


def _avoid_terms(zones: list[str]) -> set[str]:
    terms: set[str] = set()
    for z in zones:
        terms |= INJURY_AVOID.get(z, set())
    return terms


def _exercise_ok(ex: dict[str, Any], avoid: set[str]) -> bool:
    if not avoid:
        return True
    blob = " ".join(
        _norm(ex.get(k)) for k in ("nom", "groupe_musculaire", "type", "description")
    )
    return not any(term in blob for term in avoid)


def _equipment_ok(ex: dict[str, Any], equipement_disponible: list[str]) -> bool:
    """Vérifie que l'exercice est réalisable avec l'équipement disponible."""
    if not equipement_disponible:
        return True  # Pas de contrainte → tout accepté
    ex_equip = _norm(ex.get("equipement") or "")
    if not ex_equip or ex_equip in ("aucun", "none", ""):
        return True  # Poids du corps → toujours OK
    # Construire la liste des termes autorisés
    allowed_terms: set[str] = set()
    for equip in equipement_disponible:
        allowed_terms |= EQUIPMENT_TERMS.get(equip, {equip})
    # L'exercice est OK si son équipement figure dans les termes autorisés
    return any(term in ex_equip for term in allowed_terms)


def _estimate_cost(aliment: dict[str, Any]) -> float:
    """
    Estime le coût en €/portion si non fourni.
    Heuristique : basé sur les protéines (proxy du prix des aliments riches en protéines).
    """
    if aliment.get("cout_estime") is not None:
        return float(aliment["cout_estime"])
    proteines = float(aliment.get("proteines") or 0)
    calories = float(aliment.get("calories") or 200)
    # Aliments riches en protéines = plus chers (viande, poisson, crustacés)
    if proteines > 25:
        return 4.0   # Viande/poisson → ~4€/portion
    if proteines > 15:
        return 2.5   # Œufs, légumineuses, fromage → ~2.5€/portion
    if calories > 400:
        return 2.0   # Glucides denses (pâtes, riz, pain) → ~2€/portion
    return 1.5       # Légumes, fruits → ~1.5€/portion


def _filter_by_budget(aliments: list[dict], budget_jour: float | None) -> list[dict]:
    """Filtre les aliments selon le budget journalier (3 repas/jour)."""
    if budget_jour is None:
        return aliments
    budget_par_repas = budget_jour / 3
    affordable = [a for a in aliments if _estimate_cost(a) <= budget_par_repas]
    # Fallback : si trop restrictif, garder les 5 moins chers
    if not affordable:
        return sorted(aliments, key=_estimate_cost)[:5]
    return affordable


def _score_exercise(ex: dict[str, Any], objectifs: list[str]) -> int:
    ex_type = _norm(ex.get("type"))
    score = 0
    for obj in objectifs:
        prefs = OBJECTIF_EXERCISE_PREF.get(_norm(obj), set())
        if ex_type in prefs:
            score += 2
    if ex_type == "flexibilite" and any("flex" in _norm(o) for o in objectifs):
        score += 1
    return score


def _stable_pick(items: list[dict], seed: str, count: int) -> list[dict]:
    if not items:
        return []
    ordered = sorted(items, key=lambda x: hashlib.md5(f"{seed}:{x.get('id_exercice') or x.get('id_aliment') or x.get('nom')}".encode()).hexdigest())
    return ordered[:count]


def _distribute(items: list[dict], days: int) -> list[list[dict]]:
    if not items:
        return [[] for _ in range(days)]
    buckets: list[list[dict]] = [[] for _ in range(days)]
    for i, item in enumerate(items):
        buckets[i % days].append(item)
    return buckets


def build_weekly_plan(data: dict[str, Any], diet_plan: str) -> dict[str, Any]:
    objectifs = data.get("objectifs") or []
    zones = data.get("zones_blessure") or []
    humeur = data.get("humeur")
    avoid = _avoid_terms(zones)
    equipement_disponible = data.get("equipement_disponible") or []
    budget_jour = data.get("budget_jour")

    exercices_in = data.get("exercices") or []
    aliments_in = data.get("aliments") or []

    # Filtrer exercices : blessures + équipement disponible
    pool_ex = [
        ex for ex in exercices_in
        if _exercise_ok(ex, avoid) and _equipment_ok(ex, equipement_disponible)
    ]
    pool_ex.sort(key=lambda ex: _score_exercise(ex, objectifs), reverse=True)

    skipped = len(exercices_in) - len(pool_ex)

    # Au moins 7 exercices pour couvrir la semaine (répétition si besoin)
    if pool_ex:
        while len(pool_ex) < 7:
            pool_ex = pool_ex + exercices_in[: max(0, 7 - len(pool_ex))]
        pool_ex = pool_ex[: max(7, len(pool_ex))]

    ex_per_day = _distribute(pool_ex, 7)

    # Repas : filtrage budget + 3 repas par jour
    pool_food = _filter_by_budget(aliments_in[:], budget_jour)
    if not pool_food:
        pool_food = []
    meals_flat: list[dict] = []
    idx = 0
    for _ in range(7 * 3):
        if pool_food:
            meals_flat.append(pool_food[idx % len(pool_food)])
            idx += 1

    meals_per_day: list[list[dict]] = [[] for _ in range(7)]
    for i, aliment in enumerate(meals_flat):
        day_i = i // 3
        meal_type = REPAS_TYPES[i % 3]
        meals_per_day[day_i].append({**aliment, "type_repas": meal_type})

    days_out = []
    for i, jour in enumerate(JOURS):
        day_ex = ex_per_day[i]
        day_meals = meals_per_day[i]
        meals_grouped = []
        for mt in REPAS_TYPES:
            items = [m for m in day_meals if m.get("type_repas") == mt]
            if items:
                meals_grouped.append({
                    "type": mt,
                    "label": {"petit-dejeuner": "Petit-déjeuner", "dejeuner": "Déjeuner", "diner": "Dîner"}[mt],
                    "aliments": [{"nom": a.get("nom"), "calories": a.get("calories"), "id_aliment": a.get("id_aliment")} for a in items[:2]],
                })
        days_out.append({
            "jour": jour,
            "exercices": [
                {
                    "id_exercice": ex.get("id_exercice"),
                    "nom": ex.get("nom"),
                    "type": ex.get("type"),
                    "groupe_musculaire": ex.get("groupe_musculaire"),
                    "niveau": ex.get("niveau"),
                    "note": _exercise_note(ex, zones, humeur),
                }
                for ex in day_ex[:2]
            ],
            "repas": meals_grouped,
        })

    injury_labels = data.get("injury_labels") or zones
    return {
        "diet_plan": diet_plan,
        "objectifs": objectifs,
        "zones_blessure": zones,
        "injury_labels": injury_labels,
        "humeur": humeur,
        "exercices_exclus_blessure": skipped,
        "jours": days_out,
        "conseils": _tips(objectifs, zones, humeur, diet_plan, equipement_disponible, budget_jour),
    }


DIET_COACH_LABELS = {
    "Balanced": "alimentation équilibrée",
    "Low_Carb": "moins de glucides, plus de protéines",
    "Low_Sodium": "faible en sel",
}


def _exercise_note(ex: dict, zones: list[str], humeur: str | None) -> str:
    notes = []
    if zones:
        notes.append("Charge modérée — j'ai adapté l'exercice à vos zones sensibles.")
    if humeur == "triste":
        notes.append("Séance légère : l'important c'est de bouger, pas de forcer.")
    elif humeur == "colere":
        notes.append("Bonne journée pour dépenser de l'énergie — gardez une technique propre.")
    elif humeur == "content":
        notes.append("Vous avez de l'énergie : poussez un peu, tout en gardant le contrôle.")
    niv = _norm(ex.get("niveau"))
    if niv == "avance":
        notes.append("Échauffement complet avant de monter en intensité.")
    return " ".join(notes) if notes else "Séance adaptée à votre niveau."


def _tips(objectifs: list[str], zones: list[str], humeur: str | None, diet: str, equipement: list[str] | None = None, budget: float | None = None) -> list[str]:
    diet_label = DIET_COACH_LABELS.get(diet, diet.replace("_", " "))
    tips = [f"Plan nutrition de la semaine : {diet_label}."]
    if objectifs:
        tips.append(f"On vise : {', '.join(objectifs)} — régularité avant tout.")
    if zones:
        tips.append("J'ai écarté les exercices trop contraignants pour vos zones sensibles.")
    if humeur == "triste":
        tips.append("Pas besoin d'être à 100 % : une séance courte vaut mieux que rien.")
    if budget is not None:
        tips.append(f"Budget alimentaire respecté : ~{budget:.0f}€/jour — les aliments proposés correspondent à cette enveloppe.")
    if equipement:
        equip_labels = {"salle_de_sport": "salle de sport", "halteres": "haltères", "tapis": "tapis", "elastiques": "élastiques", "barre": "barre", "aucun": "poids du corps"}
        equip_str = ", ".join(equip_labels.get(e, e) for e in equipement)
        tips.append(f"Exercices adaptés à votre équipement : {equip_str}.")
    tips.append("Buvez avant, pendant et après l'effort. Ajustez les portions selon votre faim et vos séances.")
    tips.append("Prévoyez au moins un jour de récupération active (marche, étirements).")
    return tips
