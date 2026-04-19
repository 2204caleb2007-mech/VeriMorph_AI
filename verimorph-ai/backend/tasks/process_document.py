# =============================================================
# PART 17 — Celery Task: Process Document
# bind=True, max_retries=3, default_retry_delay=5
# Non-blocking, structlog, no print()
# =============================================================
import base64
import structlog
from celery_app import celery_app

log = structlog.get_logger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def process_document_task(
    self,
    file_bytes_b64: str,
    document_id: str,
    filename: str,
    language: str,
    offline: bool,
    file_hash: str,
):
    """
    Full forensic pipeline orchestrated by Celery.
    Retries up to 3 times on failure with 5s delay.
    """
    log.info("task.start", document_id=document_id, filename=filename, language=language)
    try:
        file_bytes = base64.b64decode(file_bytes_b64)
        from services.validation_service import run_full_pipeline
        result = run_full_pipeline(file_bytes, filename, language, offline, file_hash)
        log.info("task.done", document_id=document_id, score=result.get("forgeryScore"))
        return result
    except Exception as exc:
        log.error("task.failed", document_id=document_id, error=str(exc))
        raise self.retry(exc=exc)
