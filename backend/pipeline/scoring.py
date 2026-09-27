import uuid

from errors import LLMError, ScoringFailedError
from models.schemas import MultimodalContext, QueryCandidate
from pipeline.fusion import build_context_prompt
from services.llm_service import llm_service

MIN_INTENT_SCORE = 0.3

_SYSTEM_PROMPT = (
    "You are an intent-relevance judge. Score how well each search query represents the "
    "user's multimodal information need, considering visual relevance, stated intent, and "
    "constraints. Return a score between 0.0 and 1.0 for each query."
)


def _build_messages(context: MultimodalContext, queries: list[str]) -> list[dict]:
    context_block = build_context_prompt(context)
    numbered = "\n".join(f"{index + 1}. {query}" for index, query in enumerate(queries))
    user_prompt = (
        "Multimodal context:\n"
        f"{context_block}\n\n"
        "Candidate queries:\n"
        f"{numbered}\n\n"
        "Rate each query from 0.0 to 1.0 for how well it captures the multimodal intent. "
        "Return scores in the SAME ORDER as the queries above.\n"
        'Respond ONLY with JSON: {"scores": [0.9, 0.8, ...]}'
    )
    return [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]


def _coerce_scores(data: object, expected: int) -> list[float]:
    raw: list = []
    if isinstance(data, dict):
        if isinstance(data.get("scores"), list):
            raw = data["scores"]
        elif isinstance(data.get("results"), list):
            raw = [item.get("score", 0.0) if isinstance(item, dict) else item for item in data["results"]]

    scores: list[float] = []
    for item in raw:
        if isinstance(item, dict):
            value = item.get("score", item.get("intent_score", 0.0))
        else:
            value = item
        try:
            score = float(value)
        except (TypeError, ValueError):
            score = 0.0
        scores.append(min(max(score, 0.0), 1.0))

    if len(scores) < expected:
        scores.extend([0.0] * (expected - len(scores)))
    return scores[:expected]


def score_candidates(context: MultimodalContext, queries: list[str]) -> list[QueryCandidate]:
    if not queries:
        return []

    messages = _build_messages(context, queries)
    try:
        data = llm_service.complete_json(messages)
    except LLMError as error:
        raise ScoringFailedError(f"Could not score candidate queries: {error}") from error

    scores = _coerce_scores(data, len(queries))

    candidates: list[QueryCandidate] = []
    for query, score in zip(queries, scores):
        if score < MIN_INTENT_SCORE:
            continue
        candidates.append(
            QueryCandidate(id=str(uuid.uuid4()), query=query, intent_score=score)
        )
    return candidates
