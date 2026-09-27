import pytest

from config.settings import settings
from errors import EmptyQueryError, SearchError
from pipeline.search import execute_search
from services import search_service as search_service_module
from services.search_service import SearchService, search_service


class _FakeGoogleSearch:
    payload: dict = {}

    def __init__(self, params):
        self.params = params

    def get_dict(self):
        return self.payload


def test_normalizes_organic_results(monkeypatch):
    _FakeGoogleSearch.payload = {
        "organic_results": [
            {"title": "T1", "link": "https://a", "snippet": "S1", "thumbnail": "https://img"},
            {"title": "T2", "link": "https://b", "snippet": "S2"},
            {"title": "no link", "snippet": "S3"},
        ]
    }
    monkeypatch.setattr(search_service_module, "GoogleSearch", _FakeGoogleSearch)
    monkeypatch.setattr(settings, "serpapi_api_key", "test-key")

    results = SearchService().search("query", 10)
    assert [r["url"] for r in results] == ["https://a", "https://b"]
    assert results[0]["thumbnail"] == "https://img"
    assert results[1]["thumbnail"] is None


def test_empty_results(monkeypatch):
    _FakeGoogleSearch.payload = {"organic_results": []}
    monkeypatch.setattr(search_service_module, "GoogleSearch", _FakeGoogleSearch)
    monkeypatch.setattr(settings, "serpapi_api_key", "test-key")
    assert SearchService().search("query", 10) == []


def test_api_error_raises_search_error(monkeypatch):
    monkeypatch.setattr(settings, "serpapi_api_key", "test-key")

    class _Boom:
        def __init__(self, params):
            pass

        def get_dict(self):
            raise RuntimeError("network down")

    monkeypatch.setattr(search_service_module, "GoogleSearch", _Boom)
    with pytest.raises(SearchError):
        SearchService().search("query", 10)


def test_missing_api_key_raises(monkeypatch):
    monkeypatch.setattr(settings, "serpapi_api_key", "")
    with pytest.raises(SearchError):
        SearchService().search("query", 10)


def test_execute_search_rejects_empty_query():
    with pytest.raises(EmptyQueryError):
        execute_search("   ")


def test_execute_search_delegates(monkeypatch):
    captured = {}

    def fake_search(query, num_results):
        captured["query"] = query
        captured["num"] = num_results
        return [{"title": "t"}]

    monkeypatch.setattr(search_service, "search", fake_search)
    result = execute_search("hello world", top_k=7)
    assert captured == {"query": "hello world", "num": 7}
    assert result == [{"title": "t"}]
