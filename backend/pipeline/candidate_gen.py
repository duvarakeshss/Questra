import json
import re

from config.settings import settings
from errors import GenerationFailedError, LLMError
from models.schemas import MultimodalContext
from pipeline.fusion import build_context_prompt
from services.llm_service import llm_service

_SYSTEM_PROMPT = (
    "You are a search query generator. Given a user's multimodal context, produce "
    "search-engine-ready queries that capture different plausible search intents."
)


def _build_messages(context: MultimodalContext, count: int) -> list[dict]:
    context_block = build_context_prompt(context)
    user_prompt = (
        "Multimodal context:\n"
        f"{context_block}\n\n"
        f"Generate {count} diverse search queries that represent different meaningful "
        "search intents for this context.\n"
        "Requirements:\n"
        "- Be relevant to the visual context, stated intent, and any constraints.\n"
        "- Vary the intent meaningfully; avoid grammatical paraphrases of the same query.\n"
        "- Keep each query concise and search-friendly.\n"
        "- No duplicates, no unsupported facts, preserve user constraints (budget, etc.).\n\n"
        'Respond ONLY with JSON: {"queries": ["query 1", "query 2", ...]}'
    )
    return [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]


def _extract_queries(text: str) -> list[str]:
    text = (text or "").strip()
    if not text:
        return []

    try:
        data = json.loads(text)
        if isinstance(data, dict) and isinstance(data.get("queries"), list):
            return [str(item) for item in data["queries"]]
    except json.JSONDecodeError:
        pass

    match = re.search(r"\[.*\]", text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            if isinstance(data, list):
                return [str(item) for item in data]
        except json.JSONDecodeError:
            pass

    queries = []
    for line in text.splitlines():
        cleaned = re.sub(r"^\s*(?:[-*]|\d+[.)])\s*", "", line).strip().strip('",')
        if cleaned:
            queries.append(cleaned)
    return queries


def _normalize(queries: list[str], count: int) -> list[str]:
    seen: set[str] = set()
    normalized: list[str] = []
    for raw in queries:
        query = " ".join(str(raw).split()).strip()
        if not query:
            continue
        key = query.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(query)
        if len(normalized) >= count:
            break
    return normalized


def generate_candidates(context: MultimodalContext, count: int | None = None) -> list[str]:
    count = count or settings.candidate_count
    messages = _build_messages(context, count)

    try:
        data = llm_service.complete_json(messages)
        queries = data.get("queries", []) if isinstance(data, dict) else []
    except LLMError:
        queries = _extract_queries(llm_service.complete_text(messages))

    queries = _normalize(queries, count)
    if not queries:
        raise GenerationFailedError("Could not generate any candidate queries.")
    return queries
