from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from app.models.recall import RecallStatus

class RecallCreate(BaseModel):
    equipment_id: int
    service_request_id: Optional[int] = None
    reason: str
    fault_pattern: Optional[str] = None
    occurrence_count: int = 1
    engineer_assessment: Optional[str] = None

class RecallOut(RecallCreate):
    id: int
    reported_by_id: Optional[int] = None
    status: RecallStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
