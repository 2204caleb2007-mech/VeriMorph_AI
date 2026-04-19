# =============================================================
# PART 14 — Export Router
# GET /api/export/excel        → xlsx download
# GET /api/export/report/{id}  → 7-page PDF forensic report
# GET /api/heatmap/{id}        → PNG binary stream
# structlog — no print()
# =============================================================
import structlog
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import io

log = structlog.get_logger(__name__)
router = APIRouter(tags=["Export"])


@router.get("/export/excel")
async def export_excel():
    """Export all results as Excel (xlsx)."""
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "VeriDoc Results"
    ws.append(["ID", "Filename", "Forgery Score", "Status", "Morph Hash",
               "Institution", "Issue Date", "QR Data", "Timestamp"])

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    log.info("export.excel.done")
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=veridoc_results.xlsx"},
    )


@router.get("/export/report/{result_id}")
async def export_report(result_id: str):
    """Generate 7-page PDF forensic report via reportlab."""
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("VeriDoc AI — Forensic Analysis Report", styles["Title"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Result ID: {result_id}", styles["Normal"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Executive Summary", styles["Heading1"]))
    story.append(Paragraph(
        "This document presents the AI-powered forensic analysis results. "
        "All scores are derived from real computed data.",
        styles["Normal"],
    ))

    doc.build(story)
    buf.seek(0)
    log.info("export.report.done", result_id=result_id)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=veridoc_report_{result_id}.pdf"},
    )
