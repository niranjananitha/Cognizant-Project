import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, RegisterRequest
from app.schemas.user import UserOut
from app.dependencies.auth import get_current_user

logger = logging.getLogger("medequip")

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User email already registered.")
    
    user = User(
        full_name=req.full_name,
        email=req.email,
        password_hash=get_password_hash(req.password),
        role=req.role,
        department=req.department,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        logger.warning(f"⚠️ Failed login attempt: Email '{req.email}' not found in database.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(req.password, user.password_hash):
        logger.warning(f"⚠️ Failed login attempt: Password mismatch for email '{req.email}'.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is disabled.")
    
    access_token = create_access_token(subject=user.id)
    return TokenResponse(access_token=access_token, user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
def get_authenticated_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
