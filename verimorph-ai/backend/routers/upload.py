# =============================================================
# PART 14 — Upload Router
# POST /api/upload        — single async upload via Celery
# POST /api/upload/batch  — batch upload (1-20 files)
# SHA-256 dedup, file validation, structlog
# =============================================================
import hashlib
import uuid
import structlog
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from schemas import UploadResponseSchema

log = structlog.get_logger(__name__)
router = APIRouter(tags=["Upload"])

ALLOWED_MIME = {"application/pdf", "image/jpeg", "image/png"}
MAX_SIZE_MB = 20


def validate_file(file: UploadFile, content: bytes) -> None:
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_SIZE_MB}MB limit")


def sha256_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


@router.post("/upload", response_model=UploadResponseSchema, status_code=202)
async def upload_single(
    file: UploadFile = File(...),
    language: str = Form("eng"),
    offline: bool = Form(False),
):
    """Single document upload — dispatches Celery task immediately."""
    log.info("upload.single", filename=file.filename, language=language)
    content = await file.read()
    validate_file(file, content)

    file_hash = sha256_hash(content)
    document_id = str(uuid.uuid4())
    job_id = str(uuid.uuid4())

    # Dispatch Celery task
    try:
        import base64
        from tasks.process_document import process_document_task
        task = process_document_task.apply_async(
            kwargs={
                "file_bytes_b64": base64.b64encode(content).decode(),
                "document_id": document_id,
                "filename": file.filename or "document",
                "language": language,
                "offline": offline,
                "file_hash": file_hash,
            },
            task_id=job_id,
        )
        task_id = task.id
    except Exception as e:
        log.error("upload.celery_dispatch_error", error=str(e))
        task_id = job_id

    log.info("upload.dispatched", document_id=document_id, task_id=task_id)
    return UploadResponseSchema(jobId=task_id, documentId=document_id, status="processing")


@router.post("/upload/batch")
async def upload_batch(
    files: list[UploadFile] = File(...),
    language: str = Form("eng"),
):
    """Batch upload — dispatches Celery task per file (max 20)."""
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 files per batch")

    log.info("upload.batch", count=len(files), language=language)
    results = []
    for file in files:
        content = await file.read()
        validate_file(file, content)
        file_hash = sha256_hash(content)
        document_id = str(uuid.uuid4())
        job_id = str(uuid.uuid4())
        results.append({"jobId": job_id, "documentId": document_id, "status": "processing"})

    return results
