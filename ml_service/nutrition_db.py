"""
Base nutritionnelle pour les 101 catégories Food101.
Valeurs pour une portion standard (~150-200g).
Sources : USDA FoodData Central, Ciqual ANSES.
"""

NUTRITION_PER_PORTION: dict[str, dict] = {
    "apple_pie":         {"calories": 296, "proteines": 2.4, "glucides": 43, "lipides": 13, "fibres": 2.0},
    "baby_back_ribs":    {"calories": 350, "proteines": 28, "glucides": 5,  "lipides": 24, "fibres": 0},
    "baklava":           {"calories": 430, "proteines": 6,  "glucides": 50, "lipides": 24, "fibres": 2},
    "beef_carpaccio":    {"calories": 180, "proteines": 22, "glucides": 2,  "lipides": 9,  "fibres": 0},
    "beef_tartare":      {"calories": 200, "proteines": 24, "glucides": 3,  "lipides": 10, "fibres": 0},
    "beet_salad":        {"calories": 120, "proteines": 4,  "glucides": 18, "lipides": 4,  "fibres": 4},
    "beignets":          {"calories": 380, "proteines": 5,  "glucides": 44, "lipides": 20, "fibres": 1},
    "bibimbap":          {"calories": 490, "proteines": 22, "glucides": 70, "lipides": 12, "fibres": 5},
    "bread_pudding":     {"calories": 320, "proteines": 8,  "glucides": 45, "lipides": 12, "fibres": 1},
    "breakfast_burrito": {"calories": 450, "proteines": 20, "glucides": 48, "lipides": 18, "fibres": 4},
    "bruschetta":        {"calories": 210, "proteines": 7,  "glucides": 30, "lipides": 7,  "fibres": 2},
    "caesar_salad":      {"calories": 180, "proteines": 8,  "glucides": 10, "lipides": 13, "fibres": 2},
    "cannoli":           {"calories": 370, "proteines": 8,  "glucides": 44, "lipides": 18, "fibres": 1},
    "caprese_salad":     {"calories": 220, "proteines": 12, "glucides": 6,  "lipides": 16, "fibres": 1},
    "carrot_cake":       {"calories": 380, "proteines": 4,  "glucides": 52, "lipides": 18, "fibres": 2},
    "ceviche":           {"calories": 130, "proteines": 18, "glucides": 8,  "lipides": 2,  "fibres": 1},
    "cheesecake":        {"calories": 400, "proteines": 7,  "glucides": 38, "lipides": 24, "fibres": 0},
    "cheese_plate":      {"calories": 340, "proteines": 20, "glucides": 4,  "lipides": 28, "fibres": 0},
    "chicken_curry":     {"calories": 320, "proteines": 28, "glucides": 18, "lipides": 14, "fibres": 3},
    "chicken_quesadilla":{"calories": 400, "proteines": 26, "glucides": 36, "lipides": 16, "fibres": 2},
    "chicken_wings":     {"calories": 430, "proteines": 34, "glucides": 8,  "lipides": 28, "fibres": 0},
    "chocolate_cake":    {"calories": 450, "proteines": 5,  "glucides": 60, "lipides": 22, "fibres": 2},
    "chocolate_mousse":  {"calories": 310, "proteines": 5,  "glucides": 30, "lipides": 20, "fibres": 2},
    "churros":           {"calories": 390, "proteines": 5,  "glucides": 50, "lipides": 18, "fibres": 2},
    "clam_chowder":      {"calories": 230, "proteines": 10, "glucides": 22, "lipides": 11, "fibres": 1},
    "club_sandwich":     {"calories": 490, "proteines": 30, "glucides": 42, "lipides": 20, "fibres": 3},
    "crab_cakes":        {"calories": 280, "proteines": 20, "glucides": 18, "lipides": 12, "fibres": 1},
    "creme_brulee":      {"calories": 330, "proteines": 5,  "glucides": 30, "lipides": 22, "fibres": 0},
    "croque_madame":     {"calories": 480, "proteines": 28, "glucides": 36, "lipides": 24, "fibres": 2},
    "cup_cakes":         {"calories": 360, "proteines": 4,  "glucides": 52, "lipides": 16, "fibres": 1},
    "deviled_eggs":      {"calories": 180, "proteines": 12, "glucides": 2,  "lipides": 14, "fibres": 0},
    "donuts":            {"calories": 420, "proteines": 5,  "glucides": 54, "lipides": 20, "fibres": 1},
    "dumplings":         {"calories": 280, "proteines": 14, "glucides": 36, "lipides": 8,  "fibres": 2},
    "edamame":           {"calories": 120, "proteines": 11, "glucides": 10, "lipides": 5,  "fibres": 5},
    "eggs_benedict":     {"calories": 380, "proteines": 20, "glucides": 24, "lipides": 22, "fibres": 1},
    "escargots":         {"calories": 160, "proteines": 14, "glucides": 4,  "lipides": 10, "fibres": 0},
    "falafel":           {"calories": 330, "proteines": 14, "glucides": 36, "lipides": 14, "fibres": 6},
    "filet_mignon":      {"calories": 340, "proteines": 36, "glucides": 0,  "lipides": 20, "fibres": 0},
    "fish_and_chips":    {"calories": 550, "proteines": 26, "glucides": 58, "lipides": 24, "fibres": 4},
    "foie_gras":         {"calories": 490, "proteines": 12, "glucides": 4,  "lipides": 46, "fibres": 0},
    "french_fries":      {"calories": 430, "proteines": 5,  "glucides": 56, "lipides": 20, "fibres": 4},
    "french_onion_soup": {"calories": 240, "proteines": 10, "glucides": 26, "lipides": 10, "fibres": 2},
    "french_toast":      {"calories": 380, "proteines": 12, "glucides": 44, "lipides": 18, "fibres": 2},
    "fried_calamari":    {"calories": 360, "proteines": 20, "glucides": 30, "lipides": 16, "fibres": 1},
    "fried_rice":        {"calories": 440, "proteines": 12, "glucides": 60, "lipides": 14, "fibres": 2},
    "frozen_yogurt":     {"calories": 200, "proteines": 5,  "glucides": 38, "lipides": 3,  "fibres": 0},
    "garlic_bread":      {"calories": 310, "proteines": 8,  "glucides": 40, "lipides": 13, "fibres": 2},
    "gnocchi":           {"calories": 380, "proteines": 10, "glucides": 62, "lipides": 10, "fibres": 3},
    "greek_salad":       {"calories": 180, "proteines": 6,  "glucides": 12, "lipides": 12, "fibres": 3},
    "grilled_cheese_sandwich": {"calories": 420, "proteines": 16, "glucides": 38, "lipides": 22, "fibres": 2},
    "grilled_salmon":    {"calories": 310, "proteines": 34, "glucides": 0,  "lipides": 18, "fibres": 0},
    "guacamole":         {"calories": 160, "proteines": 2,  "glucides": 10, "lipides": 14, "fibres": 6},
    "gyoza":             {"calories": 280, "proteines": 12, "glucides": 34, "lipides": 10, "fibres": 2},
    "hamburger":         {"calories": 540, "proteines": 28, "glucides": 44, "lipides": 26, "fibres": 3},
    "hot_and_sour_soup": {"calories": 150, "proteines": 8,  "glucides": 18, "lipides": 5,  "fibres": 1},
    "hot_dog":           {"calories": 380, "proteines": 14, "glucides": 32, "lipides": 22, "fibres": 1},
    "huevos_rancheros":  {"calories": 360, "proteines": 18, "glucides": 30, "lipides": 18, "fibres": 4},
    "hummus":            {"calories": 200, "proteines": 8,  "glucides": 20, "lipides": 10, "fibres": 5},
    "ice_cream":         {"calories": 270, "proteines": 4,  "glucides": 32, "lipides": 14, "fibres": 0},
    "lasagna":           {"calories": 440, "proteines": 22, "glucides": 46, "lipides": 18, "fibres": 3},
    "lobster_bisque":    {"calories": 280, "proteines": 14, "glucides": 18, "lipides": 16, "fibres": 1},
    "lobster_roll_sandwich": {"calories": 450, "proteines": 24, "glucides": 40, "lipides": 20, "fibres": 2},
    "macaroni_and_cheese": {"calories": 480, "proteines": 18, "glucides": 58, "lipides": 20, "fibres": 2},
    "macarons":          {"calories": 420, "proteines": 6,  "glucides": 62, "lipides": 16, "fibres": 1},
    "miso_soup":         {"calories": 80,  "proteines": 5,  "glucides": 8,  "lipides": 2,  "fibres": 1},
    "mussels":           {"calories": 200, "proteines": 24, "glucides": 8,  "lipides": 5,  "fibres": 0},
    "nachos":            {"calories": 520, "proteines": 14, "glucides": 58, "lipides": 26, "fibres": 4},
    "omelette":          {"calories": 280, "proteines": 20, "glucides": 4,  "lipides": 20, "fibres": 0},
    "onion_rings":       {"calories": 410, "proteines": 6,  "glucides": 50, "lipides": 20, "fibres": 3},
    "oysters":           {"calories": 140, "proteines": 16, "glucides": 8,  "lipides": 4,  "fibres": 0},
    "pad_thai":          {"calories": 480, "proteines": 18, "glucides": 62, "lipides": 16, "fibres": 3},
    "paella":            {"calories": 440, "proteines": 28, "glucides": 50, "lipides": 12, "fibres": 2},
    "pancakes":          {"calories": 380, "proteines": 8,  "glucides": 56, "lipides": 14, "fibres": 2},
    "panna_cotta":       {"calories": 290, "proteines": 4,  "glucides": 30, "lipides": 18, "fibres": 0},
    "peking_duck":       {"calories": 480, "proteines": 32, "glucides": 22, "lipides": 28, "fibres": 1},
    "pho":               {"calories": 350, "proteines": 22, "glucides": 48, "lipides": 6,  "fibres": 2},
    "pizza":             {"calories": 470, "proteines": 20, "glucides": 56, "lipides": 18, "fibres": 3},
    "pork_chop":         {"calories": 360, "proteines": 36, "glucides": 0,  "lipides": 22, "fibres": 0},
    "poutine":           {"calories": 560, "proteines": 16, "glucides": 54, "lipides": 30, "fibres": 3},
    "prime_rib":         {"calories": 420, "proteines": 40, "glucides": 0,  "lipides": 28, "fibres": 0},
    "pulled_pork_sandwich": {"calories": 520, "proteines": 30, "glucides": 46, "lipides": 22, "fibres": 2},
    "ramen":             {"calories": 480, "proteines": 20, "glucides": 62, "lipides": 16, "fibres": 2},
    "ravioli":           {"calories": 400, "proteines": 16, "glucides": 52, "lipides": 14, "fibres": 2},
    "red_velvet_cake":   {"calories": 420, "proteines": 5,  "glucides": 58, "lipides": 20, "fibres": 1},
    "risotto":           {"calories": 420, "proteines": 12, "glucides": 60, "lipides": 14, "fibres": 2},
    "samosa":            {"calories": 350, "proteines": 8,  "glucides": 44, "lipides": 16, "fibres": 4},
    "sashimi":           {"calories": 180, "proteines": 26, "glucides": 0,  "lipides": 6,  "fibres": 0},
    "scallops":          {"calories": 180, "proteines": 22, "glucides": 6,  "lipides": 6,  "fibres": 0},
    "seaweed_salad":     {"calories": 80,  "proteines": 2,  "glucides": 12, "lipides": 2,  "fibres": 3},
    "shrimp_and_grits":  {"calories": 440, "proteines": 26, "glucides": 42, "lipides": 18, "fibres": 2},
    "spaghetti_bolognese": {"calories": 520, "proteines": 28, "glucides": 58, "lipides": 18, "fibres": 4},
    "spaghetti_carbonara": {"calories": 560, "proteines": 24, "glucides": 58, "lipides": 26, "fibres": 2},
    "spring_rolls":      {"calories": 280, "proteines": 8,  "glucides": 36, "lipides": 12, "fibres": 2},
    "steak":             {"calories": 380, "proteines": 38, "glucides": 0,  "lipides": 24, "fibres": 0},
    "strawberry_shortcake": {"calories": 350, "proteines": 5, "glucides": 52, "lipides": 14, "fibres": 2},
    "sushi":             {"calories": 320, "proteines": 16, "glucides": 48, "lipides": 6,  "fibres": 1},
    "tacos":             {"calories": 420, "proteines": 20, "glucides": 44, "lipides": 18, "fibres": 4},
    "takoyaki":          {"calories": 300, "proteines": 12, "glucides": 36, "lipides": 12, "fibres": 1},
    "tiramisu":          {"calories": 380, "proteines": 6,  "glucides": 40, "lipides": 22, "fibres": 0},
    "tuna_tartare":      {"calories": 190, "proteines": 26, "glucides": 4,  "lipides": 8,  "fibres": 0},
    "waffles":           {"calories": 410, "proteines": 8,  "glucides": 56, "lipides": 18, "fibres": 2},
}

DEFAULT_NUTRITION = {"calories": 350, "proteines": 15, "glucides": 40, "lipides": 14, "fibres": 2}


def get_nutrition(food_label: str) -> dict:
    key = food_label.lower().replace(" ", "_").replace("-", "_")
    return NUTRITION_PER_PORTION.get(key, DEFAULT_NUTRITION)


def analyze_balance(nutrition: dict, objectif: str = "equilibre") -> dict[str, str]:
    """Détecte les déséquilibres et retourne des messages d'alerte."""
    alerts = {}

    if nutrition["calories"] > 600:
        alerts["calories"] = f"Repas calorique ({nutrition['calories']} kcal) — représente {round(nutrition['calories']/2000*100)}% de l'apport journalier recommandé."
    if nutrition["lipides"] > 25:
        alerts["lipides"] = f"Teneur en graisses élevée ({nutrition['lipides']}g)."
    if nutrition["glucides"] > 65:
        alerts["glucides"] = f"Teneur en glucides élevée ({nutrition['glucides']}g)."
    if nutrition["proteines"] < 10:
        alerts["proteines"] = f"Faible apport en protéines ({nutrition['proteines']}g)."
    if nutrition["fibres"] < 3:
        alerts["fibres"] = f"Peu de fibres ({nutrition['fibres']}g) — pensez aux légumes."

    if objectif == "perte_de_poids" and nutrition["calories"] > 500:
        alerts["objectif"] = "Repas trop calorique pour un objectif de perte de poids."
    elif objectif == "prise_de_masse" and nutrition["proteines"] < 20:
        alerts["objectif"] = "Protéines insuffisantes pour un objectif de prise de masse."
    elif objectif == "performance_sportive" and nutrition["glucides"] < 30:
        alerts["objectif"] = "Glucides insuffisants pour la performance sportive."

    return alerts
