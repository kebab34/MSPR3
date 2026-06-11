"""
Client vision HuggingFace — identification des aliments dans une image.
Modèle : nateraw/food (Food101, 101 catégories alimentaires)
"""
from __future__ import annotations

import os
import requests

HF_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "")
VISION_MODEL = "nateraw/food"
VISION_URL = f"https://router.huggingface.co/hf-inference/models/{VISION_MODEL}"
HF_TIMEOUT = int(os.getenv("HUGGINGFACE_TIMEOUT", "20"))

# Traduction des labels Food101 → français
FOOD_LABELS_FR: dict[str, str] = {
    "pizza": "Pizza", "hamburger": "Hamburger", "sushi": "Sushi",
    "steak": "Steak", "grilled_salmon": "Saumon grillé", "spaghetti_bolognese": "Spaghetti bolognaise",
    "spaghetti_carbonara": "Spaghetti carbonara", "caesar_salad": "Salade César",
    "greek_salad": "Salade grecque", "omelette": "Omelette", "french_fries": "Frites",
    "chicken_curry": "Curry de poulet", "pad_thai": "Pad Thaï", "ramen": "Ramen",
    "pho": "Phở", "tacos": "Tacos", "nachos": "Nachos", "guacamole": "Guacamole",
    "lasagna": "Lasagnes", "risotto": "Risotto", "paella": "Paella",
    "bibimbap": "Bibimbap", "fried_rice": "Riz frit", "dumplings": "Dumplings",
    "gyoza": "Gyoza", "spring_rolls": "Nems", "falafel": "Falafel",
    "hummus": "Houmous", "pancakes": "Pancakes", "waffles": "Gaufres",
    "french_toast": "Pain perdu", "cheesecake": "Cheesecake", "tiramisu": "Tiramisu",
    "chocolate_cake": "Gâteau au chocolat", "ice_cream": "Glace", "donuts": "Donuts",
    "macarons": "Macarons", "churros": "Churros", "ceviche": "Ceviche",
    "edamame": "Edamame", "miso_soup": "Soupe miso", "sashimi": "Sashimi",
    "seaweed_salad": "Salade d'algues", "oysters": "Huîtres", "mussels": "Moules",
    "scallops": "Saint-Jacques", "lobster_bisque": "Bisque de homard",
    "clam_chowder": "Chaudrée de palourdes", "filet_mignon": "Filet mignon",
    "prime_rib": "Côte de bœuf", "pork_chop": "Côtelette de porc",
    "chicken_wings": "Ailes de poulet", "baby_back_ribs": "Travers de porc",
    "peking_duck": "Canard laqué", "foie_gras": "Foie gras", "escargots": "Escargots",
    "bruschetta": "Bruschetta", "caprese_salad": "Salade caprese",
    "gnocchi": "Gnocchis", "ravioli": "Raviolis", "club_sandwich": "Club sandwich",
    "eggs_benedict": "Œufs bénédicte", "breakfast_burrito": "Burrito petit-déjeuner",
    "hot_dog": "Hot dog", "pulled_pork_sandwich": "Sandwich porc effiloché",
    "grilled_cheese_sandwich": "Sandwich fromage grillé", "fish_and_chips": "Fish & chips",
    "poutine": "Poutine", "samosa": "Samosa", "takoyaki": "Takoyaki",
}


def identify_food(image_bytes: bytes) -> list[dict]:
    """
    Envoie une image au modèle HuggingFace nateraw/food.
    Retourne la liste des aliments identifiés avec leur score de confiance.
    """
    if not HF_API_TOKEN:
        return [{"label": "unknown", "label_fr": "Aliment non identifié", "score": 0.0}]

    try:
        response = requests.post(
            VISION_URL,
            headers={
                "Authorization": f"Bearer {HF_API_TOKEN}",
                "Content-Type": "image/jpeg",
            },
            data=image_bytes,
            timeout=HF_TIMEOUT,
        )

        if response.status_code == 200:
            results = response.json()
            return [
                {
                    "label": r["label"],
                    "label_fr": FOOD_LABELS_FR.get(r["label"], r["label"].replace("_", " ").capitalize()),
                    "score": round(r["score"], 4),
                }
                for r in results[:5]
            ]

        return [{"label": "unknown", "label_fr": "Identification impossible", "score": 0.0}]

    except Exception:
        return [{"label": "unknown", "label_fr": "Service indisponible", "score": 0.0}]
