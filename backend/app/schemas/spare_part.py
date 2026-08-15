from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from app.models.spare_part import SparePartRequestStatus

class SparePartOut(BaseModel):
    id: int
    product_id: str
    part_name: str
    description: Optional[str] = None
    quantity_in_stock: int
    minimum_stock: int
    unit_cost: float
    supplier: Optional[str] = "Certified OEM Vendor"
    warranty_period: Optional[str] = "12 Months"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SparePartRequestCreate(BaseModel):
    service_request_id: int
    equipment_id: int
    part_id: int
    quantity: int = 1
    reason: Optional[str] = None
    urgency: str = "HIGH"

class SparePartRequestOut(SparePartRequestCreate):
    id: int
    requested_by_id: Optional[int] = None
    status: SparePartRequestStatus
    requested_at: datetime
    received_at: Optional[datetime] = None
    installed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
