import numpy as np

from config.settings import settings
from models.schemas import QueryCandidate, QuerySuggestion
from services.embedding_service import embedding_service


def select_diverse(
    candidates: list[QueryCandidate],
    count: int | None = None,
    lambda_: float | None = None,
) -> list[QuerySuggestion]:
    count = count or settings.suggestion_count
    lambda_ = lambda_ if lambda_ is not None else settings.mmr_lambda

    if not candidates:
        return []
    if count >= len(candidates):
        ordered = sorted(candidates, key=lambda c: c.intent_score, reverse=True)
        return [
            QuerySuggestion(
                id=candidate.id,
                query=candidate.query,
                intent_score=candidate.intent_score,
                diversity_rank=rank,
            )
            for rank, candidate in enumerate(ordered, start=1)
        ]

    embeddings = embedding_service.embed([candidate.query for candidate in candidates])
    similarity = embeddings @ embeddings.T
    scores = np.array([candidate.intent_score for candidate in candidates], dtype=np.float32)

    selected: list[int] = []
    remaining = list(range(len(candidates)))

    while remaining and len(selected) < count:
        best_index = remaining[0]
        best_mmr = float("-inf")
        for index in remaining:
            if not selected:
                mmr = float(scores[index])
            else:
                max_similarity = max(float(similarity[index][chosen]) for chosen in selected)
                mmr = lambda_ * float(scores[index]) - (1.0 - lambda_) * max_similarity
            if mmr > best_mmr:
                best_mmr = mmr
                best_index = index
        selected.append(best_index)
        remaining.remove(best_index)

    return [
        QuerySuggestion(
            id=candidates[index].id,
            query=candidates[index].query,
            intent_score=candidates[index].intent_score,
            diversity_rank=rank,
        )
        for rank, index in enumerate(selected, start=1)
    ]
