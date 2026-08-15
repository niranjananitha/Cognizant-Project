import enum
from datetime import datetime, timezone
from sqlalchemy import Float, Integer, String, Text, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    equipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), index=True, nullable=False)
    health_reading_id: Mapped[int] = mapped_column(Integer, ForeignKey("equipment_health_readings.id", ondelete="SET NULL"), nullable=True)
    
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 to 100.0
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel), default=RiskLevel.LOW, index=True, nullable=False)
    recommended_fix: Mapped[str] = mapped_column(String(255), nullable=True)
    contributing_factors: Mapped[dict] = mapped_column(JSON, nullable=True)
    
    model_name: Mapped[str] = mapped_column(String(100), default="XGBoost Classifier", nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)
    predicted_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    equipment = relationship("Equipment", back_populates="predictions")
    health_reading = relationship("EquipmentHealthReading", back_populates="predictions")
