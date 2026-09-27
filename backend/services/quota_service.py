import logging
from datetime import datetime, timedelta, timezone

from config.settings import settings
from errors import QuotaExceededError
from models.schemas import QuotaInfo
from services import supabase_client

logger = logging.getLogger(__name__)

_unmetered_warned = False


def _window_start() -> str | None:
    if settings.quota_window_hours <= 0:
        return None
    return (datetime.now(timezone.utc) - timedelta(hours=settings.quota_window_hours)).isoformat()


def _unmetered(authenticated: bool) -> QuotaInfo:
    return QuotaInfo(authenticated=authenticated, limit=None, used=0, remaining=None)


def get_usage(subject: str) -> int:
    client = supabase_client.admin_client()
    if client is None:
        return 0
    query = (
        client.table(settings.supabase_usage_table)
        .select("id", count="exact")
        .eq("subject", subject)
    )
    start = _window_start()
    if start is not None:
        query = query.gte("created_at", start)
    return query.execute().count or 0


def _record(subject: str) -> None:
    client = supabase_client.admin_client()
    if client is None:
        return
    client.table(settings.supabase_usage_table).insert({"subject": subject}).execute()


def peek(subject: str, limit: int | None, authenticated: bool) -> QuotaInfo:
    """Report the current quota without consuming it (used by GET /api/me)."""
    if limit is None:
        return QuotaInfo(authenticated=authenticated, limit=None, used=0, remaining=None)
    if supabase_client.admin_client() is None:
        _warn_unconfigured()
        return _unmetered(authenticated)
    try:
        used = get_usage(subject)
    except Exception as error:  # noqa: BLE001 - fail open so the app still works
        logger.warning("Quota lookup failed (%s); reporting unmetered.", error)
        return _unmetered(authenticated)
    return QuotaInfo(authenticated=False, limit=limit, used=used, remaining=max(limit - used, 0))


def check_and_consume(subject: str, limit: int | None, authenticated: bool = False) -> QuotaInfo:
    """Raise QuotaExceededError when the limit is reached, otherwise record one use."""
    if limit is None:
        return QuotaInfo(authenticated=authenticated, limit=None, used=0, remaining=None)
    if supabase_client.admin_client() is None:
        _warn_unconfigured()
        return _unmetered(authenticated)

    try:
        used = get_usage(subject)
        if used >= limit:
            raise QuotaExceededError("You've used your free queries. Sign in to keep going.")
        _record(subject)
    except QuotaExceededError:
        raise
    except Exception as error:  # noqa: BLE001 - fail open, but never on a real quota breach
        logger.warning("Quota check failed (%s); allowing this request unmetered.", error)
        return _unmetered(authenticated)

    used += 1
    return QuotaInfo(authenticated=False, limit=limit, used=used, remaining=max(limit - used, 0))


def _warn_unconfigured() -> None:
    global _unmetered_warned
    if not _unmetered_warned:
        logger.warning("Supabase not configured - query quota disabled (unmetered).")
        _unmetered_warned = True
