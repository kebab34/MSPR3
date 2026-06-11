from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class RecommendationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    age: int
    gender: str
    weight_kg: float
    height_cm: float
    bmi: float
    disease_type: str
    severity: str
    physical_activity_level: str
    daily_caloric_intake: float
    cholesterol_mg_dL: float = Field(..., alias="cholesterol_mg/dL")
    blood_pressure_mmhg: float = Field(..., alias="blood_pressure_mmHg")
    glucose_mg_dL: float = Field(..., alias="glucose_mg/dL")
    dietary_restrictions: str
    allergies: str
    preferred_cuisine: str
    weekly_exercise_hours: float
    adherence_to_diet_plan: float
    dietary_nutrient_imbalance_score: float

class RecommendationResponse(BaseModel):
    recommended_plan: str
    confidence: float
    explanation: Optional[str] = None

class ModelInfo(BaseModel):
    model_path: str
    trained: bool
    trained_at: Optional[str] = None
    classes: list[str]

class TrainResponse(BaseModel):
    message: str
    model_path: str
    trained: bool

class RecommendationLog(BaseModel):
    request: RecommendationRequest
    response: RecommendationResponse
    created_at: str


class CatalogExercice(BaseModel):
    id_exercice: Optional[str] = None
    nom: str
    type: Optional[str] = None
    groupe_musculaire: Optional[str] = None
    niveau: Optional[str] = None
    equipement: Optional[str] = None


class CatalogAliment(BaseModel):
    id_aliment: Optional[str] = None
    nom: str
    calories: Optional[float] = None
    proteines: Optional[float] = None
    glucides: Optional[float] = None
    lipides: Optional[float] = None
    cout_estime: Optional[float] = None  # €/portion, optionnel


class WeeklyPlanRequest(BaseModel):
    """Profil enrichi + sélections utilisateur pour le programme hebdomadaire."""
    model_config = ConfigDict(populate_by_name=True)

    # Profil (pré-rempli côté frontend)
    prenom: Optional[str] = None
    age: int
    gender: str
    weight_kg: float
    height_cm: float
    bmi: float
    objectifs: list[str] = []
    zones_blessure: list[str] = []
    injury_labels: list[str] = []
    humeur: Optional[str] = None

    # Champs ML diététique (dérivés ou ajustables)
    disease_type: str = "None"
    severity: str = "Mild"
    physical_activity_level: str = "Moderate"
    daily_caloric_intake: float = 2000
    cholesterol_mg_dL: float = Field(180, alias="cholesterol_mg/dL")
    blood_pressure_mmhg: float = Field(120, alias="blood_pressure_mmHg")
    glucose_mg_dL: float = Field(95, alias="glucose_mg/dL")
    dietary_restrictions: str = "None"
    allergies: str = "None"
    preferred_cuisine: str = "None"
    weekly_exercise_hours: float = 3.0
    adherence_to_diet_plan: float = 70.0
    dietary_nutrient_imbalance_score: float = 3.0

    # Contraintes matérielles et budget
    equipement_disponible: list[str] = []  # ex: ["halteres", "tapis", "salle_de_sport", "elastiques"]
    budget_jour: Optional[float] = None    # Budget alimentaire en €/jour (None = pas de contrainte)

    # Choix utilisateur
    exercices: list[CatalogExercice] = []
    aliments: list[CatalogAliment] = []


class WeeklyMealItem(BaseModel):
    nom: Optional[str] = None
    calories: Optional[float] = None
    id_aliment: Optional[str] = None


class WeeklyMeal(BaseModel):
    type: str
    label: str
    aliments: list[WeeklyMealItem] = []


class WeeklyDayExercise(BaseModel):
    id_exercice: Optional[str] = None
    nom: Optional[str] = None
    type: Optional[str] = None
    groupe_musculaire: Optional[str] = None
    niveau: Optional[str] = None
    note: Optional[str] = None


class WeeklyDayPlan(BaseModel):
    jour: str
    exercices: list[WeeklyDayExercise] = []
    repas: list[WeeklyMeal] = []


class WeeklyPlanResponse(BaseModel):
    recommended_plan: str
    confidence: float
    explanation: Optional[str] = None
    objectifs: list[str] = []
    zones_blessure: list[str] = []
    injury_labels: list[str] = []
    humeur: Optional[str] = None
    exercices_exclus_blessure: int = 0
    conseils: list[str] = []
    jours: list[WeeklyDayPlan] = []
