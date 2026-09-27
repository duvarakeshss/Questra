import numpy as np

from pipeline.rerank import rerank_results
from services.embedding_service import embedding_service


def _patch(monkeypatch, mapping):
    monkeypatch.setattr(embedding_service, "embed", lambda texts: np.array([mapping[t] for t in texts], dtype=np.float32))


def test_orders_by_similarity(monkeypatch):
    _patch(
        monkeypatch,
        {
            "query": [1, 0],
            "s1": [1, 0],
            "s2": [0, 1],
            "s3": [0.6, 0.8],
        },
    )
    results = [
        {"title": "one", "url": "u1", "snippet": "s1"},
        {"title": "two", "url": "u2", "snippet": "s2"},
        {"title": "three", "url": "u3", "snippet": "s3"},
    ]
    reranked = rerank_results("query", results, top_k=3)
    assert [r.url for r in reranked] == ["u1", "u3", "u2"]
    assert reranked[0].score > reranked[-1].score


def test_empty_results_returns_empty():
    assert rerank_results("query", []) == []


def test_missing_snippet_falls_back_to_title(monkeypatch):
    _patch(monkeypatch, {"query": [1, 0], "Title": [1, 0]})
    results = [{"title": "Title", "url": "u1", "snippet": ""}]
    reranked = rerank_results("query", results, top_k=1)
    assert len(reranked) == 1
    assert reranked[0].title == "Title"


def test_respects_top_k(monkeypatch):
    _patch(monkeypatch, {"query": [1, 0], "a": [1, 0], "b": [0, 1]})
    results = [
        {"title": "a", "url": "u1", "snippet": "a"},
        {"title": "b", "url": "u2", "snippet": "b"},
    ]
    assert len(rerank_results("query", results, top_k=1)) == 1
