"""
Tests unitaires pour le module ETL de machine learning.
"""

import os
import tempfile
from pathlib import Path
import sys

import pytest
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "etl"))

from ml_model import (
    prepare_features,
    train_recommendation_model,
    save_model,
    load_diet_recommendation_data,
)


def test_prepare_features_requires_target_column():
    df = pd.DataFrame({"Age": [30], "Diet_Recommendation": ["Balanced"]})
    with pytest.raises(ValueError):
        prepare_features(df.drop(columns=["Diet_Recommendation"]))


def test_train_recommendation_model_runs_on_small_dataset():
    df = pd.DataFrame({
        "Patient_ID": ["P0001", "P0002", "P0003", "P0004"],
        "Age": [56, 69, 46, 32],
        "Gender": ["Male", "Male", "Female", "Male"],
        "Weight_kg": [58.4, 101.2, 63.5, 58.1],
        "Height_cm": [160, 169, 173, 164],
        "BMI": [22.8, 35.4, 21.2, 21.6],
        "Disease_Type": ["Obesity", "Diabetes", "Hypertension", "None"],
        "Severity": ["Moderate", "Mild", "Mild", "Mild"],
        "Physical_Activity_Level": ["Moderate", "Moderate", "Sedentary", "Moderate"],
        "Daily_Caloric_Intake": [3079, 3032, 1737, 2657],
        "Cholesterol_mg/dL": [173.3, 199.2, 181.0, 168.2],
        "Blood_Pressure_mmHg": [133, 120, 121, 144],
        "Glucose_mg/dL": [116.3, 137.1, 109.6, 159.4],
        "Dietary_Restrictions": ["None", "None", "None", "None"],
        "Allergies": ["Peanuts", "Peanuts", "Peanuts", "None"],
        "Preferred_Cuisine": ["Mexican", "Chinese", "Chinese", "Mexican"],
        "Weekly_Exercise_Hours": [3.1, 4.5, 3.8, 4.3],
        "Adherence_to_Diet_Plan": [96.6, 63.2, 57.5, 54.5],
        "Dietary_Nutrient_Imbalance_Score": [3.1, 0.6, 4.6, 0.4],
        "Diet_Recommendation": ["Balanced", "Low_Carb", "Low_Sodium", "Balanced"],
    })

    result = train_recommendation_model(df, test_size=0.5, random_state=1, learning_rate=0.1)
    assert result["accuracy"] >= 0.0
    assert "Balanced" in result["classes"]


def test_save_model_writes_joblib_file(tmp_path: Path):
    df = pd.DataFrame({
        "Patient_ID": ["P0001", "P0002", "P0003", "P0004"],
        "Age": [56, 69, 46, 32],
        "Gender": ["Male", "Male", "Female", "Male"],
        "Weight_kg": [58.4, 101.2, 63.5, 58.1],
        "Height_cm": [160, 169, 173, 164],
        "BMI": [22.8, 35.4, 21.2, 21.6],
        "Disease_Type": ["Obesity", "Diabetes", "Hypertension", "None"],
        "Severity": ["Moderate", "Mild", "Mild", "Mild"],
        "Physical_Activity_Level": ["Moderate", "Moderate", "Sedentary", "Moderate"],
        "Daily_Caloric_Intake": [3079, 3032, 1737, 2657],
        "Cholesterol_mg/dL": [173.3, 199.2, 181.0, 168.2],
        "Blood_Pressure_mmHg": [133, 120, 121, 144],
        "Glucose_mg/dL": [116.3, 137.1, 109.6, 159.4],
        "Dietary_Restrictions": ["None", "None", "None", "None"],
        "Allergies": ["Peanuts", "Peanuts", "Peanuts", "None"],
        "Preferred_Cuisine": ["Mexican", "Chinese", "Chinese", "Mexican"],
        "Weekly_Exercise_Hours": [3.1, 4.5, 3.8, 4.3],
        "Adherence_to_Diet_Plan": [96.6, 63.2, 57.5, 54.5],
        "Dietary_Nutrient_Imbalance_Score": [3.1, 0.6, 4.6, 0.4],
        "Diet_Recommendation": ["Balanced", "Low_Carb", "Low_Sodium", "Balanced"],
    })
    result = train_recommendation_model(df, test_size=0.5, random_state=1, learning_rate=0.1)
    model_path = tmp_path / "model.joblib"
    save_model(result["model"], model_path)
    assert model_path.exists()


def test_load_diet_recommendation_data_file_not_found():
    missing_path = Path(tempfile.gettempdir()) / "missing_diet_dataset.csv"
    try:
        if missing_path.exists():
            missing_path.unlink()
        with pytest.raises(FileNotFoundError):
            load_diet_recommendation_data(missing_path)
    finally:
        if missing_path.exists():
            missing_path.unlink()
