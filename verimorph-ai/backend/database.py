# =============================================================
# STEP 5 — database.py
# Async SQLAlchemy 2.x engine + session factory
# MongoDB motor async client
# structlog only — no print()
# =============================================================
import os
import structlog
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from motor.motor_asyncio import AsyncIOMotorClient

log = structlog.get_logger(__name__)

# ── PostgreSQL ────────────────────────────────────────────────
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://user:password@localhost:5432/veridoc",
)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables (run once at startup)."""
    log.info("database.init_db.start")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("database.init_db.done")


# ── MongoDB ───────────────────────────────────────────────────
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB = os.environ.get("MONGO_DB", "veridoc_docs")

mongo_client = AsyncIOMotorClient(MONGO_URL)
mongo_db = mongo_client[MONGO_DB]

# Collections
raw_results_col = mongo_db["raw_results"]
ocr_cache_col = mongo_db["ocr_cache"]
heatmaps_col = mongo_db["heatmaps"]

log.info("database.mongo_connected", url=MONGO_URL, db=MONGO_DB)
