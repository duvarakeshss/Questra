import types

import pytest

from api import deps
from errors import UnauthorizedError
from services import supabase_client
from services.auth_service import AuthUser


class _Request:
    def __init__(self, headers=None, host="1.2.3.4"):
        self.headers = headers or {}
        self.client = types.SimpleNamespace(host=host)


def test_no_header_is_anonymous():
    assert deps.current_user(_Request()) is None


def test_invalid_token_raises(monkeypatch):
    monkeypatch.setattr(supabase_client, "is_configured", lambda: True)
    monkeypatch.setattr(deps, "get_user_from_token", lambda token: None)
    with pytest.raises(UnauthorizedError):
        deps.current_user(_Request({"authorization": "Bearer bad"}))


def test_valid_token_returns_user(monkeypatch):
    monkeypatch.setattr(supabase_client, "is_configured", lambda: True)
    monkeypatch.setattr(deps, "get_user_from_token", lambda token: AuthUser(id="u1", email="a@b.c"))
    user = deps.current_user(_Request({"authorization": "Bearer good"}))
    assert user is not None
    assert user.id == "u1"


def test_subject_prefers_anon_id():
    assert deps.client_subject(_Request({"x-anon-id": "abc"}), None) == "anon:abc"


def test_subject_falls_back_to_ip():
    assert deps.client_subject(_Request(), None) == "ip:1.2.3.4"


def test_subject_uses_user():
    assert deps.client_subject(_Request(), AuthUser(id="u1")) == "user:u1"
