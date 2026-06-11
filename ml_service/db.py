import os
from pathlib import Path
from datetime import datetime
from tinydb import TinyDB


def get_db_path() -> Path:
    path = Path(os.getenv("ML_DB_PATH", Path(__file__).resolve().parent / "data" / "recommendation_logs.json"))
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def get_db() -> TinyDB:
    return TinyDB(get_db_path())


def log_recommendation(request_data: dict, response_data: dict, user_email: str | None = None) -> dict:
    db = get_db()
    logs_table = db.table("recommendations")
    record = {
        "request": request_data,
        "response": response_data,
        "user_email": user_email,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    logs_table.insert(record)
    db.close()
    return record


def get_logs() -> list[dict]:
    db = get_db()
    logs_table = db.table("recommendations")
    logs = logs_table.all()
    db.close()
    return logs
