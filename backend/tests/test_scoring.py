import pytest

from errors import LLMError, ScoringFailedError
from pipeline.scoring import MIN_INTENT_SCORE, score_candidates
from services.llm_service import llm_service


@pytest.fixture
def context():
    from pipeline.fusion import fuse_modalities

    return fuse_modalities(text_input="under 5000")


def test_scores_aligned_with_queries(monkeypatch, context):
    monkeypatch.setattr(
        llm_service,
        "complete_json",
        lambda messages, **kwargs: {"scores": [0.9, 0.8]},
    )
    candidates = score_candidates(context, ["q1", "q2"])
    assert [c.query for c in candidates] == ["q1", "q2"]
    assert [round(c.intent_score, 2) for c in candidates] == [0.9, 0.8]
    assert all(c.id for c in candidates)


def test_filters_below_threshold(monkeypatch, context):
    monkeypatch.setattr(
        llm_service,
        "complete_json",
        lambda messages, **kwargs: {"scores": [0.9, MIN_INTENT_SCORE - 0.1]},
    )
    candidates = score_candidates(context, ["good", "bad"])
    assert [c.query for c in candidates] == ["good"]


def test_out_of_range_scores_are_clamped(monkeypatch, context):
    monkeypatch.setattr(
        llm_service,
        "complete_json",
        lambda messages, **kwargs: {"scores": [1.5, -0.2]},
    )
    candidates = score_candidates(context, ["high", "low"])
    assert [c.query for c in candidates] == ["high"]
    assert candidates[0].intent_score == 1.0


def test_missing_scores_default_to_zero(monkeypatch, context):
    monkeypatch.setattr(llm_service, "complete_json", lambda messages, **kwargs: {"scores": [0.9]})
    candidates = score_candidates(context, ["a", "b"])
    assert [c.query for c in candidates] == ["a"]


def test_llm_failure_raises_scoring_error(monkeypatch, context):
    def raise_llm_error(messages, **kwargs):
        raise LLMError("boom")

    monkeypatch.setattr(llm_service, "complete_json", raise_llm_error)
    with pytest.raises(ScoringFailedError):
        score_candidates(context, ["q1"])


def test_empty_queries_returns_empty(context):
    assert score_candidates(context, []) == []
