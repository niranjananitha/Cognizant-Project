from pydantic import BaseModel, ConfigDict, Field, model_validator
from datetime import datetime
from typing import Optional, List
from app.models.service_request import ServiceStatus, ServicePriority

# Ticket lifecycle shown to clinical staff:
# NEW -> ACKNOWLEDGED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> VERIFIED -> CLOSED
DISPLAY_STATUS = {
    ServiceStatus.RAISED: "NEW",
    ServiceStatus.ACKNOWLEDGED: "ACKNOWLEDGED",
    ServiceStatus.ASSIGNED: "ASSIGNED",
    ServiceStatus.IN_DIAGNOSIS: "IN_PROGRESS",
    ServiceStatus.IN_SERVICE: "IN_PROGRESS",
    ServiceStatus.WAITING_FOR_PARTS: "IN_PROGRESS",
    ServiceStatus.SERVICE_DELAYED: "IN_PROGRESS",
    ServiceStatus.COMPLETED: "RESOLVED",
    ServiceStatus.CLOSED: "CLOSED",
    ServiceStatus.REJECTED: "REJECTED",
}


class EscalationCreate(BaseModel):
    """Troubleshooting context captured when a nurse escalates from the chatbot."""
    conversation_id: Optional[int] = None
    error_code: Optional[str] = Field(None, max_length=50)
    nurse_description: str = Field(..., min_length=5, max_length=4000)
    identified_issue: Optional[str] = Field(None, max_length=2000)
    troubleshooting_attempted: List[str] = Field(default_factory=list, max_length=25)
    troubleshooting_outcome: str = Field("NOT_RESOLVED", max_length=500)
    patient_safety_concern: bool = False


class ManualReference(BaseModel):
    document_id: Optional[int] = None
    document_title: str
    version: Optional[str] = None
    page_number: Optional[int] = None
    section_heading: Optional[str] = None


class EscalationOut(BaseModel):
    id: int
    hospital_id: str
    conversation_id: Optional[int] = None
    department: Optional[str] = None
    equipment_category: Optional[str] = None
    manufacturer: Optional[str] = None
    equipment_model: Optional[str] = None
    error_code: Optional[str] = None
    nurse_description: str
    identified_issue: Optional[str] = None
    troubleshooting_attempted: Optional[List[str]] = None
    troubleshooting_outcome: Optional[str] = None
    manual_references: Optional[List[ManualReference]] = None
    safety_critical: bool = False
    verified_at: Optional[datetime] = None
    verified_by_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ServiceRequestCreate(BaseModel):
    equipment_id: int
    issue: str
    priority: ServicePriority = ServicePriority.MEDIUM
    observed_symptoms: Optional[str] = None
    additional_observation: Optional[str] = None
    risk_score: Optional[float] = 0.0
    # Present when the request is raised from the Equipment Assistance chatbot.
    escalation: Optional[EscalationCreate] = None

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
    escalation: Optional[EscalationOut] = None
    display_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def _derive_display_status(self):
        display = DISPLAY_STATUS.get(self.status, self.status.value)
        if self.status == ServiceStatus.COMPLETED and self.escalation and self.escalation.verified_at:
            display = "VERIFIED"
        self.display_status = display
        return self

class PaginatedServiceRequestOut(BaseModel):
    items: List[ServiceRequestOut]
    total: int
    page: int
    page_size: int
    total_pages: int
