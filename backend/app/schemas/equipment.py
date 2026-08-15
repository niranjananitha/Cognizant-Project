from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional, List
from app.models.equipment import EquipmentStatus

class EquipmentBase(BaseModel):
    machine_id: str
    machine_name: str
    category: str
    manufacturer: Optional[str] = "Certified Med Provider"
    model: Optional[str] = None
    serial_number: Optional[str] = None
    department: Optional[str] = "Intensive Care (ICU)"
    location: Optional[str] = "ICU - Bed 01"
    purchase_date: Optional[date] = None
    installation_date: Optional[date] = None
    last_service_date: Optional[date] = None
    next_service_date: Optional[date] = None
    status: EquipmentStatus = EquipmentStatus.AVAILABLE
    is_backup_ready: bool = True

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentUpdate(BaseModel):
    machine_name: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    purchase_date: Optional[date] = None
    installation_date: Optional[date] = None
    last_service_date: Optional[date] = None
    next_service_date: Optional[date] = None
    status: Optional[EquipmentStatus] = None
    is_backup_ready: Optional[bool] = None

class EquipmentOut(EquipmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedEquipmentOut(BaseModel):
    items: List[EquipmentOut]
    total: int
    page: int
    page_size: int
    total_pages: int
