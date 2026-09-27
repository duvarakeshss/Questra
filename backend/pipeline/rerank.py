from config.settings import settings
from models.schemas import SearchResult
from services.embedding_service import embedding_service


def rerank_results(query: str, results: list[dict], top_k: int | None = None) -> list[SearchResult]:
    top_k = top_k or settings.rerank_top_k
    if not results:
        return []

    texts = [result.get("snippet") or result.get("title") or "" for result in results]
    query_embedding = embedding_service.embed([query])[0]
    result_embeddings = embedding_service.embed(texts)

    scored = []
    for result, embedding in zip(results, result_embeddings):
        score = embedding_service.cosine_similarity(query_embedding, embedding)
        scored.append((score, result))

    scored.sort(key=lambda item: item[0], reverse=True)

    return [
        SearchResult(
            title=result.get("title", ""),
            url=result.get("url", ""),
            snippet=result.get("snippet", ""),
            score=round(score, 4),
            thumbnail=result.get("thumbnail"),
        )
        for score, result in scored[:top_k]
    ]
