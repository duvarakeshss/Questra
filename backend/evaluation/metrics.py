import math

from pydantic import BaseModel


class SearchMetrics(BaseModel):
    k: int
    precision_at_k: float
    recall_at_k: float
    mrr: float
    ndcg_at_k: float


def precision_at_k(retrieved: list[str], relevant: set[str], k: int) -> float:
    if k <= 0:
        return 0.0
    hits = sum(1 for item in retrieved[:k] if item in relevant)
    return hits / k


def recall_at_k(retrieved: list[str], relevant: set[str], k: int) -> float:
    if k <= 0 or not relevant:
        return 0.0
    hits = sum(1 for item in retrieved[:k] if item in relevant)
    return hits / len(relevant)


def reciprocal_rank(retrieved: list[str], relevant: set[str]) -> float:
    for rank, item in enumerate(retrieved, start=1):
        if item in relevant:
            return 1.0 / rank
    return 0.0


def dcg_at_k(gains: list[float], k: int) -> float:
    return sum(gain / math.log2(index + 2) for index, gain in enumerate(gains[:k]))


def ndcg_at_k(gains: list[float], k: int) -> float:
    ideal = dcg_at_k(sorted(gains, reverse=True), k)
    if ideal == 0.0:
        return 0.0
    return dcg_at_k(gains, k) / ideal


def relevance_gains(
    retrieved: list[str], relevant: set[str], grades: dict[str, float] | None = None
) -> list[float]:
    grades = grades or {}
    return [
        float(grades[url]) if url in grades else (1.0 if url in relevant else 0.0)
        for url in retrieved
    ]


def compute_search_metrics(
    retrieved: list[str],
    relevant: set[str] | list[str],
    k: int,
    grades: dict[str, float] | None = None,
) -> SearchMetrics:
    relevant = set(relevant)
    gains = relevance_gains(retrieved, relevant, grades)
    return SearchMetrics(
        k=k,
        precision_at_k=round(precision_at_k(retrieved, relevant, k), 4),
        recall_at_k=round(recall_at_k(retrieved, relevant, k), 4),
        mrr=round(reciprocal_rank(retrieved, relevant), 4),
        ndcg_at_k=round(ndcg_at_k(gains, k), 4),
    )
