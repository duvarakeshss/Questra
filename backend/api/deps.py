from fastapi import Depends, Request

from errors import UnauthorizedError
from services import supabase_client
from services.auth_service import AuthUser, get_user_from_token


def current_user(request: Request) -> AuthUser | None:
    """Resolve the signed-in user from a Bearer token, or None when anonymous."""
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        return None
    token = header[7:].strip()
    if not token or not supabase_client.is_configured():
        return None

    user = get_user_from_token(token)
    if user is None:
        raise UnauthorizedError("Your session has expired. Please sign in again.")
    return user


def client_subject(request: Request, user: AuthUser | None = Depends(current_user)) -> str:
    """Identity used to meter anonymous usage: user id, else anon id, else client IP."""
    if user is not None:
        return f"user:{user.id}"
    anon_id = (request.headers.get("x-anon-id") or "").strip()
    if anon_id:
        return f"anon:{anon_id}"
    host = request.client.host if request.client else "unknown"
    return f"ip:{host}"
