import pytest

from errors import GenerationFailedError, LLMError
from pipeline.candidate_gen import generate_candidates
from services.llm_service import llm_service


@pytest.fixture
def context():
    from pipeline.fusion import fuse_modalities

    return fuse_modalities(image_description="black running shoe", text_input="under 5000")


def test_parses_valid_json(monkeypatch, context):
    monkeypatch.setattr(
        llm_service,
        "complete_json",
        lambda messages, **kwargs: {"queries": ["q1", "q2", "q3"]},
    )
    result = generate_candidates(context, count=3)
    assert result == ["q1", "q2", "q3"]


def test_deduplicates_and_trims(monkeypatch, context):
    monkeypatch.setattr(
        llm_service,
        "complete_json",
        lambda messages, **kwargs: {"queries": ["  q1  ", "Q1", "", "q2"]},
    )
    result = generate_candidates(context, count=5)
    assert result == ["q1", "q2"]


def test_respects_count_limit(monkeypatch, context):
    monkeypatch.setattr(
        llm_service,
        "complete_json",
        lambda messages, **kwargs: {"queries": ["a", "b", "c", "d"]},
    )
    assert len(generate_candidates(context, count=2)) == 2


def test_falls_back_to_text_extraction(monkeypatch, context):
    def raise_llm_error(messages, **kwargs):
        raise LLMError("bad json")

    monkeypatch.setattr(llm_service, "complete_json", raise_llm_error)
    monkeypatch.setattr(
        llm_service,
        "complete_text",
        lambda messages, **kwargs: "1. running shoes\n- budget sneakers\n*grey trainers",
    )
    result = generate_candidates(context, count=5)
    assert result == ["running shoes", "budget sneakers", "grey trainers"]


def test_empty_output_raises(monkeypatch, context):
    monkeypatch.setattr(llm_service, "complete_json", lambda messages, **kwargs: {"queries": []})
    with pytest.raises(GenerationFailedError):
        generate_candidates(context)
