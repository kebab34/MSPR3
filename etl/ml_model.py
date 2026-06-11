"""
ETL - Machine learning model for diet recommendations.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Iterable

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.utils import Bunch
from joblib import dump

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent / "data"
MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_DIR.mkdir(exist_ok=True)
MODEL_PATH = MODEL_DIR / "diet_recommendation_model.joblib"

NUMERIC_FEATURES = [
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

CATEGORICAL_FEATURES = [
    "Gender",
    "Disease_Type",
    "Severity",
    "Physical_Activity_Level",
    "Dietary_Restrictions",
    "Allergies",
    "Preferred_Cuisine",
]

TARGET_COLUMN = "Diet_Recommendation"


def load_diet_recommendation_data(path: Path | str = DATA_DIR / "diet_recommendations_dataset.csv") -> pd.DataFrame:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset introuvable : {path}")

    df = pd.read_csv(path)
    logger.info("Chargé %d lignes depuis %s", len(df), path.name)
    return df


def prepare_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    df = df.copy()
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Colonne cible manquante : {TARGET_COLUMN}")

    columns = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    missing = [c for c in columns if c not in df.columns]
    if missing:
        raise ValueError(f"Colonnes manquantes pour le modèle : {missing}")

    df = df[columns + [TARGET_COLUMN]]
    df = df.dropna(subset=[TARGET_COLUMN])

    for numeric in NUMERIC_FEATURES:
        df[numeric] = pd.to_numeric(df[numeric], errors="coerce")

    df = df.dropna(subset=NUMERIC_FEATURES)

    X = df[columns]
    y = df[TARGET_COLUMN].astype(str).str.strip()
    return X, y


def build_preprocessing_pipeline() -> ColumnTransformer:
    numeric_transformer = StandardScaler()
    categorical_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False)

    return ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )


def build_model(learning_rate: float = 0.1, random_state: int = 42) -> HistGradientBoostingClassifier:
    return HistGradientBoostingClassifier(
        learning_rate=learning_rate,
        max_iter=200,
        max_leaf_nodes=32,
        random_state=random_state,
    )


def train_recommendation_model(
    df: pd.DataFrame,
    test_size: float = 0.25,
    random_state: int = 42,
    learning_rate: float = 0.1,
) -> dict[str, Any]:
    X, y = prepare_features(df)
    stratify_target = y if y.value_counts().min() >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        stratify=stratify_target,
        random_state=random_state,
    )

    pipeline = Pipeline([
        ("preprocessor", build_preprocessing_pipeline()),
        ("classifier", build_model(learning_rate=learning_rate, random_state=random_state)),
    ])

    logger.info("Entraînement du modèle sur %d échantillons", len(X_train))
    pipeline.fit(X_train, y_train)

    logger.info("Évaluation sur %d échantillons de test", len(X_test))
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, zero_division=0, output_dict=True)

    logger.info("Accuracy: %.3f", accuracy)
    logger.info("Classification report:\n%s", classification_report(y_test, y_pred, zero_division=0))

    result = {
        "model": pipeline,
        "accuracy": accuracy,
        "report": report,
        "n_features": X.shape[1],
        "classes": list(pipeline.named_steps["classifier"].classes_),
        "test_size": len(X_test),
        "train_size": len(X_train),
        "learning_rate": learning_rate,
    }
    return result


def save_model(pipeline: Pipeline, path: Path = MODEL_PATH) -> Path:
    dump(pipeline, path)
    logger.info("Modèle sauvegardé : %s", path)
    return path


def run_training(
    dataset_path: Path | str = DATA_DIR / "diet_recommendations_dataset.csv",
    model_path: Path | str = MODEL_PATH,
    learning_rate: float = 0.1,
    test_size: float = 0.25,
    random_state: int = 42,
) -> dict[str, Any]:
    df = load_diet_recommendation_data(dataset_path)
    result = train_recommendation_model(
        df,
        test_size=test_size,
        random_state=random_state,
        learning_rate=learning_rate,
    )
    save_model(result["model"], Path(model_path))
    return result


def describe_model() -> dict[str, Any]:
    return {
        "target": TARGET_COLUMN,
        "features": NUMERIC_FEATURES + CATEGORICAL_FEATURES,
        "model_type": "HistGradientBoostingClassifier",
        "preprocessor": {
            "numeric": NUMERIC_FEATURES,
            "categorical": CATEGORICAL_FEATURES,
        },
    }


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Entraîne un modèle de recommandations diététiques.")
    parser.add_argument("--dataset", default=str(DATA_DIR / "diet_recommendations_dataset.csv"), help="Chemin vers le CSV d'entraînement.")
    parser.add_argument("--model-path", default=str(MODEL_PATH), help="Chemin de sortie pour le modèle entraîné.")
    parser.add_argument("--learning-rate", type=float, default=0.1, help="Taux d'apprentissage du modèle.")
    parser.add_argument("--test-size", type=float, default=0.25, help="Fraction du jeu de test.")
    parser.add_argument("--random-state", type=int, default=42, help="Seed aléatoire.")
    args = parser.parse_args()

    result = run_training(
        dataset_path=args.dataset,
        model_path=args.model_path,
        learning_rate=args.learning_rate,
        test_size=args.test_size,
        random_state=args.random_state,
    )
    logger.info("Résultats finaux : accuracy=%.3f, test_size=%d", result["accuracy"], result["test_size"])


if __name__ == "__main__":
    main()
