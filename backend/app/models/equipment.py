import enum
from datetime import datetime, date, timezone
from sqlalchemy import String, Date, DateTime, Enum, Integer, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class EquipmentStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_USE = "IN_USE"
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE"
    HIGH_RISK = "HIGH_RISK"
    CRITICAL = "CRITICAL"
    RECALL = "RECALL"
    EMERGENCY_BACKUP = "EMERGENCY_BACKUP"
    REPLACEMENT = "REPLACEMENT"
    DECOMMISSIONED = "DECOMMISSIONED"

class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    machine_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    machine_name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=True)
    model: Mapped[str] = mapped_column(String(100), nullable=True)
    serial_number: Mapped[str] = mapped_column(String(100), nullable=True)
    department: Mapped[str] = mapped_column(String(100), index=True, nullable=True)
    location: Mapped[str] = mapped_column(String(150), nullable=True)
    
    purchase_date: Mapped[date] = mapped_column(Date, nullable=True)
    installation_date: Mapped[date] = mapped_column(Date, nullable=True)
    last_service_date: Mapped[date] = mapped_column(Date, index=True, nullable=True)
    next_service_date: Mapped[date] = mapped_column(Date, index=True, nullable=True)
    
    status: Mapped[EquipmentStatus] = mapped_column(Enum(EquipmentStatus), default=EquipmentStatus.AVAILABLE, index=True, nullable=False)
    is_backup_ready: Mapped[bool] = mapped_column(default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    health_readings = relationship("EquipmentHealthReading", back_populates="equipment", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="equipment", cascade="all, delete-orphan")
    service_requests = relationship("ServiceRequest", back_populates="equipment", cascade="all, delete-orphan")
    maintenance_services = relationship("MaintenanceService", back_populates="equipment", cascade="all, delete-orphan")
    warranties = relationship("Warranty", back_populates="equipment", cascade="all, delete-orphan")
    recalls = relationship("Recall", back_populates="equipment", cascade="all, delete-orphan")
    replacements = relationship("EquipmentReplacement", back_populates="equipment", cascade="all, delete-orphan")
