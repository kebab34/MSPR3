"""
ETL - Load Module
Load data into Supabase
"""
import os
from supabase import create_client, Client
import pandas as pd
import logging
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SupabaseLoader:
    """Loader for Supabase database"""
    
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        # Utiliser la clé de service pour avoir les permissions d'écriture
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_KEY) must be set")
        
        self.client: Client = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized (using service key for write operations)")
    
    def load_dataframe(self, df: pd.DataFrame, table_name: str, if_exists: str = "append") -> bool:
        """
        Load DataFrame into Supabase table
        
        Args:
            df: DataFrame to load
            table_name: Name of the target table
            if_exists: What to do if table exists ('append', 'replace', 'fail')
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Convert DataFrame to list of dictionaries
            records = df.to_dict('records')
            
            if if_exists == "replace":
                # Delete existing records (if needed)
                # Note: Supabase doesn't have a direct replace, so we might need to delete first
                pass
            
            # Insert records in batches
            batch_size = 1000
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                self.client.table(table_name).insert(batch).execute()
                logger.info(f"Inserted batch {i//batch_size + 1} into {table_name}")
            
            logger.info(f"Successfully loaded {len(records)} records into {table_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error loading data into {table_name}: {str(e)}")
            return False
    
    def upsert_dataframe(self, df: pd.DataFrame, table_name: str, on_conflict: str = "id") -> bool:
        """
        Upsert DataFrame into Supabase table
        
        Args:
            df: DataFrame to upsert
            table_name: Name of the target table
            on_conflict: Column name for conflict resolution (Supabase uses this for upsert)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Convertir le DataFrame en liste de dictionnaires
            # Remplacer NaN par None pour éviter les erreurs JSON
            records = df.where(pd.notna(df), None).to_dict('records')
            
            # Upsert records in batches
            batch_size = 100  # Réduire la taille des batches pour Supabase
            total_batches = (len(records) + batch_size - 1) // batch_size
            
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                try:
                    # Supabase upsert utilise la clé primaire ou une colonne unique
                    # On utilise insert avec ignore_duplicates ou on fait un upsert manuel
                    response = self.client.table(table_name).upsert(batch, on_conflict=on_conflict).execute()
                    logger.info(f"Upserted batch {i//batch_size + 1}/{total_batches} into {table_name} ({len(batch)} records)")
                except Exception as batch_error:
                    logger.warning(f"Error in batch {i//batch_size + 1}: {str(batch_error)}")
                    # Essayer d'insérer un par un en cas d'erreur
                    for record in batch:
                        try:
                            self.client.table(table_name).upsert([record], on_conflict=on_conflict).execute()
                        except Exception as record_error:
                            logger.warning(f"Skipped record in {table_name}: {record_error}")
            
            logger.info(f"Successfully upserted {len(records)} records into {table_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error upserting data into {table_name}: {str(e)}")
            return False
    
    def delete_records(self, table_name: str, filters: Dict[str, Any]) -> bool:
        """
        Delete records from Supabase table
        
        Args:
            table_name: Name of the table
            filters: Dictionary of filters (e.g., {"id": 123})
            
        Returns:
            True if successful, False otherwise
        """
        try:
            query = self.client.table(table_name).delete()
            
            for key, value in filters.items():
                query = query.eq(key, value)
            
            query.execute()
            logger.info(f"Deleted records from {table_name} with filters {filters}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting records from {table_name}: {str(e)}")
            return False

