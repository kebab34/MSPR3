import os
from pathlib import Path
from datetime import datetime
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from joblib import dump, load

MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_MODEL_PATH = MODEL_DIR / "recommendation_model.joblib"

CATEGORICAL_COLS = [
    "Gender",
    "Disease_Type",
    "Severity",
    "Physical_Activity_Level",
    "Dietary_Restrictions",
    "Allergies",
    "Preferred_Cuisine",
]
NUMERIC_COLS = [
    "Age",
    "Weight_kg",
    "Height_cm",
    "BMI",
    "Daily_Caloric_Intake",
    "Cholesterol_mg/dL",
    "Blood_Pressure_mmHg",
    "Glucose_mg/dL",
    "Weekly_Exercise_Hours",
    "Adherence_to_Diet_Plan",
    "Dietary_Nutrient_Imbalance_Score",
]
TARGET_COL = "Diet_Recommendation"


class ModelService:
    def __init__(self, dataset_path: str | None = None):
        self.dataset_path = dataset_path or os.getenv("ML_DATASET_PATH")
        self.model_path = Path(os.getenv("ML_MODEL_PATH", DEFAULT_MODEL_PATH))
        self.model: Pipeline | None = None
        self.classes: list[str] = []
        if self.model_path.exists():
            self.load_model()

    def load_model(self) -> None:
        self.model = load(self.model_path)
        self.classes = self.model.named_steps["classifier"].classes_.tolist()

    def _build_pipeline(self) -> Pipeline:
        numeric_transformer = StandardScaler()
        categorical_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False)

        preprocessor = ColumnTransformer(
            transformers=[
                ("num", numeric_transformer, NUMERIC_COLS),
                ("cat", categorical_transformer, CATEGORICAL_COLS),
            ],
            remainder="drop",
        )

        classifier = RandomForestClassifier(random_state=42, class_weight="balanced", n_estimators=200)
        pipeline = Pipeline([("preprocessor", preprocessor), ("classifier", classifier)])
        return pipeline

    def _load_dataset(self, dataset_path: str) -> pd.DataFrame:
        df = pd.read_csv(dataset_path)
        if TARGET_COL not in df.columns:
            raise ValueError(f"Dataset must contain target column '{TARGET_COL}'")
        for col in CATEGORICAL_COLS:
            if col not in df.columns:
                raise ValueError(f"Dataset must contain categorical column '{col}'")
        for col in NUMERIC_COLS:
            if col not in df.columns:
                raise ValueError(f"Dataset must contain numeric column '{col}'")
        df[CATEGORICAL_COLS] = df[CATEGORICAL_COLS].fillna("None").astype(str)
        return df

    def train(self, dataset_path: str | None = None) -> dict:
        path = Path(dataset_path or self.dataset_path or Path(__file__).resolve().parent / "data" / "diet_recommendations_dataset.csv")
        if not path.exists():
            raise FileNotFoundError(f"Dataset not found at {path}")

        df = self._load_dataset(str(path))
        X = df[NUMERIC_COLS + CATEGORICAL_COLS]
        y = df[TARGET_COL].astype(str)

        try:
            stratify = y if y.nunique() > 1 else None
            X_train, X_test, y_train, y_test = train_test_split(
                X,
                y,
                test_size=0.2,
                random_state=42,
                stratify=stratify,
            )
        except ValueError:
            X_train, X_test, y_train, y_test = train_test_split(
                X,
                y,
                test_size=0.2,
                random_state=42,
            )

        pipeline = self._build_pipeline()
        pipeline.fit(X_train, y_train)
        dump(pipeline, self.model_path)
        self.model = pipeline
        self.classes = pipeline.named_steps["classifier"].classes_.tolist()

        return {
            "model_path": str(self.model_path),
            "trained": True,
            "classes": self.classes,
            "trained_at": datetime.utcnow().isoformat() + "Z",
        }

    def predict(self, payload: dict) -> dict:
        if self.model is None:
            raise ValueError("Model not loaded. Train the model first.")

        field_map = {
            "age": "Age",
            "gender": "Gender",
            "weight_kg": "Weight_kg",
            "height_cm": "Height_cm",
            "bmi": "BMI",
            "disease_type": "Disease_Type",
            "severity": "Severity",
            "physical_activity_level": "Physical_Activity_Level",
            "daily_caloric_intake": "Daily_Caloric_Intake",
            "cholesterol_mg_dL": "Cholesterol_mg/dL",
            "blood_pressure_mmhg": "Blood_Pressure_mmHg",
            "glucose_mg_dL": "Glucose_mg/dL",
            "dietary_restrictions": "Dietary_Restrictions",
            "allergies": "Allergies",
            "preferred_cuisine": "Preferred_Cuisine",
            "weekly_exercise_hours": "Weekly_Exercise_Hours",
            "adherence_to_diet_plan": "Adherence_to_Diet_Plan",
            "dietary_nutrient_imbalance_score": "Dietary_Nutrient_Imbalance_Score",
        }

        record = {}
        for key, column in field_map.items():
            record[column] = payload.get(key)

        df = pd.DataFrame([record])
        df[CATEGORICAL_COLS] = df[CATEGORICAL_COLS].fillna("None").astype(str)
        probabilities = self.model.predict_proba(df)[0]
        labels = self.model.named_steps["classifier"].classes_
        best_idx = int(probabilities.argmax())
        return {
            "recommended_plan": labels[best_idx],
            "confidence": float(probabilities[best_idx]),
            "classes": labels.tolist(),
            "probabilities": probabilities.tolist(),
        }

    def model_info(self) -> dict:
        return {
            "model_path": str(self.model_path),
            "trained": self.model is not None,
            "trained_at": None,
            "classes": self.classes,
        }
