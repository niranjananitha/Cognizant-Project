import enum
from datetime import datetime, date, timezone
from sqlalchemy import Integer, String, Text, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class WarrantyType(str, enum.Enum):
    STANDARD = "STANDARD"
    EXTENDED = "EXTENDED"
    AMC = "AMC"

class Warranty(Base):
    __tablename__ = "warranties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    equipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), index=True, nullable=False)
    
    warranty_type: Mapped[WarrantyType] = mapped_column(Enum(WarrantyType), default=WarrantyType.STANDARD, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    extended_warranty: Mapped[bool] = mapped_column(default=False)
    provider: Mapped[str] = mapped_column(String(150), default="Certified OEM Warranty Provider", nullable=False)
    terms: Mapped[str] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    equipment = relationship("Equipment", back_populates="warranties")
