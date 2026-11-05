"""Knowledge Base: manufacturer documents uploaded by the Hospital Administrator
and the searchable text chunks extracted from them."""
import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class DocumentType(str, enum.Enum):
    USER_MANUAL = "USER_MANUAL"
    TROUBLESHOOTING_GUIDE = "TROUBLESHOOTING_GUIDE"
    MAINTENANCE_DOCUMENT = "MAINTENANCE_DOCUMENT"
    ERROR_CODE_REFERENCE = "ERROR_CODE_REFERENCE"


class DocumentStatus(str, enum.Enum):
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"
    SUPERSEDED = "SUPERSEDED"  # replaced by a newer version; chunks removed from retrieval


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"
    __table_args__ = (
        Index("ix_kdoc_hospital_category_model", "hospital_id", "equipment_category", "equipment_model"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    hospital_id: Mapped[str] = mapped_column(String(50), index=True, nullable=False)

    equipment_category: Mapped[str] = mapped_column(String(100), nullable=False)
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=False)
    equipment_model: Mapped[str] = mapped_column(String(100), nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[DocumentType] = mapped_column(Enum(DocumentType), nullable=False)
    version: Mapped[str] = mapped_column(String(30), nullable=False, default="1.0")

    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    content_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    page_count: Mapped[int] = mapped_column(Integer, default=0)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)

    status: Mapped[DocumentStatus] = mapped_column(Enum(DocumentStatus), default=DocumentStatus.PROCESSING, index=True, nullable=False)
    processing_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    superseded_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("knowledge_documents.id", ondelete="SET NULL"), nullable=True)

    uploaded_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    uploaded_by = relationship("User")
    chunks = relationship("KnowledgeChunk", back_populates="document", cascade="all, delete-orphan")


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"
    __table_args__ = (
        Index("ix_kchunk_document_index", "document_id", "chunk_index"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    document_id: Mapped[int] = mapped_column(Integer, ForeignKey("knowledge_documents.id", ondelete="CASCADE"), nullable=False)
    hospital_id: Mapped[str] = mapped_column(String(50), index=True, nullable=False)

    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    section_heading: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # Space-delimited, normalised error codes found in this chunk, e.g. " E5 ALM12 "
    error_codes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    document = relationship("KnowledgeDocument", back_populates="chunks")
