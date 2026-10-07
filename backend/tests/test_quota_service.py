import pytest

from errors import QuotaExceededError
from services import quota_service, supabase_client


class _Response:
    def __init__(self, count):
        self.count = count


class _Query:
    def __init__(self, state):
        self.state = state

    def select(self, *args, **kwargs):
        return self

    def eq(self, *args, **kwargs):
        return self

    def gte(self, *args, **kwargs):
        return self

    def insert(self, payload):
        self.state["inserted"].append(payload)
        return self

    def execute(self):
        return _Response(self.state["count"])


class _Client:
    def __init__(self, count):
        self.state = {"count": count, "inserted": []}

    def table(self, name):
        return _Query(self.state)


def _use_supabase(monkeypatch, count):
    client = _Client(count)
    monkeypatch.setattr(supabase_client, "admin_client", lambda: client)
    return client


# ── Supabase store (fake client) ────────────────────────────────────────────

def test_consumes_and_reports_remaining(monkeypatch):
    client = _use_supabase(monkeypatch, count=0)
    quota = quota_service.check_and_consume("anon:x", 2)
    assert (quota.limit, quota.used, quota.remaining) == (2, 1, 1)
    assert client.state["inserted"] == [{"subject": "anon:x"}]


def test_blocks_when_limit_reached(monkeypatch):
    _use_supabase(monkeypatch, count=2)
    with pytest.raises(QuotaExceededError):
        quota_service.check_and_consume("anon:x", 2)


def test_authenticated_is_unmetered(monkeypatch):
    _use_supabase(monkeypatch, count=99)
    quota = quota_service.check_and_consume("user:1", None, authenticated=True)
    assert quota.limit is None
    assert quota.authenticated is True


def test_peek_reports_without_consuming(monkeypatch):
    client = _use_supabase(monkeypatch, count=1)
    quota = quota_service.peek("anon:x", 2, authenticated=False)
    assert (quota.used, quota.remaining) == (1, 1)
    assert client.state["inserted"] == []


# ── Unmetered when Supabase is unavailable (cleared by the autouse fixture) ──

def test_runs_unmetered_when_supabase_unconfigured():
    first = quota_service.check_and_consume("anon:offline", 2)
    assert (first.limit, first.used, first.remaining) == (2, 0, 2)

    second = quota_service.check_and_consume("anon:offline", 2)
    assert second.remaining == 2


def test_peek_is_full_when_supabase_unconfigured():
    quota = quota_service.peek("anon:offline", 2, authenticated=False)
    assert (quota.used, quota.remaining) == (0, 2)


def test_runs_unmetered_when_supabase_errors(monkeypatch):
    class _Broken:
        def table(self, name):
            raise RuntimeError("table missing")

    monkeypatch.setattr(supabase_client, "admin_client", lambda: _Broken())
    quota = quota_service.check_and_consume("anon:boom", 2)
    assert (quota.limit, quota.used, quota.remaining) == (2, 0, 2)
