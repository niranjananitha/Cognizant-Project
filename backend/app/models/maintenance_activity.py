from datetime import datetime, date, time, timezone
from sqlalchemy import String, Text, Date, Time, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class MaintenanceActivity(Base):
    __tablename__ = "maintenance_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    equipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), index=True, nullable=False)
    service_request_id: Mapped[int] = mapped_column(Integer, ForeignKey("service_requests.id", ondelete="CASCADE"), index=True, nullable=False)
    engineer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    activity: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    activity_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    activity_time: Mapped[str] = mapped_column(String(20), default=lambda: datetime.now().strftime("%H:%M"), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    service_request = relationship("ServiceRequest", back_populates="maintenance_activities")
