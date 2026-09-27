import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))


@pytest.fixture(autouse=True)
def _isolate_supabase(monkeypatch):
    """Keep tests hermetic: never touch a real Supabase project, even if .env has keys."""
    from services import supabase_client

    monkeypatch.setattr(supabase_client, "is_configured", lambda: False)
    monkeypatch.setattr(supabase_client, "admin_client", lambda: None)
    monkeypatch.setattr(supabase_client, "public_client", lambda: None)
