from pydantic import BaseModel, EmailStr
from app.models.user import UserRole
from app.schemas.user import UserOut

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.NURSE_DOCTOR
    department: str = "General Wards"
