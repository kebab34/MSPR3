import os
from supabase import Client, create_client

def get_supabase_admin() -> Client :
    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()
    if not url or not key:
        raise RuntimeError("SUPABASE_URL ou SUPABASE_SERVICE_KEY manquant")
    return create_client(url, key)
