from fastapi import APIRouter

from models.schemas import SearchRequest, SearchResponse
from pipeline.rerank import rerank_results
from pipeline.search import execute_search

router = APIRouter()


@router.post("/search", response_model=SearchResponse)
def search(request: SearchRequest) -> SearchResponse:
    query = request.query.strip()
    results = execute_search(query)
    reranked = rerank_results(query, results)
    return SearchResponse(success=True, query=query, results=reranked)
