# =============================================================
# STEP 4k — validation_service.py
# Full 8-step pipeline orchestrator (Python backend equivalent
# of the frontend pipeline.ts)
# Called by Celery task process_document_task
# structlog only — no print()
# =============================================================
import hashlib
import uuid
import structlog
from datetime import datetime, timezone
from PIL import Image
import io

from services import (
    pdf_service,
    ocr_service,
    hash_service,
    shape_service,
    ela_service,
    qr_service,
    forgery_service,
    explainability_service,
    heatmap_service,
    text_forensics_service,
)

log = structlog.get_logger(__name__)

SUPPORTED_MIMES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}


def _classify_status(score: int) -> str:
    """Classify forgery score into status per types.ts contract."""
    if score >= 85:
        return "authentic"
    elif score >= 50:
        return "suspicious"
    return "fake"


def _extract_metadata(ocr_text: str, filename: str, language: str) -> dict:
    """
    Simple heuristic metadata extraction from OCR text.
    In production, replace with a Groq-powered NER call.
    """
    import re

    institution = "Unknown Institution"
    issue_date = "Unknown"
    cert_type = "Unknown Certificate"

    # Institution: usually in first 3 lines
    first_lines = [l.strip() for l in ocr_text.split("\n")[:5] if l.strip()]
    if first_lines:
        institution = first_lines[0][:80]

    # Date: look for common date patterns
    date_match = re.search(
        r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b", ocr_text
    )
    if date_match:
        issue_date = date_match.group(0)

    # Certificate type: from filename
    fname_lower = filename.lower()
    if "degree" in fname_lower:
        cert_type = "Degree Certificate"
    elif "mark" in fname_lower or "grade" in fname_lower:
        cert_type = "Mark Sheet"
    elif "birth" in fname_lower:
        cert_type = "Birth Certificate"
    elif "transfer" in fname_lower:
        cert_type = "Transfer Certificate"
    else:
        cert_type = "Official Document"

    return {
        "institution": institution,
        "issue_date": issue_date,
        "certificate_type": cert_type,
        "verification_method": "Local Database",
        "language": language,
    }


def run_full_pipeline(
    file_bytes: bytes,
    filename: str,
    language: str = "eng",
    offline: bool = False,
    file_hash: str | None = None,
) -> dict:
    """
    Execute all 8 pipeline steps in order:

    Step 1 — Rasterize      (pdf_service / PIL)
    Step 2 — OCR            (ocr_service — Tesseract/EasyOCR with cache)
    Step 3 — MorphHash      (hash_service — imagehash phash)
    Step 4 — ShapeAnalysis  (shape_service — OpenCV)
    Step 5 — ELA            (ela_service — JPEG compression diff)
    Step 6 — QR Decode      (qr_service — pyzbar 4-pass)
    Step 7 — Forgery Score  (forgery_service — ResNet18 + CV)
    Step 8 — Explainability (explainability_service — structured output)

    Post-pipeline:
      — Heatmap generation
      — Text forensics (Groq)
      — Metadata extraction

    Returns a dict matching the ValidationResult TypeScript interface.
    """
    result_id = f"cert-{int(datetime.now(timezone.utc).timestamp() * 1000)}-{uuid.uuid4().hex[:6]}"
    log.info("validation_service.start", id=result_id, file=filename, lang=language)

    # ── Step 1: Rasterize ─────────────────────────────────────
    log.info("pipeline.step1_rasterize")
    if filename.lower().endswith(".pdf"):
        pages, pdf_raw_text, _ = pdf_service.rasterize_pdf(file_bytes)
        image = pages[0] if pages else Image.new("RGB", (800, 1100), (255, 255, 255))
    else:
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        pdf_raw_text = ""

    # ── Step 2: OCR ───────────────────────────────────────────
    log.info("pipeline.step2_ocr", lang=language)
    ocr_result = ocr_service.run_ocr(image, language)
    ocr_text = pdf_raw_text or ocr_result["text"]
    ocr_words = ocr_result["words"]

    # ── Step 3: MorphHash ─────────────────────────────────────
    log.info("pipeline.step3_hash")
    morph_hash = hash_service.compute_morph_hash(image)

    # ── Step 4: Shape Analysis ────────────────────────────────
    log.info("pipeline.step4_shape")
    shape = shape_service.analyze_shape(image)

    # ── Step 5: ELA ───────────────────────────────────────────
    log.info("pipeline.step5_ela")
    ela = ela_service.run_ela(image)
    ela_score = ela["ela_score"]
    ela_base64 = ela["ela_base64"]

    # ── Step 6: QR Decode ─────────────────────────────────────
    log.info("pipeline.step6_qr")
    qr_data = qr_service.decode_qr(image)

    # ── Step 7: Forgery Score ─────────────────────────────────
    log.info("pipeline.step7_forgery")
    forgery_score, suspicious_zones = forgery_service.compute_forgery_score(
        image,
        ela_score=ela_score,
        shape_layout_score=shape["layoutScore"],
        ocr_word_count=len(ocr_words),
    )
    status = _classify_status(forgery_score)

    # ── Step 8: Explainability ────────────────────────────────
    log.info("pipeline.step8_explainability")
    explanations = explainability_service.build_explanations(
        forgery_score=forgery_score,
        ela_score=ela_score,
        layout_score=shape["layoutScore"],
        seal_position=shape["sealPosition"],
        logo_integrity=shape["logoIntegrity"],
        text_alignment=shape["textAlignment"],
        ocr_text=ocr_text,
        suspicious_zones=suspicious_zones,
        qr_data=qr_data,
    )

    # ── Post: Heatmap ─────────────────────────────────────────
    log.info("pipeline.post_heatmap")
    heatmap_url, heatmap_b64 = heatmap_service.generate_heatmap(
        image, ela_base64, suspicious_zones, result_id
    )

    # ── Post: Text Forensics (Groq) ───────────────────────────
    log.info("pipeline.post_text_forensics")
    forensic_analysis = None
    if not offline and ocr_text.strip():
        try:
            fa = text_forensics_service.analyze_text_forensics(
                ocr_text,
                {"filename": filename, "language": language, "score": forgery_score}
            )
            forensic_analysis = fa.model_dump()
        except Exception as e:
            log.warning("pipeline.text_forensics_failed", error=str(e))

    # ── Post: Metadata ────────────────────────────────────────
    metadata = _extract_metadata(ocr_text, filename, language)

    result = {
        "id": result_id,
        "file_name": filename,
        "forgery_score": forgery_score,
        "status": status,
        "shape_analysis": shape,
        "morph_hash": morph_hash,
        "suspicious_zones": suspicious_zones,
        "metadata": metadata,
        "ocr_text": ocr_text[:2000],   # cap for storage
        "ocr_words": ocr_words[:300],
        "qr_data": qr_data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "explanations": explanations,
        "ela": ela_base64,
        "heatmap_url": heatmap_url,
        "heatmap_base64": heatmap_b64,
        "forensic_analysis": forensic_analysis,
        "compliance_result": None,   # populated by separate endpoint
    }

    log.info("validation_service.done",
             id=result_id, score=forgery_score, status=status,
             zones=len(suspicious_zones), explanations=len(explanations))
    return result
