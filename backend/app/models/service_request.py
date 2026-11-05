import enum
from datetime import datetime, timezone
from sqlalchemy import Float, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class ServiceStatus(str, enum.Enum):
    RAISED = "RAISED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    ASSIGNED = "ASSIGNED"
    IN_DIAGNOSIS = "IN_DIAGNOSIS"
    IN_SERVICE = "IN_SERVICE"
    WAITING_FOR_PARTS = "WAITING_FOR_PARTS"
    SERVICE_DELAYED = "SERVICE_DELAYED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    CLOSED = "CLOSED"

class ServicePriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticket_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    equipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), index=True, nullable=False)
    raised_by_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_engineer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    priority: Mapped[ServicePriority] = mapped_column(Enum(ServicePriority), default=ServicePriority.MEDIUM, index=True, nullable=False)
    issue: Mapped[str] = mapped_column(String(255), nullable=False)
    observed_symptoms: Mapped[str] = mapped_column(Text, nullable=True)
    additional_observation: Mapped[str] = mapped_column(Text, nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=True)
    
    status: Mapped[ServiceStatus] = mapped_column(Enum(ServiceStatus), default=ServiceStatus.RAISED, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    equipment = relationship("Equipment", back_populates="service_requests")
    raised_by_user = relationship("User", foreign_keys=[raised_by_id], back_populates="service_requests_raised")
    assigned_engineer = relationship("User", foreign_keys=[assigned_engineer_id], back_populates="service_requests_assigned")
    maintenance_services = relationship("MaintenanceService", back_populates="service_request", cascade="all, delete-orphan")
    maintenance_activities = relationship("MaintenanceActivity", back_populates="service_request", cascade="all, delete-orphan")
    spare_part_requests = relationship("SparePartRequest", back_populates="service_request", cascade="all, delete-orphan")
    recalls = relationship("Recall", back_populates="service_request", cascade="all, delete-orphan")
    escalation = relationship("ServiceEscalation", back_populates="service_request", uselist=False, cascade="all, delete-orphan")
