# =============================================================
# PART 14 — Health Router
# GET /api/health — checks all services
# =============================================================
import structlog
from fastapi import APIRouter

log = structlog.get_logger(__name__)
router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Check health of all connected services."""
    status = {"api": "ok", "version": "2.0.0"}

    # PostgreSQL check
    try:
        from database import engine
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        status["postgresql"] = "ok"
    except Exception as e:
        log.warning("health.postgres_error", error=str(e))
        status["postgresql"] = f"error: {str(e)[:50]}"

    # MongoDB check
    try:
        from database import mongo_client
        await mongo_client.admin.command("ping")
        status["mongodb"] = "ok"
    except Exception as e:
        log.warning("health.mongo_error", error=str(e))
        status["mongodb"] = f"error: {str(e)[:50]}"

    # Redis check
    try:
        import redis.asyncio as aioredis
        import os
        r = aioredis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379/0"))
        await r.ping()
        await r.aclose()
        status["redis"] = "ok"
    except Exception as e:
        log.warning("health.redis_error", error=str(e))
        status["redis"] = f"error: {str(e)[:50]}"

    return status
