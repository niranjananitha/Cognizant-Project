from datetime import datetime, date, timezone
from sqlalchemy import Float, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    equipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), index=True, nullable=False)
    service_id: Mapped[int] = mapped_column(Integer, ForeignKey("maintenance_services.id", ondelete="SET NULL"), nullable=True)
    
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    invoice_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    
    subtotal: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tax: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    document_path: Mapped[str] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    equipment = relationship("Equipment")
    service = relationship("MaintenanceService", back_populates="invoices")
