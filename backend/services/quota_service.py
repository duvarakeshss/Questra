import logging
from datetime import datetime, timedelta, timezone

from config.settings import settings
from errors import QuotaExceededError
from models.schemas import QuotaInfo
from services import supabase_client

logger = logging.getLogger(__name__)

_supabase_warned = False


def _window_start() -> str | None:
    if settings.quota_window_hours <= 0:
        return None
    return (datetime.now(timezone.utc) - timedelta(hours=settings.quota_window_hours)).isoformat()


# ── Supabase store ──────────────────────────────────────────────────────────

def _supabase_usage(subject: str) -> int:
    client = supabase_client.admin_client()
    query = (
        client.table(settings.supabase_usage_table)
        .select("id", count="exact")
        .eq("subject", subject)
    )
    start = _window_start()
    if start is not None:
        query = query.gte("created_at", start)
    return query.execute().count or 0


def _supabase_record(subject: str) -> None:
    supabase_client.admin_client().table(settings.supabase_usage_table).insert({"subject": subject}).execute()


# ── Store selection ─────────────────────────────────────────────────────────

def _used(subject: str) -> int | None:
    """Count usage for a subject, or None when Supabase is unavailable (fail open)."""
    global _supabase_warned
    if supabase_client.admin_client() is None:
        return None
    try:
        return _supabase_usage(subject)
    except Exception as error:  # noqa: BLE001 - missing table / network → run unmetered
        if not _supabase_warned:
            logger.warning("Supabase quota store unavailable (%s); running unmetered.", error)
            _supabase_warned = True
        return None


# ── Public API ──────────────────────────────────────────────────────────────

def peek(subject: str, limit: int | None, authenticated: bool) -> QuotaInfo:
    """Report the current quota without consuming it (used by GET /api/me)."""
    if limit is None:
        return QuotaInfo(authenticated=authenticated, limit=None, used=0, remaining=None)
    used = _used(subject)
    if used is None:
        return QuotaInfo(authenticated=authenticated, limit=limit, used=0, remaining=limit)
    return QuotaInfo(authenticated=authenticated, limit=limit, used=used, remaining=max(limit - used, 0))


def check_and_consume(subject: str, limit: int | None, authenticated: bool = False) -> QuotaInfo:
    """Raise QuotaExceededError when the limit is reached, otherwise record one use."""
    if limit is None:
        return QuotaInfo(authenticated=authenticated, limit=None, used=0, remaining=None)

    used = _used(subject)
    if used is None:
        return QuotaInfo(authenticated=authenticated, limit=limit, used=0, remaining=limit)
    if used >= limit:
        raise QuotaExceededError("You've used your free queries. Sign in to keep going.")

    _supabase_record(subject)
    used += 1
    return QuotaInfo(authenticated=authenticated, limit=limit, used=used, remaining=max(limit - used, 0))
