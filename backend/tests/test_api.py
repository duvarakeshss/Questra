from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app import app
from models.schemas import MultimodalContext, QuerySuggestion, SearchResult

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "models_loaded" in data


def test_suggestions_no_input_fails():
    response = client.post("/api/query/suggestions", data={})
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "NO_INPUT"


@patch("api.routes_query.generate_candidates")
@patch("api.routes_query.score_candidates")
@patch("api.routes_query.select_diverse")
def test_suggestions_text_success(mock_diverse, mock_score, mock_gen):
    mock_gen.return_value = ["test query 1", "test query 2"]
    mock_score.return_value = [
        MagicMock(id="cand-1", query="test query 1", intent_score=0.9),
    ]
    mock_diverse.return_value = [
        QuerySuggestion(id="sug-1", query="test query 1", intent_score=0.9, diversity_rank=1),
    ]

    response = client.post("/api/query/suggestions", data={"text": "vintage mechanical keyboard"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["suggestions"]) == 1
    assert data["suggestions"][0]["query"] == "test query 1"
    assert data["context"]["text_input"] == "vintage mechanical keyboard"


def test_search_empty_query_fails():
    response = client.post("/api/search", json={"query": "   "})
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "EMPTY_QUERY"


@patch("api.routes_search.execute_search")
@patch("api.routes_search.rerank_results")
def test_search_success(mock_rerank, mock_search):
    mock_search.return_value = [
        {"title": "Result 1", "url": "https://example.com/1", "snippet": "Snippet 1", "thumbnail": None}
    ]
    mock_rerank.return_value = [
        SearchResult(title="Result 1", url="https://example.com/1", snippet="Snippet 1", score=0.95, thumbnail=None)
    ]

    response = client.post("/api/search", json={"query": "vintage mechanical keyboards"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["query"] == "vintage mechanical keyboards"
    assert len(data["results"]) == 1
    assert data["results"][0]["score"] == 0.95
