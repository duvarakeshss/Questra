import logging

from pydantic import BaseModel

from services import supabase_client

logger = logging.getLogger(__name__)


class AuthUser(BaseModel):
    id: str
    email: str | None = None


def get_user_from_token(token: str) -> AuthUser | None:
    """Validate a Supabase access token by asking Supabase who it belongs to."""
    client = supabase_client.public_client()
    if client is None:
        return None
    try:
        response = client.auth.get_user(token)
    except Exception as error:  # noqa: BLE001 - any failure means an invalid session
        logger.info("Supabase token verification failed: %s", error)
        return None

    user = getattr(response, "user", None)
    if user is None:
        return None
    return AuthUser(id=str(getattr(user, "id", "")), email=getattr(user, "email", None))
