import numpy as np
from pydantic import BaseModel

from models.schemas import MultimodalContext
from pipeline.fusion import build_context_prompt
from services.embedding_service import embedding_service


class IntentionalityMetrics(BaseModel):
    mean_intent_score: float
    context_alignment: float


def mean_intent_score(scores: list[float]) -> float:
    if not scores:
        return 0.0
    return sum(scores) / len(scores)


def context_alignment(queries: list[str], context: MultimodalContext) -> float:
    if not queries:
        return 0.0
    context_text = build_context_prompt(context)
    if not context_text:
        return 0.0

    embeddings = embedding_service.embed([context_text, *queries])
    context_embedding = embeddings[0]
    similarities = [
        embedding_service.cosine_similarity(context_embedding, embedding)
        for embedding in embeddings[1:]
    ]
    return float(np.mean(similarities)) if similarities else 0.0


def evaluate_intentionality(
    queries: list[str],
    context: MultimodalContext,
    intent_scores: list[float] | None = None,
) -> IntentionalityMetrics:
    return IntentionalityMetrics(
        mean_intent_score=round(mean_intent_score(intent_scores or []), 4),
        context_alignment=round(context_alignment(queries, context), 4),
    )
