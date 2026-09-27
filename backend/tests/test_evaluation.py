import numpy as np
import pytest

from evaluation.baselines import (
    image_caption_queries,
    questra_queries,
    relevance_only_queries,
    single_generated_query,
    text_only_queries,
)
from evaluation.diversity import evaluate_diversity
from evaluation.harness import SYSTEMS, BenchmarkCase, run_benchmark
from evaluation.intentionality import evaluate_intentionality
from evaluation.metrics import (
    compute_search_metrics,
    dcg_at_k,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
    relevance_gains,
)
from models.schemas import QueryCandidate, QuerySuggestion, SearchResult
from pipeline.fusion import fuse_modalities
from services.embedding_service import embedding_service


def _patch_embeddings(monkeypatch, mapping):
    monkeypatch.setattr(
        embedding_service,
        "embed",
        lambda texts: np.array([mapping[text] for text in texts], dtype=np.float32),
    )


def _patch_constant_embeddings(monkeypatch):
    monkeypatch.setattr(
        embedding_service,
        "embed",
        lambda texts: np.ones((len(texts), 2), dtype=np.float32),
    )


def _patch_pipeline(monkeypatch):
    monkeypatch.setattr("evaluation.baselines.generate_candidates", lambda context, count=None: ["q1", "q2"])
    monkeypatch.setattr(
        "evaluation.baselines.score_candidates",
        lambda context, queries: [
            QueryCandidate(id="c1", query="q1", intent_score=0.9),
            QueryCandidate(id="c2", query="q2", intent_score=0.6),
        ],
    )
    monkeypatch.setattr(
        "evaluation.baselines.select_diverse",
        lambda candidates, count=None, lambda_=None: [
            QuerySuggestion(id="c1", query="q1", intent_score=0.9, diversity_rank=1),
            QuerySuggestion(id="c2", query="q2", intent_score=0.6, diversity_rank=2),
        ],
    )


# --- ranking metrics -------------------------------------------------------


def test_precision_and_recall_at_k():
    retrieved = ["a", "b", "c", "d"]
    relevant = {"a", "c"}
    assert precision_at_k(retrieved, relevant, 4) == pytest.approx(0.5)
    assert precision_at_k(retrieved, relevant, 2) == pytest.approx(0.5)
    assert recall_at_k(retrieved, relevant, 4) == pytest.approx(1.0)
    assert recall_at_k(retrieved, relevant, 1) == pytest.approx(0.5)


def test_precision_recall_edge_cases():
    assert precision_at_k([], {"a"}, 3) == 0.0
    assert precision_at_k(["a"], {"a"}, 0) == 0.0
    assert recall_at_k(["a"], set(), 3) == 0.0


def test_reciprocal_rank():
    assert reciprocal_rank(["x", "a"], {"a"}) == pytest.approx(0.5)
    assert reciprocal_rank(["a", "b"], {"a"}) == pytest.approx(1.0)
    assert reciprocal_rank(["x", "y"], {"a"}) == 0.0


def test_dcg_and_ndcg():
    gains = [1.0, 0.0, 1.0]
    assert dcg_at_k(gains, 3) == pytest.approx(1.5)
    assert ndcg_at_k(gains, 3) == pytest.approx(1.5 / (1 + 1 / np.log2(3)))
    assert ndcg_at_k([0.0, 0.0], 2) == 0.0


def test_relevance_gains_uses_grades():
    assert relevance_gains(["a", "b"], {"a"}, {"a": 2.0}) == [2.0, 0.0]
    assert relevance_gains(["a", "b"], {"a", "b"}) == [1.0, 1.0]


def test_compute_search_metrics():
    metrics = compute_search_metrics(["a", "b", "c"], {"a", "c"}, 3)
    assert metrics.precision_at_k == pytest.approx(0.6667, abs=1e-4)
    assert metrics.recall_at_k == 1.0
    assert metrics.mrr == 1.0
    assert metrics.ndcg_at_k == pytest.approx(1.5 / (1 + 1 / np.log2(3)), abs=1e-4)


# --- intentionality --------------------------------------------------------


def test_evaluate_intentionality(monkeypatch):
    context = fuse_modalities(text_input="under 5000")
    context_text = "Text input: under 5000"
    _patch_embeddings(
        monkeypatch,
        {context_text: [1, 0], "q1": [1, 0], "q2": [0, 1]},
    )
    metrics = evaluate_intentionality(["q1", "q2"], context, [0.9, 0.7])
    assert metrics.mean_intent_score == pytest.approx(0.8)
    assert metrics.context_alignment == pytest.approx(0.5)


def test_evaluate_intentionality_empty_queries():
    context = fuse_modalities(text_input="under 5000")
    metrics = evaluate_intentionality([], context)
    assert metrics.mean_intent_score == 0.0
    assert metrics.context_alignment == 0.0


# --- diversity -------------------------------------------------------------


def test_evaluate_diversity_identical_and_orthogonal(monkeypatch):
    _patch_embeddings(monkeypatch, {"A": [1, 0], "B": [0, 1], "C": [1, 0]})
    orthogonal = evaluate_diversity(["A", "B"])
    assert orthogonal.avg_pairwise_similarity == pytest.approx(0.0)
    assert orthogonal.avg_pairwise_distance == pytest.approx(1.0)

    identical = evaluate_diversity(["A", "C"])
    assert identical.avg_pairwise_similarity == pytest.approx(1.0)
    assert identical.avg_pairwise_distance == pytest.approx(0.0)


def test_evaluate_diversity_single_query():
    metrics = evaluate_diversity(["only one"])
    assert metrics.suggestion_count == 1
    assert metrics.avg_pairwise_similarity == 0.0
    assert metrics.avg_pairwise_distance == 0.0


# --- baselines -------------------------------------------------------------


def test_text_and_image_caption_baselines():
    context = fuse_modalities(image_description="a red shoe", text_input="under 5000")
    assert [q.query for q in text_only_queries(context)] == ["under 5000"]
    assert [q.query for q in image_caption_queries(context)] == ["a red shoe"]

    text_only_context = fuse_modalities(text_input="only text")
    assert image_caption_queries(text_only_context) == []


def test_single_generated_query_picks_top(monkeypatch):
    _patch_pipeline(monkeypatch)
    context = fuse_modalities(text_input="under 5000")
    assert [q.query for q in single_generated_query(context)] == ["q1"]


def test_relevance_only_returns_ranked_top(monkeypatch):
    _patch_pipeline(monkeypatch)
    context = fuse_modalities(text_input="under 5000")
    proposed = relevance_only_queries(context)
    assert [q.query for q in proposed] == ["q1", "q2"]
    assert [q.rank for q in proposed] == [1, 2]


def test_questra_queries_uses_diversity(monkeypatch):
    _patch_pipeline(monkeypatch)
    context = fuse_modalities(text_input="under 5000")
    proposed = questra_queries(context)
    assert [q.query for q in proposed] == ["q1", "q2"]
    assert [q.rank for q in proposed] == [1, 2]


# --- harness ---------------------------------------------------------------


def test_run_benchmark_includes_all_systems(monkeypatch):
    _patch_pipeline(monkeypatch)
    _patch_constant_embeddings(monkeypatch)

    case = BenchmarkCase(id="c1", image_description="a red shoe", text_input="under 5000")
    report = run_benchmark([case])

    assert [s.system for s in report.systems] == list(SYSTEMS)
    by_name = {s.system: s for s in report.systems}
    assert by_name["text_only"].num_queries == 1
    assert by_name["image_caption"].num_queries == 1
    assert by_name["questra"].num_queries == 2
    assert by_name["questra"].search is None
    assert by_name["questra"].error is None


def test_run_benchmark_search_metrics(monkeypatch):
    _patch_pipeline(monkeypatch)
    _patch_constant_embeddings(monkeypatch)

    monkeypatch.setattr("evaluation.harness.execute_search", lambda query: [{"title": "t", "url": "raw"}])
    monkeypatch.setattr(
        "evaluation.harness.rerank_results",
        lambda query, results, top_k=None: [
            SearchResult(title="A", url="https://a", snippet="", score=1.0),
            SearchResult(title="B", url="https://b", snippet="", score=0.5),
            SearchResult(title="C", url="https://c", snippet="", score=0.2),
        ],
    )

    case = BenchmarkCase(
        id="c2",
        text_input="under 5000",
        relevant_urls=["https://a", "https://c"],
    )
    report = run_benchmark([case], k=3)
    by_name = {s.system: s for s in report.systems}

    metrics = by_name["questra"].search
    assert metrics is not None
    assert metrics.mrr == 1.0
    assert metrics.recall_at_k == 1.0
    assert metrics.precision_at_k == pytest.approx(0.6667, abs=1e-4)
