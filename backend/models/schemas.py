from pydantic import BaseModel


class MultimodalContext(BaseModel):
    image_description: str | None = None
    voice_transcript: str | None = None
    text_input: str | None = None


class QueryCandidate(BaseModel):
    id: str
    query: str
    intent_score: float


class QuerySuggestion(BaseModel):
    id: str
    query: str
    intent_score: float
    diversity_rank: int


class QuotaInfo(BaseModel):
    authenticated: bool = False
    limit: int | None = None
    used: int = 0
    remaining: int | None = None


class SuggestionResponse(BaseModel):
    success: bool = True
    suggestions: list[QuerySuggestion]
    context: MultimodalContext
    quota: QuotaInfo | None = None


class MeResponse(BaseModel):
    authenticated: bool
    email: str | None = None
    quota: QuotaInfo | None = None


class SearchRequest(BaseModel):
    query: str


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    score: float
    thumbnail: str | None = None


class SearchResponse(BaseModel):
    success: bool = True
    query: str
    results: list[SearchResult]


class HealthResponse(BaseModel):
    status: str = "ok"
    models_loaded: bool = False


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
