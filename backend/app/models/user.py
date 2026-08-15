import enum
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class UserRole(str, enum.Enum):
    NURSE_DOCTOR = "NURSE_DOCTOR"
    MAINTENANCE_ENGINEER = "MAINTENANCE_ENGINEER"
    HOSPITAL_ADMIN = "HOSPITAL_ADMIN"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.NURSE_DOCTOR, nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=True, default="General Wards")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    service_requests_raised = relationship("ServiceRequest", foreign_keys="ServiceRequest.raised_by_id", back_populates="raised_by_user")
    service_requests_assigned = relationship("ServiceRequest", foreign_keys="ServiceRequest.assigned_engineer_id", back_populates="assigned_engineer")
    maintenance_services = relationship("MaintenanceService", back_populates="engineer")
    notifications = relationship("Notification", back_populates="user")
