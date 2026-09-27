from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from api.deps import client_subject, current_user
from app import app
from errors import QuotaExceededError
from models.schemas import QuerySuggestion, QuotaInfo
from services.auth_service import AuthUser

client = TestClient(app)


def _override_anon():
    app.dependency_overrides[current_user] = lambda: None
    app.dependency_overrides[client_subject] = lambda: "anon:test"


def _override_user():
    app.dependency_overrides[current_user] = lambda: AuthUser(id="u1", email="a@b.c")
    app.dependency_overrides[client_subject] = lambda: "user:u1"


def teardown_function():
    app.dependency_overrides.clear()


def _patch_pipeline(mock_diverse, mock_score, mock_gen):
    mock_gen.return_value = ["q1"]
    mock_score.return_value = [MagicMock(id="c1", query="q1", intent_score=0.9)]
    mock_diverse.return_value = [
        QuerySuggestion(id="c1", query="q1", intent_score=0.9, diversity_rank=1)
    ]


@patch("api.routes_query.generate_candidates")
@patch("api.routes_query.score_candidates")
@patch("api.routes_query.select_diverse")
@patch("services.quota_service.check_and_consume")
def test_anonymous_quota_included(mock_quota, mock_diverse, mock_score, mock_gen):
    _override_anon()
    _patch_pipeline(mock_diverse, mock_score, mock_gen)
    mock_quota.return_value = QuotaInfo(authenticated=False, limit=2, used=1, remaining=1)

    response = client.post("/api/query/suggestions", data={"text": "hello"})
    assert response.status_code == 200
    assert response.json()["quota"]["remaining"] == 1
    assert response.json()["quota"]["limit"] == 2


@patch("services.quota_service.check_and_consume")
def test_quota_exceeded_returns_429(mock_quota):
    _override_anon()
    mock_quota.side_effect = QuotaExceededError("limit reached")

    response = client.post("/api/query/suggestions", data={"text": "hello"})
    assert response.status_code == 429
    assert response.json()["error"]["code"] == "QUOTA_EXCEEDED"


@patch("api.routes_query.generate_candidates")
@patch("api.routes_query.score_candidates")
@patch("api.routes_query.select_diverse")
@patch("services.quota_service.check_and_consume")
def test_authenticated_is_unmetered(mock_quota, mock_diverse, mock_score, mock_gen):
    _override_user()
    _patch_pipeline(mock_diverse, mock_score, mock_gen)
    mock_quota.return_value = QuotaInfo(authenticated=True, limit=None, used=0, remaining=None)

    response = client.post("/api/query/suggestions", data={"text": "hello"})
    assert response.status_code == 200
    assert response.json()["quota"]["limit"] is None


@patch("services.quota_service.peek")
def test_me_anonymous(mock_peek):
    _override_anon()
    mock_peek.return_value = QuotaInfo(authenticated=False, limit=2, used=0, remaining=2)

    response = client.get("/api/me")
    assert response.status_code == 200
    body = response.json()
    assert body["authenticated"] is False
    assert body["quota"]["remaining"] == 2


@patch("services.quota_service.peek")
def test_me_authenticated(mock_peek):
    _override_user()
    mock_peek.return_value = QuotaInfo(authenticated=True, limit=None, used=0, remaining=None)

    response = client.get("/api/me")
    assert response.status_code == 200
    body = response.json()
    assert body["authenticated"] is True
    assert body["email"] == "a@b.c"
