# =============================================================
# PART 14 — Results Router
# GET  /api/result/{job_id}
# GET  /api/result/detail/{result_id}
# GET  /api/history
# DELETE /api/result/{result_id}
# PATCH  /api/result/{result_id}/mark-fake
# structlog — no print()
# =============================================================
import structlog
from fastapi import APIRouter, HTTPException, Query
from celery.result import AsyncResult
from celery_app import celery_app
from schemas import JobStatusSchema

log = structlog.get_logger(__name__)
router = APIRouter(tags=["Results"])


@router.get("/result/{job_id}", response_model=JobStatusSchema)
async def poll_job_status(job_id: str):
    """Poll Celery job status."""
    log.info("results.poll", job_id=job_id)
    task = AsyncResult(job_id, app=celery_app)

    if task.state == "PENDING":
        return JobStatusSchema(jobId=job_id, documentId="", status="pending")
    elif task.state == "STARTED":
        return JobStatusSchema(jobId=job_id, documentId="", status="processing")
    elif task.state == "SUCCESS":
        return JobStatusSchema(jobId=job_id, documentId="", status="done", result=task.result)
    elif task.state == "FAILURE":
        return JobStatusSchema(jobId=job_id, documentId="", status="failed", error=str(task.result))
    return JobStatusSchema(jobId=job_id, documentId="", status="processing")


@router.get("/result/detail/{result_id}")
async def get_result_detail(result_id: str):
    """Get full result from MongoDB."""
    log.info("results.detail", result_id=result_id)
    # In production: query MongoDB raw_results collection
    raise HTTPException(status_code=404, detail="Result not found")


@router.get("/history")
async def get_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
):
    """Paginated history with optional status filter."""
    log.info("results.history", page=page, limit=limit, status=status)
    return {"items": [], "page": page, "total": 0}


@router.delete("/result/{result_id}")
async def delete_result(result_id: str):
    log.info("results.delete", result_id=result_id)
    return {"deleted": result_id}


@router.patch("/result/{result_id}/mark-fake")
async def mark_as_fake(result_id: str):
    log.info("results.mark_fake", result_id=result_id)
    return {"result_id": result_id, "status": "fake"}
