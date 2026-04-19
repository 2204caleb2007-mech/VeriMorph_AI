# =============================================================
# PART 14 — Forensics Router
# POST /api/forensics/text   → ForensicTextResult
# POST /api/forensics/compliance → ComplianceResult
# structlog — no print()
# =============================================================
import structlog
from fastapi import APIRouter
from schemas import TextForensicsRequest, ComplianceRequest, ForensicTextResult, ComplianceResult
from services import text_forensics_service, compliance_service

log = structlog.get_logger(__name__)
router = APIRouter(tags=["Forensics"])


@router.post("/forensics/text", response_model=ForensicTextResult)
async def analyze_text(payload: TextForensicsRequest):
    """
    Text forensics analysis.
    Returns ForensicTextResult JSON — no extra text, only JSON.
    """
    log.info("forensics.text", text_length=len(payload.document_text))
    return text_forensics_service.analyze_text_forensics(
        payload.document_text,
        payload.metadata,
    )


@router.post("/forensics/compliance", response_model=ComplianceResult)
async def validate_compliance(payload: ComplianceRequest):
    """
    Compliance validator agent.
    Uses vector retrieval + LLM to classify COMPLIANT/VIOLATION/MISSING_REQUIREMENT.
    """
    log.info("forensics.compliance", target_len=len(payload.target_text), ref_len=len(payload.reference_text))
    return compliance_service.validate_compliance(
        payload.target_text,
        payload.reference_text,
    )
