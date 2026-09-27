from fastapi import APIRouter, Depends, Request

from api.deps import client_subject, current_user
from config.settings import settings
from models.schemas import MeResponse
from services import quota_service
from services.auth_service import AuthUser

router = APIRouter()


@router.get("/me", response_model=MeResponse)
def me(
    request: Request,
    user: AuthUser | None = Depends(current_user),
    subject: str = Depends(client_subject),
) -> MeResponse:
    limit = None if user is not None else settings.anonymous_free_queries
    quota = quota_service.peek(subject, limit, authenticated=user is not None)
    return MeResponse(
        authenticated=user is not None,
        email=user.email if user else None,
        quota=quota,
    )
