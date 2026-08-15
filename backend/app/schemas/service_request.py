from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from app.models.service_request import ServiceStatus, ServicePriority

class ServiceRequestCreate(BaseModel):
    equipment_id: int
    issue: str
    priority: ServicePriority = ServicePriority.MEDIUM
    observed_symptoms: Optional[str] = None
    additional_observation: Optional[str] = None
    risk_score: Optional[float] = 0.0

class ServiceRequestUpdate(BaseModel):
    priority: Optional[ServicePriority] = None
    assigned_engineer_id: Optional[int] = None
    status: Optional[ServiceStatus] = None
    observed_symptoms: Optional[str] = None
    additional_observation: Optional[str] = None

class ServiceRequestOut(BaseModel):
    id: int
    ticket_number: str
    equipment_id: int
    raised_by_id: Optional[int] = None
    assigned_engineer_id: Optional[int] = None
    priority: ServicePriority
    issue: str
    observed_symptoms: Optional[str] = None
    additional_observation: Optional[str] = None
    risk_score: Optional[float] = 0.0
    status: ServiceStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedServiceRequestOut(BaseModel):
    items: List[ServiceRequestOut]
    total: int
    page: int
    page_size: int
    total_pages: int
