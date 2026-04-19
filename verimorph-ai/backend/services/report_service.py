# =============================================================
# STEP 4j — report_service.py
# 7-page PDF forensic report via reportlab
# structlog only — no print()
# =============================================================
import io
import structlog
from typing import Any

log = structlog.get_logger(__name__)


def generate_pdf_report(result: dict) -> bytes:
    """
    Generate a 7-section forensic PDF report from a validation result dict.
    Returns raw PDF bytes.
    """
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm

    log.info("report_service.generating", result_id=result.get("id"))

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=20 * mm, rightMargin=20 * mm,
                            topMargin=20 * mm, bottomMargin=20 * mm)
    styles = getSampleStyleSheet()
    story = []

    heading1 = ParagraphStyle("h1", parent=styles["Heading1"], fontSize=16, spaceAfter=6)
    heading2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=12, spaceAfter=4)
    body = styles["Normal"]
    code_style = ParagraphStyle("code", fontName="Courier", fontSize=9, spaceAfter=2)

    def hr(): return HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey, spaceAfter=6)
    def sp(n=6): return Spacer(1, n)

    status = result.get("status", "unknown")
    score = result.get("forgery_score", 0)
    status_color = {
        "authentic": colors.green,
        "suspicious": colors.orange,
        "fake": colors.red,
    }.get(status, colors.grey)

    # ── PAGE 1: Cover ─────────────────────────────────────────
    story += [
        Paragraph("VeriDoc AI — Forensic Analysis Report", heading1),
        Paragraph(f"Document: {result.get('file_name', 'Unknown')}", body),
        Paragraph(f"Report ID: {result.get('id', 'N/A')}", body),
        Paragraph(f"Generated: {result.get('timestamp', 'N/A')}", body),
        sp(12), hr(),
        Paragraph("VERDICT SUMMARY", heading2),
        Table(
            [
                ["Status", status.upper()],
                ["Authenticity Score", f"{score}/100"],
                ["Morph Hash", result.get("morph_hash", "N/A")],
            ],
            colWidths=[60 * mm, 110 * mm],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
                ("TEXTCOLOR", (1, 0), (1, 0), status_color),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]),
        ),
        sp(8),
    ]

    # ── PAGE 2: Metadata ──────────────────────────────────────
    story += [hr(), Paragraph("Document Metadata", heading2)]
    meta = result.get("metadata", {})
    meta_rows = [
        ["Institution", meta.get("institution", "N/A")],
        ["Issue Date", meta.get("issue_date", "N/A")],
        ["Certificate Type", meta.get("certificate_type", "N/A")],
        ["Verification Method", meta.get("verification_method", "N/A")],
        ["Language", meta.get("language", "N/A")],
    ]
    story.append(Table(meta_rows, colWidths=[60 * mm, 110 * mm], style=TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.whitesmoke),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("PADDING", (0, 0), (-1, -1), 5),
    ])))
    story.append(sp(8))

    # ── PAGE 3: Shape Analysis ────────────────────────────────
    story += [hr(), Paragraph("Shape & Layout Analysis", heading2)]
    shape = result.get("shape_analysis", {})
    shape_rows = [
        ["Layout Score", f"{shape.get('layout_score', 'N/A')}/100"],
        ["Seal Position", shape.get("seal_position", "N/A")],
        ["Text Alignment", shape.get("text_alignment", "N/A")],
        ["Logo Integrity", shape.get("logo_integrity", "N/A")],
    ]
    story.append(Table(shape_rows, colWidths=[60 * mm, 110 * mm], style=TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.whitesmoke),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("PADDING", (0, 0), (-1, -1), 5),
    ])))
    story.append(sp(8))

    # ── PAGE 4: Suspicious Zones ──────────────────────────────
    story += [hr(), Paragraph("Suspicious Zones Detected", heading2)]
    zones = result.get("suspicious_zones", [])
    if zones:
        zone_rows = [["Area", "Confidence", "Reason"]]
        for z in zones:
            zone_rows.append([
                z.get("area", ""), f"{z.get('confidence', 0)}%", z.get("reason", "")[:80]
            ])
        story.append(Table(zone_rows, colWidths=[40 * mm, 25 * mm, 105 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
            ("PADDING", (0, 0), (-1, -1), 4),
        ])))
    else:
        story.append(Paragraph("No suspicious zones detected.", body))
    story.append(sp(8))

    # ── PAGE 5: Forensic Text Analysis ────────────────────────
    fa = result.get("forensic_analysis")
    if fa:
        story += [hr(), Paragraph("AI Text Forensic Analysis", heading2)]
        fa_rows = [
            ["Verdict", fa.get("verdict", "N/A")],
            ["Authenticity Score", str(fa.get("authenticity_score", "N/A"))],
            ["Tampering Risk", fa.get("tampering_risk", "N/A").upper()],
            ["AI Generated Likelihood", fa.get("ai_generated_likelihood", "N/A").upper()],
        ]
        story.append(Table(fa_rows, colWidths=[70 * mm, 100 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.whitesmoke),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("PADDING", (0, 0), (-1, -1), 5),
        ])))
        story += [sp(4), Paragraph("Key Findings:", heading2)]
        for reason in fa.get("key_reasons", []):
            story.append(Paragraph(f"• {reason}", body))
        story.append(sp(8))

    # ── PAGE 6: OCR Text Sample ───────────────────────────────
    story += [hr(), Paragraph("Extracted OCR Text (sample)", heading2)]
    ocr_sample = str(result.get("ocr_text", ""))[:500]
    story.append(Paragraph(ocr_sample.replace("\n", "<br/>") or "No text extracted.", code_style))
    story.append(sp(4))
    story.append(Paragraph(f"QR Code Data: {result.get('qr_data', 'None detected')}", body))
    story.append(sp(8))

    # ── PAGE 7: Compliance Result ─────────────────────────────
    cr = result.get("compliance_result")
    if cr:
        story += [hr(), Paragraph("Compliance Validation", heading2)]
        story.append(Paragraph(f"Overall Compliance Score: {cr.get('overall_compliance_score', 'N/A')}/100", body))
        story.append(Paragraph(f"Aligned Statements: {cr.get('aligned_percentage', 0):.1f}%", body))
        violations = cr.get("violations", [])
        if violations:
            story.append(sp(4))
            story.append(Paragraph(f"Violations ({len(violations)}):", heading2))
            for v in violations[:5]:
                story.append(Paragraph(f"• {v.get('violating_statement', '')[:100]}", body))
        missing = cr.get("missing_requirements", [])
        if missing:
            story.append(sp(4))
            story.append(Paragraph("Missing Requirements:", heading2))
            for m in missing[:5]:
                story.append(Paragraph(f"• {m[:100]}", body))

    doc.build(story)
    pdf_bytes = buf.getvalue()
    log.info("report_service.done", size_bytes=len(pdf_bytes))
    return pdf_bytes
