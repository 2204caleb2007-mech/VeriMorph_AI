# =============================================================
# STEP 5 — models.py
# SQLAlchemy 2.x ORM models matching schema.sql exactly
# All relationships, indexes, and FK constraints included
# structlog only — no print()
# =============================================================
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


def _utcnow():
    return datetime.now(timezone.utc)


def _new_uuid():
    return str(uuid.uuid4())


# ── Users ─────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_new_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(Text, nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="officer")
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default=func.now())

    documents = relationship("Document", back_populates="user", lazy="selectin")
    chat_messages = relationship("ChatMessageModel", back_populates="user", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User {self.email}>"


# ── Documents ─────────────────────────────────────────────────
class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_new_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    filename = Column(Text, nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)   # SHA-256
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    status = Column(String(20), default="pending")               # pending/processing/done/failed
    celery_task_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default=func.now())

    user = relationship("User", back_populates="documents")
    results = relationship("ValidationResultModel", back_populates="document", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Document {self.filename}>"


# ── Validation Results ────────────────────────────────────────
class ValidationResultModel(Base):
    __tablename__ = "validation_results"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_new_uuid)
    document_id = Column(UUID(as_uuid=False), ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    filename = Column(Text, nullable=False)
    file_hash = Column(String(64), nullable=True, index=True)
    forgery_score = Column(Integer, nullable=True)
    status = Column(String(20), nullable=True, index=True)        # authentic/suspicious/fake
    layout_score = Column(Integer, nullable=True)
    seal_position = Column(String(50), nullable=True)
    text_alignment = Column(String(20), nullable=True)
    logo_integrity = Column(String(20), nullable=True)
    morph_hash = Column(String(20), nullable=True)
    institution = Column(Text, nullable=True)
    issue_date = Column(String(50), nullable=True)
    certificate_type = Column(String(100), nullable=True)
    verification_method = Column(String(50), nullable=True)
    qr_data = Column(Text, nullable=True)
    ocr_text_sample = Column(Text, nullable=True)
    ela_score = Column(Float, nullable=True)
    noise_score = Column(Float, nullable=True)
    forensic_verdict = Column(String(60), nullable=True)
    forensic_score = Column(Integer, nullable=True)
    compliance_score = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default=func.now(), index=True)

    document = relationship("Document", back_populates="results")
    anomalies = relationship("AnomalyModel", back_populates="result", lazy="selectin",
                             cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ValidationResult {self.filename} score={self.forgery_score}>"


# ── Anomalies ─────────────────────────────────────────────────
class AnomalyModel(Base):
    __tablename__ = "anomalies"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_new_uuid)
    result_id = Column(UUID(as_uuid=False), ForeignKey("validation_results.id", ondelete="CASCADE"))
    anomaly_type = Column(String(50), nullable=True)
    area = Column(String(100), nullable=True)
    confidence = Column(Integer, nullable=True)
    reason = Column(Text, nullable=True)
    severity = Column(String(10), nullable=True)
    bbox_x = Column(Integer, nullable=True)
    bbox_y = Column(Integer, nullable=True)
    bbox_width = Column(Integer, nullable=True)
    bbox_height = Column(Integer, nullable=True)

    result = relationship("ValidationResultModel", back_populates="anomalies")


# ── Chat Messages ─────────────────────────────────────────────
class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_new_uuid)
    session_id = Column(String(255), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    role = Column(String(20), nullable=False)       # user/assistant/system
    content = Column(Text, nullable=False)
    source = Column(String(20), nullable=True)      # groq/tavily/deepseek/pdf
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default=func.now(), index=True)

    user = relationship("User", back_populates="chat_messages")

    def __repr__(self) -> str:
        return f"<ChatMessage {self.role[:4]} session={self.session_id[:8]}>"
