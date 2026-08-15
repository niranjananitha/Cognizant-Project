from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.database.session import get_db
from app.models.spare_part import SparePart, SparePartRequest, SparePartRequestStatus
from app.models.user import User, UserRole
from app.schemas.spare_part import SparePartOut, SparePartRequestCreate, SparePartRequestOut
from app.dependencies.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/spare-parts", tags=["Spare Parts Management"])

@router.get("", response_model=List[SparePartOut])
def list_spare_parts_inventory(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SparePart).all()

@router.get("/requests", response_model=List[SparePartRequestOut])
def list_spare_part_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SparePartRequest).order_by(SparePartRequest.requested_at.desc()).all()

@router.post("/requests", response_model=SparePartRequestOut, status_code=status.HTTP_201_CREATED)
def create_spare_part_request(
    req: SparePartRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    part = db.query(SparePart).filter(SparePart.id == req.part_id).first()
    if not part:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spare part item not found in stock catalog.")

    sp_req = SparePartRequest(
        service_request_id=req.service_request_id,
        equipment_id=req.equipment_id,
        requested_by_id=current_user.id,
        part_id=req.part_id,
        quantity=req.quantity,
        reason=req.reason,
        urgency=req.urgency,
        status=SparePartRequestStatus.REQUESTED
    )
    db.add(sp_req)
    db.commit()
    db.refresh(sp_req)
    return sp_req
