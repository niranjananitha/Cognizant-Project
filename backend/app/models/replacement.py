import enum
from datetime import datetime, date, timezone
from sqlalchemy import Integer, String, Text, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class ReplacementStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class EquipmentReplacement(Base):
    __tablename__ = "equipment_replacements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    equipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), index=True, nullable=False)
    recall_id: Mapped[int] = mapped_column(Integer, ForeignKey("recalls.id", ondelete="SET NULL"), nullable=True)
    
    old_serial_number: Mapped[str] = mapped_column(String(100), nullable=True)
    new_serial_number: Mapped[str] = mapped_column(String(100), nullable=True)
    replacement_reason: Mapped[str] = mapped_column(Text, nullable=False)
    replacement_date: Mapped[date] = mapped_column(Date, nullable=True)
    
    status: Mapped[ReplacementStatus] = mapped_column(Enum(ReplacementStatus), default=ReplacementStatus.REQUESTED, index=True, nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    equipment = relationship("Equipment", back_populates="replacements")
    recall = relationship("Recall", back_populates="replacements")
