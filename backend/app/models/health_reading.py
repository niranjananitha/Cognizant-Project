from datetime import datetime, timezone
from sqlalchemy import Float, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class EquipmentHealthReading(Base):
    __tablename__ = "equipment_health_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    equipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), index=True, nullable=False)
    
    operating_temperature_c: Mapped[float] = mapped_column(Float, nullable=False)
    system_pressure_cmh2o: Mapped[float] = mapped_column(Float, nullable=False)
    total_operating_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    recent_downtime_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    backup_battery_voltage_v: Mapped[float] = mapped_column(Float, nullable=False)
    flow_rate_lmin: Mapped[float] = mapped_column(Float, nullable=False)
    system_error_code: Mapped[str] = mapped_column(String(50), default="NONE", nullable=False)
    clinical_notes: Mapped[str] = mapped_column(Text, nullable=True)
    days_since_service: Mapped[int] = mapped_column(Integer, nullable=False, default=90)
    
    recorded_by_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    equipment = relationship("Equipment", back_populates="health_readings")
    recorded_by_user = relationship("User")
    predictions = relationship("Prediction", back_populates="health_reading", cascade="all, delete-orphan")
