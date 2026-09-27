import numpy as np

from models.schemas import QueryCandidate
from pipeline.diversity import select_diverse
from services.embedding_service import embedding_service


def _candidates():
    return [
        QueryCandidate(id="a", query="A", intent_score=0.9),
        QueryCandidate(id="b", query="B", intent_score=0.8),
        QueryCandidate(id="c", query="C", intent_score=0.7),
    ]


def _patch_embeddings(monkeypatch, mapping):
    monkeypatch.setattr(embedding_service, "embed", lambda texts: np.array([mapping[t] for t in texts], dtype=np.float32))


def test_returns_requested_count(monkeypatch):
    _patch_embeddings(monkeypatch, {"A": [1, 0], "B": [1, 0], "C": [0, 1]})
    result = select_diverse(_candidates(), count=2, lambda_=0.7)
    assert len(result) == 2
    assert [s.diversity_rank for s in result] == [1, 2]


def test_top_scored_is_first(monkeypatch):
    _patch_embeddings(monkeypatch, {"A": [1, 0], "B": [1, 0], "C": [0, 1]})
    result = select_diverse(_candidates(), count=3, lambda_=1.0)
    assert result[0].id == "a"


def test_lambda_one_is_pure_relevance(monkeypatch):
    _patch_embeddings(monkeypatch, {"A": [1, 0], "B": [1, 0], "C": [0, 1]})
    result = select_diverse(_candidates(), count=2, lambda_=1.0)
    assert [s.id for s in result] == ["a", "b"]


def test_lambda_zero_prefers_diversity(monkeypatch):
    _patch_embeddings(monkeypatch, {"A": [1, 0], "B": [1, 0], "C": [0, 1]})
    result = select_diverse(_candidates(), count=2, lambda_=0.0)
    assert result[0].id == "a"
    assert result[1].id == "c"


def test_empty_input_returns_empty():
    assert select_diverse([], count=5) == []


def test_count_larger_than_candidates(monkeypatch):
    _patch_embeddings(monkeypatch, {"A": [1, 0], "B": [0, 1], "C": [1, 1]})
    result = select_diverse(_candidates(), count=10)
    assert len(result) == 3
