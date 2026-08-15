from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class HealthReadingCreate(BaseModel):
    operating_temperature_c: float
    system_pressure_cmh2o: float
    total_operating_hours: int
    recent_downtime_hours: int
    backup_battery_voltage_v: float
    flow_rate_lmin: float
    system_error_code: str = "NONE"
    clinical_notes: Optional[str] = ""

class HealthReadingOut(HealthReadingCreate):
    id: int
    equipment_id: int
    days_since_service: int
    recorded_by_id: Optional[int] = None
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)
