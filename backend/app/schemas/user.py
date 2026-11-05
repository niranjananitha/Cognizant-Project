from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional
from app.models.user import UserRole

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: UserRole
    department: Optional[str] = "General Wards"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(UserBase):
    id: int
    hospital_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
