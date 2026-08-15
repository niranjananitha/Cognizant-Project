import enum
from datetime import datetime, timezone
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class RecallStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    RECALL_APPROVED = "RECALL_APPROVED"
    REPLACEMENT_REQUIRED = "REPLACEMENT_REQUIRED"
    REPLACEMENT_IN_PROGRESS = "REPLACEMENT_IN_PROGRESS"
    REPLACED = "REPLACED"
    CLOSED = "CLOSED"

class Recall(Base):
    __tablename__ = "recalls"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    equipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), index=True, nullable=False)
    service_request_id: Mapped[int] = mapped_column(Integer, ForeignKey("service_requests.id", ondelete="SET NULL"), nullable=True)
    reported_by_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    fault_pattern: Mapped[str] = mapped_column(Text, nullable=True)
    occurrence_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    engineer_assessment: Mapped[str] = mapped_column(Text, nullable=True)
    
    status: Mapped[RecallStatus] = mapped_column(Enum(RecallStatus), default=RecallStatus.REPORTED, index=True, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    equipment = relationship("Equipment", back_populates="recalls")
    service_request = relationship("ServiceRequest", back_populates="recalls")
    reported_by_user = relationship("User")
    replacements = relationship("EquipmentReplacement", back_populates="recall", cascade="all, delete-orphan")
