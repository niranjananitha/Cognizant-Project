import enum
from datetime import datetime, date, timezone
from sqlalchemy import Float, Integer, String, Text, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class ServiceType(str, enum.Enum):
    PAID = "PAID"
    WARRANTY = "WARRANTY"
    AMC = "AMC"

class MaintenanceService(Base):
    __tablename__ = "maintenance_services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    service_request_id: Mapped[int] = mapped_column(Integer, ForeignKey("service_requests.id", ondelete="CASCADE"), index=True, nullable=False)
    equipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), index=True, nullable=False)
    engineer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    service_start_date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    service_end_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    issue: Mapped[str] = mapped_column(String(255), nullable=False)
    root_cause: Mapped[str] = mapped_column(Text, nullable=True)
    work_performed: Mapped[str] = mapped_column(Text, nullable=True)
    parts_replaced: Mapped[str] = mapped_column(Text, nullable=True)
    
    service_type: Mapped[ServiceType] = mapped_column(Enum(ServiceType), default=ServiceType.WARRANTY, nullable=False)
    maintenance_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    downtime_hours: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    service_notes: Mapped[str] = mapped_column(Text, nullable=True)
    next_service_date: Mapped[date] = mapped_column(Date, nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default="COMPLETED", nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    service_request = relationship("ServiceRequest", back_populates="maintenance_services")
    equipment = relationship("Equipment", back_populates="maintenance_services")
    engineer = relationship("User", back_populates="maintenance_services")
    invoices = relationship("Invoice", back_populates="service", cascade="all, delete-orphan")
