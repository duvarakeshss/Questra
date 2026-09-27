import logging

from config.settings import settings

logger = logging.getLogger(__name__)

_admin_client = None
_public_client = None


def is_configured() -> bool:
    return bool(settings.supabase_url and settings.supabase_admin_key)


def admin_client():
    """Service-role client. Server-side only — bypasses RLS. Never expose to the browser."""
    global _admin_client
    if not settings.supabase_url or not settings.supabase_admin_key:
        return None
    if _admin_client is None:
        from supabase import create_client

        _admin_client = create_client(settings.supabase_url, settings.supabase_admin_key)
    return _admin_client


def public_client():
    """Anon client, used to validate user access tokens."""
    global _public_client
    if not settings.supabase_url or not settings.supabase_public_key:
        return None
    if _public_client is None:
        from supabase import create_client

        _public_client = create_client(settings.supabase_url, settings.supabase_public_key)
    return _public_client
