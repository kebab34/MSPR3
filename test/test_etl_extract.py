"""
Tests unitaires pour le module ETL extract.
"""

import pytest
import pandas as pd
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "etl"))

from extract import extract_from_csv, extract_from_excel


class TestExtractFromCSV:
    def test_extract_valid_csv(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write("name,calories\nApple,52\nBanana,89\n")
            f.flush()
            df = extract_from_csv(f.name)
        os.unlink(f.name)
        assert len(df) == 2
        assert "name" in df.columns

    def test_extract_csv_with_bad_lines(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write("a,b\n1,2\n3,4,5\n6,7\n")
            f.flush()
            df = extract_from_csv(f.name)
        os.unlink(f.name)
        assert len(df) >= 2

    def test_extract_nonexistent_file_raises(self):
        with pytest.raises(Exception):
            extract_from_csv("/tmp/nonexistent_file_12345.csv")


class TestExtractFromExcel:
    def test_extract_valid_excel(self):
        df_source = pd.DataFrame({"col1": [1, 2], "col2": ["a", "b"]})
        with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as f:
            df_source.to_excel(f.name, index=False)
            df = extract_from_excel(f.name, sheet_name=0)
        os.unlink(f.name)
        assert len(df) == 2
