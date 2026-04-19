# =============================================================
# PART 14 — Heatmap Router
# GET /api/heatmap/{result_id} → PNG binary stream
# =============================================================
import structlog
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

log = structlog.get_logger(__name__)
router = APIRouter(tags=["Heatmap"])


@router.get("/heatmap/{result_id}")
async def get_heatmap(result_id: str):
    """Return PNG heatmap for a given result."""
    heatmap_path = f"static/heatmaps/{result_id}.png"
    if not os.path.exists(heatmap_path):
        raise HTTPException(status_code=404, detail="Heatmap not found")
    log.info("heatmap.serve", result_id=result_id)
    return FileResponse(heatmap_path, media_type="image/png")
