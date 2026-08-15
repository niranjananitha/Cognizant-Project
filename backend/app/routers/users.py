from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserOut, UserCreate, UserUpdate
from app.dependencies.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.HOSPITAL_ADMIN, UserRole.MAINTENANCE_ENGINEER]))
):
    return db.query(User).all()

@router.get("/{user_id}", response_model=UserOut)
def get_user_by_id(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user
