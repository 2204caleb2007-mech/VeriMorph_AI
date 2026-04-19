# =============================================================
# STEP 4h — explainability_service.py
# Converts raw detection signals into structured, bbox-linked,
# severity-graded, narrative-backed explanation objects.
# Matches types.ts explanations[] field exactly.
# structlog only — no print()
# =============================================================
import structlog
from typing import List, Literal, TypedDict, Optional

log = structlog.get_logger(__name__)

ExplanationType = Literal[
    "font_mismatch",
    "layout_anomaly",
    "image_tampering",
    "text_inconsistency",
    "suspicious_keyword",
    "seal_missing",
]

Severity = Literal["high", "medium", "low"]


class Explanation(TypedDict):
    type: ExplanationType
    description: str
    severity: Severity
    linkedZoneIndex: Optional[int]


def build_explanations(
    forgery_score: int,
    ela_score: float,
    layout_score: int,
    seal_position: str,
    logo_integrity: str,
    text_alignment: str,
    ocr_text: str,
    suspicious_zones: list,
    qr_data: str,
) -> List[Explanation]:
    """
    Build structured explanation list from all analysis signals.
    Every explanation is linked to a suspicious zone index where applicable.
    """
    log.info("explainability_service.building", score=forgery_score, zones=len(suspicious_zones))
    explanations: List[Explanation] = []

    # ELA — image tampering
    if ela_score >= 15.0:
        explanations.append({
            "type": "image_tampering",
            "description": f"Error Level Analysis score of {ela_score:.1f} significantly exceeds the authentic threshold of 5.0, indicating pixel-level manipulation in one or more document regions.",
            "severity": "high",
            "linkedZoneIndex": 0 if suspicious_zones else None,
        })
    elif ela_score >= 5.0:
        explanations.append({
            "type": "image_tampering",
            "description": f"Elevated ELA score ({ela_score:.1f}) suggests possible light image editing. Score is borderline — manual review recommended.",
            "severity": "medium",
            "linkedZoneIndex": 0 if suspicious_zones else None,
        })

    # Layout — structural anomaly
    if layout_score < 60:
        explanations.append({
            "type": "layout_anomaly",
            "description": f"Document layout score of {layout_score}/100 indicates misaligned text blocks or non-standard formatting inconsistent with authorised templates.",
            "severity": "high" if layout_score < 40 else "medium",
            "linkedZoneIndex": None,
        })

    # Seal position
    if seal_position == "none":
        explanations.append({
            "type": "seal_missing",
            "description": "No official seal or stamp detected. Authentic government documents require a verifiable seal in a standard position.",
            "severity": "high",
            "linkedZoneIndex": None,
        })

    # Logo integrity
    if logo_integrity == "missing":
        explanations.append({
            "type": "layout_anomaly",
            "description": "Institutional logo is absent from the expected top-left region. This is a strong indicator of a forged or uncertified document.",
            "severity": "high",
            "linkedZoneIndex": None,
        })
    elif logo_integrity == "partial":
        explanations.append({
            "type": "layout_anomaly",
            "description": "Institutional logo appears partial or degraded, possibly due to cropping or digital alteration.",
            "severity": "medium",
            "linkedZoneIndex": None,
        })

    # Suspicious keywords in OCR text
    flags = [kw for kw in ["VOID", "SAMPLE", "DUPLICATE", "INVALID", "CANCELLED"] if kw in ocr_text.upper()]
    for kw in flags:
        explanations.append({
            "type": "suspicious_keyword",
            "description": f"The word '{kw}' was detected in the document text. This keyword is commonly used to mark invalid or specimen documents.",
            "severity": "high",
            "linkedZoneIndex": None,
        })

    # Text inconsistency (mixed alignment)
    if text_alignment == "mixed":
        explanations.append({
            "type": "text_inconsistency",
            "description": "Text alignment is inconsistent across the document (mixture of left, center and right-aligned blocks), suggesting copy-paste editing.",
            "severity": "medium",
            "linkedZoneIndex": None,
        })

    # Font mismatch — heuristic via zone signals
    high_confidence_zones = [z for z in suspicious_zones if z.get("confidence", 0) >= 75]
    for i, zone in enumerate(high_confidence_zones[:3]):
        explanations.append({
            "type": "font_mismatch",
            "description": f"High-confidence anomaly detected in region '{zone.get('area', 'unknown')}': {zone.get('reason', '')}",
            "severity": "high" if zone.get("confidence", 0) >= 85 else "medium",
            "linkedZoneIndex": i,
        })

    # QR not present — informational
    if not qr_data:
        explanations.append({
            "type": "text_inconsistency",
            "description": "No machine-readable QR code found. Many authenticated documents embed a verifiable QR code for instant validation.",
            "severity": "low",
            "linkedZoneIndex": None,
        })

    log.info("explainability_service.done", count=len(explanations))
    return explanations
