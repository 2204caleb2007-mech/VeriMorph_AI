# =============================================================
# PART 15 — Pydantic Schemas (schemas.py)
# Authoritative — no field may be added, removed, or renamed
# =============================================================
from pydantic import BaseModel
from typing import List, Optional, Literal


class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int


class AnomalySchema(BaseModel):
    type: Literal[
        "font_mismatch",
        "layout_anomaly",
        "image_tampering",
        "text_inconsistency",
        "suspicious_keyword",
        "seal_missing",
        "ela_anomaly",
        "noise_anomaly",
        "compression_artifact",
    ]
    area: str
    confidence: int
    reason: str
    severity: Literal["high", "medium", "low"]
    bbox: Optional[BoundingBox] = None
    linkedZoneIndex: Optional[int] = None


class ForensicTextResult(BaseModel):
    authenticity_score: int  # 0 (certain forgery) to 100 (certainly authentic)
    tampering_risk: Literal["low", "medium", "high"]
    ai_generated_likelihood: Literal["low", "medium", "high"]
    verdict: Literal["Likely Authentic", "Suspicious - Requires Review", "Likely Forged"]
    key_reasons: List[str]       # Top 1-3 reasons for verdict
    flagged_passages: List[str]  # Specific suspicious strings from document text


class ComplianceViolation(BaseModel):
    violating_statement: str
    reference_rule: str


class ComplianceResult(BaseModel):
    overall_compliance_score: int   # 0 (complete violation) to 100 (full compliance)
    aligned_percentage: float       # % of statements found compliant
    violations: List[ComplianceViolation]
    missing_requirements: List[str]


class ChatPayload(BaseModel):
    user_query: str
    model: Literal["llama3-70b-8192", "mixtral-8x7b-32768", "deepseek-chat"]
    history: List[dict]
    pdf_text: Optional[str] = None
    session_id: str


class ValidationResultSchema(BaseModel):
    id: str
    fileName: str
    forgeryScore: int
    status: Literal["authentic", "suspicious", "fake"]
    morphHash: str
    suspiciousZones: List[AnomalySchema]
    explanations: List[AnomalySchema]
    metadata: dict
    ocrText: str
    ocrWords: List[dict]
    qrData: str
    ela: Optional[dict] = None
    heatmapBase64: Optional[str] = None
    timestamp: str
    forensicAnalysis: Optional[ForensicTextResult] = None
    complianceResult: Optional[ComplianceResult] = None


class UploadResponseSchema(BaseModel):
    jobId: str
    documentId: str
    status: str


class JobStatusSchema(BaseModel):
    jobId: str
    documentId: str
    status: Literal["pending", "processing", "done", "failed"]
    result: Optional[ValidationResultSchema] = None
    error: Optional[str] = None


class ChatMessageSchema(BaseModel):
    id: str
    session_id: str
    role: Literal["user", "assistant", "system"]
    content: str
    source: Optional[str] = None
    sources: Optional[List[dict]] = None


class TextForensicsRequest(BaseModel):
    document_text: str
    metadata: dict


class ComplianceRequest(BaseModel):
    target_text: str
    reference_text: str
