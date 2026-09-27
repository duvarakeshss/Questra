import logging
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

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


# ── Local SQLite store (fallback so the limit always holds) ──────────────────

def _sqlite_connect() -> sqlite3.Connection:
    connection = sqlite3.connect(settings.quota_db_path)
    connection.execute(
        "create table if not exists usage ("
        "id integer primary key autoincrement, subject text not null, created_at text not null)"
    )
    connection.execute("create index if not exists usage_subject_idx on usage (subject, created_at)")
    return connection


def _local_usage(subject: str) -> int:
    connection = _sqlite_connect()
    try:
        start = _window_start()
        if start is not None:
            row = connection.execute(
                "select count(*) from usage where subject = ? and created_at >= ?", (subject, start)
            ).fetchone()
        else:
            row = connection.execute("select count(*) from usage where subject = ?", (subject,)).fetchone()
        return int(row[0])
    finally:
        connection.close()


def _local_record(subject: str) -> None:
    connection = _sqlite_connect()
    try:
        connection.execute(
            "insert into usage (subject, created_at) values (?, ?)",
            (subject, datetime.now(timezone.utc).isoformat()),
        )
        connection.commit()
    finally:
        connection.close()


# ── Store selection ─────────────────────────────────────────────────────────

def _read(subject: str) -> tuple[str, int]:
    """Count usage for a subject, preferring Supabase and falling back to SQLite."""
    global _supabase_warned
    if supabase_client.admin_client() is not None:
        try:
            return "supabase", _supabase_usage(subject)
        except Exception as error:  # noqa: BLE001 - missing table / network → use the local store
            if not _supabase_warned:
                logger.warning("Supabase quota store unavailable (%s); falling back to local SQLite.", error)
                _supabase_warned = True
    return "local", _local_usage(subject)


def _write(store: str, subject: str) -> None:
    if store == "supabase":
        _supabase_record(subject)
    else:
        _local_record(subject)


# ── Public API ──────────────────────────────────────────────────────────────

def peek(subject: str, limit: int | None, authenticated: bool) -> QuotaInfo:
    """Report the current quota without consuming it (used by GET /api/me)."""
    if limit is None:
        return QuotaInfo(authenticated=authenticated, limit=None, used=0, remaining=None)
    _, used = _read(subject)
    return QuotaInfo(authenticated=False, limit=limit, used=used, remaining=max(limit - used, 0))


def check_and_consume(subject: str, limit: int | None, authenticated: bool = False) -> QuotaInfo:
    """Raise QuotaExceededError when the limit is reached, otherwise record one use."""
    if limit is None:
        return QuotaInfo(authenticated=authenticated, limit=None, used=0, remaining=None)

    store, used = _read(subject)
    if used >= limit:
        raise QuotaExceededError("You've used your free queries. Sign in to keep going.")

    _write(store, subject)
    used += 1
    return QuotaInfo(authenticated=False, limit=limit, used=used, remaining=max(limit - used, 0))
