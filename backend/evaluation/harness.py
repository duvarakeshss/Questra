from typing import Callable

from pydantic import BaseModel, Field

from config.settings import settings
from evaluation.baselines import (
    ProposedQuery,
    image_caption_queries,
    questra_queries,
    relevance_only_queries,
    single_generated_query,
    text_only_queries,
)
from evaluation.diversity import DiversityMetrics, evaluate_diversity
from evaluation.intentionality import IntentionalityMetrics, evaluate_intentionality
from evaluation.metrics import SearchMetrics, compute_search_metrics
from models.schemas import MultimodalContext
from pipeline.fusion import fuse_modalities
from pipeline.rerank import rerank_results
from pipeline.search import execute_search

Selector = Callable[[MultimodalContext], list[ProposedQuery]]

SYSTEMS: dict[str, Selector] = {
    "text_only": text_only_queries,
    "image_caption": image_caption_queries,
    "single_generated": single_generated_query,
    "relevance_only": relevance_only_queries,
    "questra": questra_queries,
}


class BenchmarkCase(BaseModel):
    id: str
    image_description: str | None = None
    voice_transcript: str | None = None
    text_input: str | None = None
    relevant_urls: list[str] = Field(default_factory=list)
    relevance_grades: dict[str, float] = Field(default_factory=dict)

    def to_context(self) -> MultimodalContext:
        return fuse_modalities(self.image_description, self.voice_transcript, self.text_input)


class SystemEvaluation(BaseModel):
    system: str
    num_queries: float
    intentionality: IntentionalityMetrics
    diversity: DiversityMetrics
    search: SearchMetrics | None = None
    error: str | None = None


class BenchmarkReport(BaseModel):
    k: int
    systems: list[SystemEvaluation]


def _empty_intentionality() -> IntentionalityMetrics:
    return IntentionalityMetrics(mean_intent_score=0.0, context_alignment=0.0)


def _empty_diversity() -> DiversityMetrics:
    return DiversityMetrics(avg_pairwise_similarity=0.0, avg_pairwise_distance=0.0, suggestion_count=0)


def _evaluate_system(
    name: str,
    selector: Selector,
    context: MultimodalContext,
    case: BenchmarkCase,
    k: int,
) -> SystemEvaluation:
    try:
        proposed = selector(context)
    except Exception as error:  # noqa: BLE001 - isolate one system's failure from the benchmark
        return SystemEvaluation(
            system=name,
            num_queries=0,
            intentionality=_empty_intentionality(),
            diversity=_empty_diversity(),
            error=str(error),
        )

    queries = [item.query for item in proposed]
    intent_scores = [item.intent_score for item in proposed if item.intent_score is not None]

    search_metrics = None
    if queries and case.relevant_urls:
        top_query = queries[0]
        raw_results = execute_search(top_query)
        reranked = rerank_results(top_query, raw_results, top_k=k)
        retrieved = [result.url for result in reranked]
        search_metrics = compute_search_metrics(retrieved, case.relevant_urls, k, case.relevance_grades)

    return SystemEvaluation(
        system=name,
        num_queries=len(queries),
        intentionality=evaluate_intentionality(queries, context, intent_scores),
        diversity=evaluate_diversity(queries),
        search=search_metrics,
    )


def evaluate_case(
    case: BenchmarkCase,
    selectors: dict[str, Selector] | None = None,
    k: int | None = None,
) -> list[SystemEvaluation]:
    selectors = selectors or SYSTEMS
    k = k or settings.rerank_top_k
    context = case.to_context()
    return [
        _evaluate_system(name, selector, context, case, k)
        for name, selector in selectors.items()
    ]


def _mean(values: list[float]) -> float:
    return round(sum(values) / len(values), 4) if values else 0.0


def _aggregate(name: str, evaluations: list[SystemEvaluation], k: int) -> SystemEvaluation:
    successful = [item for item in evaluations if item.error is None]
    num_queries = _mean([item.num_queries for item in successful])

    searches = [item.search for item in successful if item.search is not None]
    search = None
    if searches:
        search = SearchMetrics(
            k=k,
            precision_at_k=_mean([item.precision_at_k for item in searches]),
            recall_at_k=_mean([item.recall_at_k for item in searches]),
            mrr=_mean([item.mrr for item in searches]),
            ndcg_at_k=_mean([item.ndcg_at_k for item in searches]),
        )

    errors = [item.error for item in evaluations if item.error]
    return SystemEvaluation(
        system=name,
        num_queries=num_queries,
        intentionality=IntentionalityMetrics(
            mean_intent_score=_mean([item.intentionality.mean_intent_score for item in successful]),
            context_alignment=_mean([item.intentionality.context_alignment for item in successful]),
        ),
        diversity=DiversityMetrics(
            avg_pairwise_similarity=_mean([item.diversity.avg_pairwise_similarity for item in successful]),
            avg_pairwise_distance=_mean([item.diversity.avg_pairwise_distance for item in successful]),
            suggestion_count=int(num_queries),
        ),
        search=search,
        error=errors[0] if errors else None,
    )


def run_benchmark(
    cases: list[BenchmarkCase],
    selectors: dict[str, Selector] | None = None,
    k: int | None = None,
) -> BenchmarkReport:
    selectors = selectors or SYSTEMS
    k = k or settings.rerank_top_k

    per_system: dict[str, list[SystemEvaluation]] = {name: [] for name in selectors}
    for case in cases:
        for evaluation in evaluate_case(case, selectors, k):
            per_system[evaluation.system].append(evaluation)

    return BenchmarkReport(
        k=k,
        systems=[_aggregate(name, evaluations, k) for name, evaluations in per_system.items()],
    )
