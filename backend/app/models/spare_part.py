import enum
from datetime import datetime, timezone
from sqlalchemy import Float, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class SparePartRequestStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    ORDERED = "ORDERED"
    RECEIVED = "RECEIVED"
    INSTALLED = "INSTALLED"
    CANCELLED = "CANCELLED"

class SparePart(Base):
    __tablename__ = "spare_parts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    part_name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    quantity_in_stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    minimum_stock: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    supplier: Mapped[str] = mapped_column(String(150), nullable=True, default="Certified OEM Vendor")
    warranty_period: Mapped[str] = mapped_column(String(50), nullable=True, default="12 Months")
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    requests = relationship("SparePartRequest", back_populates="part", cascade="all, delete-orphan")

class SparePartRequest(Base):
    __tablename__ = "spare_part_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    service_request_id: Mapped[int] = mapped_column(Integer, ForeignKey("service_requests.id", ondelete="CASCADE"), index=True, nullable=False)
    equipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), index=True, nullable=False)
    requested_by_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    part_id: Mapped[int] = mapped_column(Integer, ForeignKey("spare_parts.id", ondelete="CASCADE"), index=True, nullable=False)
    
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=True)
    urgency: Mapped[str] = mapped_column(String(50), default="HIGH", nullable=False)
    status: Mapped[SparePartRequestStatus] = mapped_column(Enum(SparePartRequestStatus), default=SparePartRequestStatus.REQUESTED, nullable=False)
    
    requested_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    received_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    installed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Relationships
    service_request = relationship("ServiceRequest", back_populates="spare_part_requests")
    part = relationship("SparePart", back_populates="requests")
    requested_by_user = relationship("User")
