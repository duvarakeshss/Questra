from itertools import combinations

import numpy as np
from pydantic import BaseModel

from services.embedding_service import embedding_service


class DiversityMetrics(BaseModel):
    avg_pairwise_similarity: float
    avg_pairwise_distance: float
    suggestion_count: int


def pairwise_similarities(queries: list[str]) -> list[float]:
    if len(queries) < 2:
        return []

    embeddings = embedding_service.embed(queries)
    return [
        embedding_service.cosine_similarity(embeddings[i], embeddings[j])
        for i, j in combinations(range(len(queries)), 2)
    ]


def evaluate_diversity(queries: list[str]) -> DiversityMetrics:
    similarities = pairwise_similarities(queries)
    avg_similarity = float(np.mean(similarities)) if similarities else 0.0
    return DiversityMetrics(
        avg_pairwise_similarity=round(avg_similarity, 4),
        avg_pairwise_distance=round(1.0 - avg_similarity, 4) if similarities else 0.0,
        suggestion_count=len(queries),
    )
