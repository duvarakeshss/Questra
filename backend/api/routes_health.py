from fastapi import APIRouter

from models.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    models_loaded = False
    try:
        from services.embedding_service import embedding_service

        models_loaded = embedding_service.is_loaded
    except Exception:
        models_loaded = False

    return HealthResponse(status="ok", models_loaded=models_loaded)
