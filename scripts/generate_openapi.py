"""
Génère docs/openapi.json à partir du schéma FastAPI de l'API principale
et docs/openapi_ml.json pour le microservice IA.

Usage :
    python scripts/generate_openapi.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
DOCS.mkdir(exist_ok=True)

# ── API principale ────────────────────────────────────────────────────────────
sys.path.insert(0, str(ROOT / "api"))
from app.main import app as main_app  # noqa: E402

schema_main = main_app.openapi()
out_main = DOCS / "openapi.json"
out_main.write_text(json.dumps(schema_main, indent=2, ensure_ascii=False))
print(f"✅  API principale → {out_main}")

# ── Microservice IA ───────────────────────────────────────────────────────────
sys.path.insert(0, str(ROOT))
import importlib, types

# Chargement du package ml_service avec import absolu
ml_pkg = importlib.import_module("ml_service.main")
ml_app = ml_pkg.app

schema_ml = ml_app.openapi()
out_ml = DOCS / "openapi_ml.json"
out_ml.write_text(json.dumps(schema_ml, indent=2, ensure_ascii=False))
print(f"✅  Microservice IA → {out_ml}")
