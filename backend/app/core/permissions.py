from fastapi import HTTPException, status
from typing import List, Union
from app.models.user import User, UserRole

def check_role_permission(user: User, allowed_roles: List[UserRole]):
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. User role '{user.role.value}' does not have permission for this action."
        )

def require_nurse_or_doctor(user: User):
    check_role_permission(user, [UserRole.NURSE_DOCTOR, UserRole.HOSPITAL_ADMIN])

def require_engineer(user: User):
    check_role_permission(user, [UserRole.MAINTENANCE_ENGINEER, UserRole.HOSPITAL_ADMIN])

def require_admin(user: User):
    check_role_permission(user, [UserRole.HOSPITAL_ADMIN])
