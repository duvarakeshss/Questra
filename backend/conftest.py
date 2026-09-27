import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))


@pytest.fixture(autouse=True)
def _isolate_supabase(monkeypatch, tmp_path):
    """Keep tests hermetic: no real Supabase, and a throwaway quota database per test."""
    from config.settings import settings
    from services import supabase_client

    monkeypatch.setattr(supabase_client, "is_configured", lambda: False)
    monkeypatch.setattr(supabase_client, "admin_client", lambda: None)
    monkeypatch.setattr(supabase_client, "public_client", lambda: None)
    monkeypatch.setattr(settings, "quota_db_path", str(tmp_path / "quota.sqlite3"))
