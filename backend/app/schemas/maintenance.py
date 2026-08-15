from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List
from app.models.maintenance import ServiceType

class MaintenanceServiceCreate(BaseModel):
    service_request_id: int
    equipment_id: int
    issue: str
    root_cause: Optional[str] = None
    work_performed: Optional[str] = None
    parts_replaced: Optional[str] = None
    service_type: ServiceType = ServiceType.WARRANTY
    maintenance_cost: float = 0.0
    downtime_hours: float = 0.0
    service_notes: Optional[str] = None
    next_service_date: Optional[date] = None

class MaintenanceServiceOut(MaintenanceServiceCreate):
    id: int
    engineer_id: Optional[int] = None
    service_start_date: datetime
    service_end_date: Optional[datetime] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MaintenanceActivityCreate(BaseModel):
    activity: str
    notes: Optional[str] = None
    activity_date: Optional[date] = None
    activity_time: Optional[str] = None

class MaintenanceActivityOut(MaintenanceActivityCreate):
    id: int
    equipment_id: int
    service_request_id: int
    engineer_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
