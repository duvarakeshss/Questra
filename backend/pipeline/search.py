from config.settings import settings
from errors import EmptyQueryError
from services.search_service import search_service


def execute_search(query: str, top_k: int | None = None) -> list[dict]:
    query = (query or "").strip()
    if not query:
        raise EmptyQueryError("Search query must not be empty.")

    top_k = top_k or settings.search_top_k
    return search_service.search(query, top_k)
