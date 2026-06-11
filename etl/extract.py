"""
ETL - Extract Module
Extract data from various sources
"""
import pandas as pd
import os
from typing import Optional, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_from_csv(file_path: str) -> pd.DataFrame:
    """
    Extract data from CSV file
    
    Args:
        file_path: Path to CSV file
        
    Returns:
        DataFrame with extracted data
    """
    try:
        df = pd.read_csv(file_path, on_bad_lines='skip')
        logger.info(f"Extracted {len(df)} rows from {file_path}")
        return df
    except Exception as e:
        logger.error(f"Error extracting from CSV: {str(e)}")
        raise


def extract_from_excel(file_path: str, sheet_name: Optional[str] = None) -> pd.DataFrame:
    """
    Extract data from Excel file
    
    Args:
        file_path: Path to Excel file
        sheet_name: Name of the sheet to extract (optional)
        
    Returns:
        DataFrame with extracted data
    """
    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        logger.info(f"Extracted {len(df)} rows from {file_path}")
        return df
    except Exception as e:
        logger.error(f"Error extracting from Excel: {str(e)}")
        raise


def extract_from_api(api_url: str, params: Optional[dict] = None) -> pd.DataFrame:
    """
    Extract data from API endpoint
    
    Args:
        api_url: URL of the API endpoint
        params: Query parameters (optional)
        
    Returns:
        DataFrame with extracted data
    """
    try:
        import requests
        response = requests.get(api_url, params=params)
        response.raise_for_status()
        data = response.json()
        df = pd.DataFrame(data)
        logger.info(f"Extracted {len(df)} rows from API: {api_url}")
        return df
    except Exception as e:
        logger.error(f"Error extracting from API: {str(e)}")
        raise


def extract_exercises_from_exercisedb(limit: int = 100) -> pd.DataFrame:
    """
    Extract exercises from ExerciseDB API (https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
    
    Args:
        limit: Maximum number of exercises to extract
        
    Returns:
        DataFrame with exercises data
    """
    try:
        import requests
        
        # ExerciseDB API endpoint (free tier)
        base_url = "https://exercisedb.p.rapidapi.com/exercises"
        
        # Headers avec clé API (optionnel - peut fonctionner sans clé pour certaines routes)
        headers = {
            "X-RapidAPI-Key": os.getenv("RAPIDAPI_KEY", ""),  # Optionnel
            "X-RapidAPI-Host": "exercisedb.p.rapidapi.com"
        }
        
        # Essayer d'abord sans clé API (endpoint public)
        try:
            # Endpoint public alternatif
            public_url = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
            response = requests.get(public_url, timeout=30)
            response.raise_for_status()
            exercises = response.json()
            
            # Limiter le nombre d'exercices
            if limit and len(exercises) > limit:
                exercises = exercises[:limit]
            
            df = pd.DataFrame(exercises)
            logger.info(f"Extracted {len(df)} exercises from ExerciseDB (public source)")
            return df
            
        except Exception as e:
            logger.warning(f"Public source failed, trying RapidAPI: {str(e)}")
            # Fallback sur RapidAPI si disponible
            if os.getenv("RAPIDAPI_KEY"):
                response = requests.get(base_url, headers=headers, params={"limit": limit}, timeout=30)
                response.raise_for_status()
                exercises = response.json()
                df = pd.DataFrame(exercises)
                logger.info(f"Extracted {len(df)} exercises from ExerciseDB (RapidAPI)")
                return df
            else:
                raise ValueError("No API key provided and public source unavailable")
                
    except Exception as e:
        logger.error(f"Error extracting exercises from ExerciseDB: {str(e)}")
        raise

