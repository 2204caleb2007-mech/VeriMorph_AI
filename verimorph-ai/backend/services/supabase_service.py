# =============================================================
# PART 13 — Supabase Session & Chat History Service
# Keys from environment — structlog — no print()
# =============================================================
import os
import structlog
from supabase import create_client, Client

log = structlog.get_logger(__name__)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


async def save_message(session_id: str, user_query: str, assistant_response: str) -> None:
    """
    Persists user + assistant messages to Supabase chat_messages table.
    """
    log.info("supabase.save_message", session_id=session_id)
    try:
        supabase.table("chat_messages").insert([
            {"session_id": session_id, "role": "user", "content": user_query},
            {"session_id": session_id, "role": "assistant", "content": assistant_response},
        ]).execute()
    except Exception as e:
        log.error("supabase.save_message.error", error=str(e))


async def get_history(session_id: str) -> list:
    """
    Retrieves chat message history from Supabase for a given session.
    """
    log.info("supabase.get_history", session_id=session_id)
    try:
        response = (
            supabase.table("chat_messages")
            .select("*")
            .eq("session_id", session_id)
            .order("created_at")
            .execute()
        )
        return response.data or []
    except Exception as e:
        log.error("supabase.get_history.error", error=str(e))
        return []


async def clear_history(session_id: str) -> None:
    """
    Deletes all chat messages for a given session.
    """
    log.info("supabase.clear_history", session_id=session_id)
    try:
        supabase.table("chat_messages").delete().eq("session_id", session_id).execute()
    except Exception as e:
        log.error("supabase.clear_history.error", error=str(e))
