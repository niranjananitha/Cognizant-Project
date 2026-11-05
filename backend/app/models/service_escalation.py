"""Chatbot escalation details attached 1:1 to an existing ServiceRequest.

The ticket itself lives in the existing `service_requests` table so it appears in the
Biomedical Engineer workqueue; this table only holds the troubleshooting context."""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ServiceEscalation(Base):
    __tablename__ = "service_escalations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    service_request_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_requests.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    hospital_id: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    conversation_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("chat_conversations.id", ondelete="SET NULL"), nullable=True)

    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    equipment_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    equipment_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    error_code: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)

    nurse_description: Mapped[str] = mapped_column(Text, nullable=False)
    identified_issue: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    troubleshooting_attempted: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    troubleshooting_outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    manual_references: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    safety_critical: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    verified_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    service_request = relationship("ServiceRequest", back_populates="escalation")
