import os
from pathlib import Path
import pandas as pd
import pytest
from ml_service.model import ModelService
from ml_service.db import get_logs, log_recommendation
from ml_service.schemas import RecommendationRequest

def test_model_service_train_and_predict(tmp_path, monkeypatch):
    dataset_path = tmp_path / "diet_recommendations.csv"
    dataset_path.write_text(
        "Age,Gender,Weight_kg,Height_cm,BMI,Disease_Type,Severity,Physical_Activity_Level,Daily_Caloric_Intake,Cholesterol_mg/dL,Blood_Pressure_mmHg,Glucose_mg/dL,Dietary_Restrictions,Allergies,Preferred_Cuisine,Weekly_Exercise_Hours,Adherence_to_Diet_Plan,Dietary_Nutrient_Imbalance_Score,Diet_Recommendation\n"
        "45,Female,72.5,165,26.6,Diabetes,Moderate,Moderate,2200,190.5,130,145.2,Low_Sugar,Gluten,Mexican,3.0,75.0,4.7,Low_Carb\n"
        "30,Male,80.0,175,26.1,None,Mild,Active,2400,180.0,125,110.0,None,None,Italian,5.0,88.0,1.5,Balanced\n"
        "58,Female,65.0,160,25.4,Hypertension,Moderate,Sedentary,2000,210.0,135,120.0,Low_Sodium,None,Chinese,1.5,60.0,3.0,Low_Sodium\n"
    )

    monkeypatch.setenv("ML_DATASET_PATH", str(dataset_path))
    monkeypatch.setenv("ML_MODEL_PATH", str(tmp_path / "model.joblib"))
    log_path = tmp_path / "recommendation_logs.json"
    monkeypatch.setenv("ML_DB_PATH", str(log_path))

    service = ModelService()
    result = service.train()
    assert result["trained"]
    assert Path(result["model_path"]).exists()
    assert "Low_Carb" in result["classes"] or "Balanced" in result["classes"]

    request = RecommendationRequest(
        age=45,
        gender="Female",
        weight_kg=72.5,
        height_cm=165,
        bmi=26.6,
        disease_type="Diabetes",
        severity="Moderate",
        physical_activity_level="Moderate",
        daily_caloric_intake=2200,
        cholesterol_mg_dL=190.5,
        blood_pressure_mmhg=130,
        glucose_mg_dL=145.2,
        dietary_restrictions="Low_Sugar",
        allergies="Gluten",
        preferred_cuisine="Mexican",
        weekly_exercise_hours=3.0,
        adherence_to_diet_plan=75.0,
        dietary_nutrient_imbalance_score=4.7,
    )

    prediction = service.predict(request.model_dump())
    assert prediction["recommended_plan"] in result["classes"]
    assert 0.0 <= prediction["confidence"] <= 1.0

    log = log_recommendation(request.model_dump(), prediction)
    logs = get_logs()
    assert len(logs) == 1
    assert logs[0]["response"]["recommended_plan"] == prediction["recommended_plan"]


def test_model_service_predict_without_model(tmp_path, monkeypatch):
    dataset_path = tmp_path / "diet_recommendations.csv"
    dataset_path.write_text(
        "Age,Gender,Weight_kg,Height_cm,BMI,Disease_Type,Severity,Physical_Activity_Level,Daily_Caloric_Intake,Cholesterol_mg/dL,Blood_Pressure_mmHg,Glucose_mg/dL,Dietary_Restrictions,Allergies,Preferred_Cuisine,Weekly_Exercise_Hours,Adherence_to_Diet_Plan,Dietary_Nutrient_Imbalance_Score,Diet_Recommendation\n"
        "45,Female,72.5,165,26.6,Diabetes,Moderate,Moderate,2200,190.5,130,145.2,Low_Sugar,Gluten,Mexican,3.0,75.0,4.7,Low_Carb\n"
    )
    monkeypatch.setenv("ML_DATASET_PATH", str(dataset_path))
    monkeypatch.setenv("ML_MODEL_PATH", str(tmp_path / "model.joblib"))

    service = ModelService()
    with pytest.raises(ValueError):
        service.predict({})
