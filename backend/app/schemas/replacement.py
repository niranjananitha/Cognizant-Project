from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional
from app.models.replacement import ReplacementStatus

class EquipmentReplacementCreate(BaseModel):
    equipment_id: int
    recall_id: Optional[int] = None
    old_serial_number: Optional[str] = None
    new_serial_number: Optional[str] = None
    replacement_reason: str
    replacement_date: Optional[date] = None
    notes: Optional[str] = None

class EquipmentReplacementOut(EquipmentReplacementCreate):
    id: int
    status: ReplacementStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
