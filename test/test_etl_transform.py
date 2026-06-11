"""
Tests unitaires pour le module ETL transform.
"""

import pytest
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "etl"))

from transform import (
    clean_data,
    normalize_columns,
    validate_data,
    transform_exercises_from_exercisedb,
    transform_nutrition_dataset,
    transform_gym_members_to_utilisateurs,
    restore_list_columns,
)


class TestCleanData:
    def test_removes_duplicates(self):
        df = pd.DataFrame({"a": [1, 1, 2], "b": ["x", "x", "y"]})
        result = clean_data(df)
        assert len(result) == 2

    def test_removes_all_nan_rows(self):
        df = pd.DataFrame({"a": [1, None], "b": ["x", None]})
        result = clean_data(df)
        assert len(result) == 1

    def test_handles_list_columns(self):
        df = pd.DataFrame({"a": [1, 2], "tags": [["a", "b"], ["c"]]})
        result = clean_data(df)
        assert len(result) == 2


class TestNormalizeColumns:
    def test_renames_columns(self):
        df = pd.DataFrame({"old_name": [1]})
        result = normalize_columns(df, {"old_name": "new_name"})
        assert "new_name" in result.columns
        assert "old_name" not in result.columns


class TestValidateData:
    def test_valid_columns(self):
        df = pd.DataFrame({"a": [1], "b": [2]})
        assert validate_data(df, ["a", "b"]) is True

    def test_missing_columns(self):
        df = pd.DataFrame({"a": [1]})
        assert validate_data(df, ["a", "b"]) is False


class TestTransformExercisesFromExerciseDB:
    def test_basic_transform(self):
        df = pd.DataFrame({
            "name": ["Push Up", "Squat"],
            "bodyPart": ["chest", "legs"],
            "target": ["pectorals", "quads"],
            "equipment": ["body weight", "barbell"],
        })
        result = transform_exercises_from_exercisedb(df)
        assert len(result) == 2
        assert "nom" in result.columns
        assert "groupe_musculaire" in result.columns
        assert result.iloc[0]["nom"] == "Push Up"

    def test_missing_columns_handled(self):
        df = pd.DataFrame({"name": ["Curl"]})
        result = transform_exercises_from_exercisedb(df)
        assert len(result) == 1
        assert result.iloc[0]["type"] == "autre"
        assert result.iloc[0]["niveau"] == "debutant"


class TestTransformNutritionDataset:
    def test_basic_transform(self):
        df = pd.DataFrame({
            "Food_Item": ["Apple", "Banana"],
            "Calories (kcal)": [52, 89],
            "Protein (g)": [0.3, 1.1],
            "Carbohydrates (g)": [14, 23],
            "Fat (g)": [0.2, 0.3],
            "Fiber (g)": [2.4, 2.6],
        })
        result = transform_nutrition_dataset(df)
        assert len(result) == 2
        assert result.iloc[0]["nom"] == "Apple"
        assert result.iloc[0]["calories"] == 52.0


class TestTransformGymMembers:
    def test_basic_transform(self):
        df = pd.DataFrame({
            "Age": [25, 30],
            "Gender": ["Male", "Female"],
            "Weight (kg)": [80, 60],
            "Height (m)": [1.80, 1.65],
            "Experience_Level": [1, 3],
            "Workout_Type": ["Strength", "Cardio"],
        })
        result = transform_gym_members_to_utilisateurs(df)
        assert len(result) == 2
        assert result.iloc[0]["sexe"] == "M"
        assert result.iloc[1]["sexe"] == "F"
        assert result.iloc[0]["taille"] == 180.0
        assert result.iloc[1]["type_abonnement"] == "premium"


class TestRestoreListColumns:
    def test_restores_lists(self):
        df = pd.DataFrame({"tags": ["['a', 'b']", "['c']"]})
        result = restore_list_columns(df, ["tags"])
        assert result.iloc[0]["tags"] == ["a", "b"]
