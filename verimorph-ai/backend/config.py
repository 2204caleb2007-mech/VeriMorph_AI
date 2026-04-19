# =============================================================
# PART 17 — Backend: config.py (pydantic-settings)
# All env vars loaded from .env — no hardcoded keys
# =============================================================
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # API Keys (PART 3 — HIGHEST PRIORITY)
    TAVILY_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Server
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Databases
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/veridoc"
    MONGO_URL: str = "mongodb://localhost:27017"
    MONGO_DB: str = "veridoc_docs"

    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # File limits
    MAX_FILE_SIZE_MB: int = 20
    MAX_BATCH_FILES: int = 20

    # Tesseract
    TESSERACT_CMD: str = "/usr/bin/tesseract"

    # Processing
    CONCURRENCY_LIMIT: int = 4
    RESULT_TTL_HOURS: int = 24
    OCR_CACHE_TTL_SECONDS: int = 3600

    # Auth
    JWT_SECRET_KEY: str = "changeme_to_random_256bit_secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ML Models
    MODEL_PATH: str = "./models/forgery_detector.pt"
    DEVICE: str = "cpu"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
