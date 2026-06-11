"""
ETL - Transform Module
Transform and clean data
"""
import ast
import pandas as pd
import logging
from typing import Dict, List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_PRENOMS_M = ["Thomas", "Nicolas", "Julien", "Alexandre", "Pierre", "Antoine", "Maxime", "Romain", "Lucas", "Hugo",
              "Mathieu", "Quentin", "Clément", "Adrien", "Baptiste", "Florian", "Guillaume", "Kevin", "Yann", "Sébastien"]
_PRENOMS_F = ["Marie", "Sophie", "Julie", "Camille", "Laura", "Lucie", "Emma", "Léa", "Manon", "Chloé",
              "Pauline", "Élodie", "Clara", "Inès", "Charlotte", "Alice", "Sarah", "Anaïs", "Océane", "Marion"]
_NOMS = ["Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Dubois", "Moreau", "Laurent",
         "Simon", "Michel", "Lefebvre", "Leroy", "Roux", "David", "Bertrand", "Morel", "Fournier", "Girard"]


def _get_prenom(sexe: str, index: int) -> str:
    if sexe == "F":
        return _PRENOMS_F[index % len(_PRENOMS_F)]
    return _PRENOMS_M[index % len(_PRENOMS_M)]


def _get_nom(index: int) -> str:
    return _NOMS[index % len(_NOMS)]


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean data: remove duplicates, handle missing values
    
    Args:
        df: Input DataFrame
        
    Returns:
        Cleaned DataFrame
    """
    try:
        # Convertir les listes en strings pour permettre drop_duplicates
        for col in df.columns:
            if df[col].dtype == 'object':
                # Vérifier si la colonne contient des listes
                if df[col].apply(lambda x: isinstance(x, list)).any():
                    df[col] = df[col].apply(lambda x: str(x) if isinstance(x, list) else x)
        
        # Remove duplicates (seulement sur les colonnes qui ne sont pas des listes)
        # Identifier les colonnes avec des types hashables
        hashable_cols = [col for col in df.columns if df[col].dtype != 'object' or not df[col].apply(lambda x: isinstance(x, (list, dict))).any()]
        
        if hashable_cols:
            df = df.drop_duplicates(subset=hashable_cols)
        else:
            # Si toutes les colonnes contiennent des listes, on ne fait pas de drop_duplicates
            logger.warning("All columns contain unhashable types, skipping drop_duplicates")
        
        # Remove rows with all NaN
        df = df.dropna(how='all')
        
        logger.info(f"Cleaned data: {len(df)} rows remaining")
        return df
    except Exception as e:
        logger.error(f"Error cleaning data: {str(e)}")
        raise


def normalize_columns(df: pd.DataFrame, column_mapping: Dict[str, str]) -> pd.DataFrame:
    """
    Normalize column names
    
    Args:
        df: Input DataFrame
        column_mapping: Dictionary mapping old names to new names
        
    Returns:
        DataFrame with normalized columns
    """
    try:
        df = df.rename(columns=column_mapping)
        logger.info(f"Normalized columns: {list(column_mapping.values())}")
        return df
    except Exception as e:
        logger.error(f"Error normalizing columns: {str(e)}")
        raise


def validate_data(df: pd.DataFrame, required_columns: List[str]) -> bool:
    """
    Validate that required columns exist
    
    Args:
        df: Input DataFrame
        required_columns: List of required column names
        
    Returns:
        True if validation passes, False otherwise
    """
    try:
        missing_columns = set(required_columns) - set(df.columns)
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return False
        logger.info("Data validation passed")
        return True
    except Exception as e:
        logger.error(f"Error validating data: {str(e)}")
        return False


def transform_data(df: pd.DataFrame, transformations: Optional[Dict] = None) -> pd.DataFrame:
    """
    Apply transformations to data
    
    Args:
        df: Input DataFrame
        transformations: Dictionary of transformations to apply
        
    Returns:
        Transformed DataFrame
    """
    try:
        # Apply custom transformations here
        # Example: df['new_column'] = df['old_column'].apply(some_function)
        
        if transformations:
            for transformation in transformations:
                # Apply transformation logic
                pass
        
        logger.info(f"Transformed data: {len(df)} rows")
        return df
    except Exception as e:
        logger.error(f"Error transforming data: {str(e)}")
        raise


def transform_exercises_from_exercisedb(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform ExerciseDB API data to match our schema
    
    Args:
        df: DataFrame from ExerciseDB API
        
    Returns:
        Transformed DataFrame matching our exercices table schema
    """
    try:
        # Créer un nouveau DataFrame avec les colonnes mappées
        result = pd.DataFrame()
        
        # Mapper les colonnes existantes
        if 'name' in df.columns:
            result['nom'] = df['name']
        
        if 'type' in df.columns:
            result['type'] = df['type']
        elif 'bodyPart' in df.columns:
            # Utiliser bodyPart comme type si type n'existe pas
            result['type'] = df['bodyPart']
        
        if 'target' in df.columns:
            result['groupe_musculaire'] = df['target']
        elif 'muscle' in df.columns:
            result['groupe_musculaire'] = df['muscle']
        
        if 'difficulty' in df.columns:
            result['niveau'] = df['difficulty']
        
        if 'equipment' in df.columns:
            result['equipement'] = df['equipment']
        
        if 'instructions' in df.columns:
            # Instructions peut être une liste, on la convertit en string
            result['instructions'] = df['instructions'].apply(
                lambda x: ', '.join(x) if isinstance(x, list) else str(x) if x else None
            )
        
        # Ajouter la description
        if 'name' in df.columns:
            result['description'] = df['name'].apply(lambda x: f"Exercice: {x}")
        
        # Normaliser le type d'exercice (si la colonne existe)
        if 'type' in result.columns:
            result['type'] = result['type'].astype(str).str.lower().replace({
                'strength': 'force',
                'cardio': 'cardio',
                'stretching': 'flexibilite',
                'powerlifting': 'force',
                'strongman': 'force',
                'olympic_weightlifting': 'force',
                'chest': 'force',
                'back': 'force',
                'shoulders': 'force',
                'arms': 'force',
                'legs': 'force'
            })
        else:
            # Valeur par défaut si type n'existe pas
            result['type'] = 'autre'
        
        # Normaliser le niveau (si la colonne existe)
        if 'niveau' in result.columns:
            result['niveau'] = result['niveau'].astype(str).str.lower().replace({
                'beginner': 'debutant',
                'intermediate': 'intermediaire',
                'expert': 'avance',
                'advanced': 'avance'
            })
        else:
            # Valeur par défaut si niveau n'existe pas
            result['niveau'] = 'debutant'
        
        # Normaliser l'équipement (si la colonne existe)
        if 'equipement' in result.columns:
            result['equipement'] = result['equipement'].astype(str).str.lower().replace({
                'body weight': 'aucun',
                'none': 'aucun',
                '': 'aucun',
                'dumbbell': 'haltères',
                'barbell': 'barre',
                'cable': 'câble',
                'machine': 'machine'
            })
        else:
            # Valeur par défaut si equipement n'existe pas
            result['equipement'] = 'aucun'
        
        # S'assurer que groupe_musculaire existe
        if 'groupe_musculaire' not in result.columns:
            result['groupe_musculaire'] = None
        
        # Ajouter la source
        result['source'] = 'ExerciseDB API'
        
        # Remplacer les valeurs NaN par None
        result = result.where(pd.notna(result), None)
        
        logger.info(f"Transformed {len(result)} exercises")
        return result
        
    except Exception as e:
        logger.error(f"Error transforming exercises: {str(e)}")
        raise


def restore_list_columns(df: pd.DataFrame, list_columns: List[str]) -> pd.DataFrame:
    """
    Restaure les colonnes contenant des listes qui ont été converties en strings
    par clean_data (nécessaire pour les colonnes PostgreSQL de type TEXT[]).
    """
    for col in list_columns:
        if col in df.columns:
            df[col] = df[col].apply(
                lambda x: ast.literal_eval(x)
                if isinstance(x, str) and x.startswith('[')
                else x
            )
    return df


def transform_nutrition_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform 'Daily Food & Nutrition Dataset' (Kaggle) to aliments schema.
    Colonnes source : Food_Item, Category, Calories (kcal), Protein (g),
                      Carbohydrates (g), Fat (g), Fiber (g), Sugars (g),
                      Sodium (mg), Cholesterol (mg), Meal_Type, Water_Intake (ml)
    """
    try:
        result = pd.DataFrame()
        result['nom'] = df['Food_Item'].astype(str).str.strip()
        result['calories'] = pd.to_numeric(df['Calories (kcal)'], errors='coerce').fillna(0.0)
        result['proteines'] = pd.to_numeric(df['Protein (g)'], errors='coerce').fillna(0.0)
        result['glucides'] = pd.to_numeric(df['Carbohydrates (g)'], errors='coerce').fillna(0.0)
        result['lipides'] = pd.to_numeric(df['Fat (g)'], errors='coerce').fillna(0.0)
        result['fibres'] = pd.to_numeric(df['Fiber (g)'], errors='coerce').fillna(0.0)
        result['unite'] = '100g'
        result['source'] = 'Kaggle - Daily Food & Nutrition Dataset'
        result = result.dropna(subset=['nom'])
        result = result[result['nom'] != '']
        result = result.where(pd.notna(result), None)
        logger.info(f"Transformed {len(result)} foods from nutrition dataset")
        return result
    except Exception as e:
        logger.error(f"Error transforming nutrition dataset: {str(e)}")
        raise


def transform_gym_members_to_utilisateurs(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform 'Gym Members Exercise Dataset' (Kaggle) to utilisateurs schema.
    Colonnes source : Age, Gender, Weight (kg), Height (m), Max_BPM, Avg_BPM,
                      Resting_BPM, Session_Duration (hours), Calories_Burned,
                      Workout_Type, Fat_Percentage, BMI, Experience_Level
    """
    try:
        result = pd.DataFrame()
        # Générer des emails uniques reproductibles (évite les doublons lors d'upsert)
        result['email'] = [f"gym.member.{i:04d}@healthai.com" for i in range(len(df))]
        result['age'] = pd.to_numeric(df['Age'], errors='coerce').astype('Int64')
        result['sexe'] = df['Gender'].map({'Male': 'M', 'Female': 'F'}).fillna('Autre')
        result['prenom'] = [_get_prenom(s, i) for i, s in enumerate(result['sexe'])]
        result['nom'] = [_get_nom(i) for i in range(len(df))]
        result['poids'] = pd.to_numeric(df['Weight (kg)'], errors='coerce').round(2)
        # Hauteur en mètres → cm
        result['taille'] = (pd.to_numeric(df['Height (m)'], errors='coerce') * 100).round(2)
        result['type_abonnement'] = df['Experience_Level'].map({
            1: 'freemium',
            2: 'freemium',
            3: 'premium',
        }).fillna('freemium')
        result['objectifs'] = df['Workout_Type'].apply(
            lambda x: [f"Entraînement: {x}"] if pd.notna(x) else ['fitness']
        )
        result = result.where(pd.notna(result), None)
        logger.info(f"Transformed {len(result)} utilisateurs from gym members dataset")
        return result
    except Exception as e:
        logger.error(f"Error transforming gym members to utilisateurs: {str(e)}")
        raise


def transform_gym_members_to_mesures(df: pd.DataFrame, email_to_id: dict) -> pd.DataFrame:
    """
    Transform 'Gym Members Exercise Dataset' to mesures_biometriques schema.
    Requires email_to_id dict {email: uuid} to link mesures to utilisateurs.
    """
    try:
        result = pd.DataFrame()
        emails = [f"gym.member.{i:04d}@healthai.com" for i in range(len(df))]
        result['id_utilisateur'] = [email_to_id.get(e) for e in emails]
        result['poids'] = pd.to_numeric(df['Weight (kg)'], errors='coerce').round(2)
        result['frequence_cardiaque'] = pd.to_numeric(df['Avg_BPM'], errors='coerce').astype('Int64')
        result['calories_brulees'] = pd.to_numeric(df['Calories_Burned'], errors='coerce').round(2)
        result['sommeil'] = None  # non disponible dans ce dataset
        # Supprimer les lignes sans utilisateur lié
        result = result.dropna(subset=['id_utilisateur'])
        result = result.where(pd.notna(result), None)
        logger.info(f"Transformed {len(result)} mesures from gym members dataset")
        return result
    except Exception as e:
        logger.error(f"Error transforming gym members to mesures: {str(e)}")
        raise


def transform_diet_reco_to_utilisateurs(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform 'Diet Recommendations Dataset' (Kaggle) to utilisateurs schema.
    Colonnes source : Patient_ID, Age, Gender, Weight_kg, Height_cm, BMI,
                      Disease_Type, Severity, Diet_Recommendation, ...
    """
    try:
        result = pd.DataFrame()
        result['email'] = df['Patient_ID'].astype(str).str.lower().apply(
            lambda x: f"{x}@healthai.com"
        )
        result['age'] = pd.to_numeric(df['Age'], errors='coerce').astype('Int64')
        result['sexe'] = df['Gender'].map({'Male': 'M', 'Female': 'F'}).fillna('Autre')
        result['prenom'] = [_get_prenom(s, i) for i, s in enumerate(result['sexe'])]
        result['nom'] = [_get_nom(i) for i in range(len(df))]
        result['poids'] = pd.to_numeric(df['Weight_kg'], errors='coerce').round(2)
        result['taille'] = pd.to_numeric(df['Height_cm'], errors='coerce').round(2)
        result['type_abonnement'] = df['Severity'].map({
            'Mild': 'freemium',
            'Moderate': 'premium',
            'Severe': 'premium+',
        }).fillna('freemium')
        result['objectifs'] = df.apply(
            lambda row: [str(row['Diet_Recommendation'])] if pd.notna(row.get('Diet_Recommendation')) else ['santé'],
            axis=1
        )
        result = result.dropna(subset=['email'])
        result = result.where(pd.notna(result), None)
        logger.info(f"Transformed {len(result)} utilisateurs from diet recommendations dataset")
        return result
    except Exception as e:
        logger.error(f"Error transforming diet recommendations to utilisateurs: {str(e)}")
        raise


def transform_foods_from_csv(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform food/nutrition CSV data to match our schema
    
    Args:
        df: DataFrame from CSV file
        
    Returns:
        Transformed DataFrame matching our aliments table schema
    """
    try:
        # Mapping possible des colonnes CSV vers notre schéma
        # (à adapter selon le format du CSV)
        result = pd.DataFrame()
        
        # Colonnes possibles dans les datasets nutritionnels
        column_mapping = {
            'name': 'nom',
            'food_name': 'nom',
            'Food': 'nom',
            'calories': 'calories',
            'Calories': 'calories',
            'protein': 'proteines',
            'Protein': 'proteines',
            'proteins': 'proteines',
            'carbohydrate': 'glucides',
            'Carbohydrate': 'glucides',
            'carbs': 'glucides',
            'fat': 'lipides',
            'Fat': 'lipides',
            'fats': 'lipides',
            'fiber': 'fibres',
            'Fiber': 'fibres',
            'fibers': 'fibres',
            'unit': 'unite',
            'Unit': 'unite'
        }
        
        # Mapper les colonnes
        for old_col, new_col in column_mapping.items():
            if old_col in df.columns:
                result[new_col] = df[old_col]
        
        # Valeurs par défaut si manquantes
        if 'calories' not in result.columns:
            result['calories'] = 0.0
        if 'proteines' not in result.columns:
            result['proteines'] = 0.0
        if 'glucides' not in result.columns:
            result['glucides'] = 0.0
        if 'lipides' not in result.columns:
            result['lipides'] = 0.0
        if 'fibres' not in result.columns:
            result['fibres'] = 0.0
        if 'unite' not in result.columns:
            result['unite'] = '100g'
        
        # Ajouter la source
        result['source'] = 'Kaggle Dataset'
        
        # Remplacer les valeurs NaN
        result = result.where(pd.notna(result), None)
        
        # S'assurer que les valeurs numériques sont des floats
        numeric_cols = ['calories', 'proteines', 'glucides', 'lipides', 'fibres']
        for col in numeric_cols:
            if col in result.columns:
                result[col] = pd.to_numeric(result[col], errors='coerce').fillna(0.0)
        
        logger.info(f"Transformed {len(result)} foods")
        return result
        
    except Exception as e:
        logger.error(f"Error transforming foods: {str(e)}")
        raise

