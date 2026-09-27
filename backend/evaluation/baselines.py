from pydantic import BaseModel

from config.settings import settings
from models.schemas import MultimodalContext, QueryCandidate
from pipeline.candidate_gen import generate_candidates
from pipeline.diversity import select_diverse
from pipeline.scoring import score_candidates


class ProposedQuery(BaseModel):
    query: str
    intent_score: float | None = None
    rank: int = 1


def _from_ranked(candidates: list[QueryCandidate]) -> list[ProposedQuery]:
    return [
        ProposedQuery(query=candidate.query, intent_score=candidate.intent_score, rank=rank)
        for rank, candidate in enumerate(candidates, start=1)
    ]


def text_only_queries(context: MultimodalContext) -> list[ProposedQuery]:
    if not context.text_input:
        return []
    return [ProposedQuery(query=context.text_input, rank=1)]


def image_caption_queries(context: MultimodalContext) -> list[ProposedQuery]:
    if not context.image_description:
        return []
    return [ProposedQuery(query=context.image_description, rank=1)]


def single_generated_query(context: MultimodalContext) -> list[ProposedQuery]:
    candidates = score_candidates(context, generate_candidates(context))
    if not candidates:
        return []
    best = max(candidates, key=lambda candidate: candidate.intent_score)
    return [ProposedQuery(query=best.query, intent_score=best.intent_score, rank=1)]


def relevance_only_queries(context: MultimodalContext) -> list[ProposedQuery]:
    candidates = score_candidates(context, generate_candidates(context))
    ordered = sorted(candidates, key=lambda candidate: candidate.intent_score, reverse=True)
    return _from_ranked(ordered[: settings.suggestion_count])


def questra_queries(context: MultimodalContext) -> list[ProposedQuery]:
    candidates = score_candidates(context, generate_candidates(context))
    suggestions = select_diverse(candidates)
    return [
        ProposedQuery(query=suggestion.query, intent_score=suggestion.intent_score, rank=suggestion.diversity_rank)
        for suggestion in suggestions
    ]
