from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date, timezone
from typing import List

from app.database.session import get_db
from app.models.equipment import Equipment, EquipmentStatus
from app.models.replacement import EquipmentReplacement, ReplacementStatus
from app.models.user import User, UserRole
from app.schemas.replacement import EquipmentReplacementCreate, EquipmentReplacementOut
from app.dependencies.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/replacements", tags=["Equipment Replacements"])

@router.get("", response_model=List[EquipmentReplacementOut])
def list_replacements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(EquipmentReplacement).order_by(EquipmentReplacement.created_at.desc()).all()

@router.post("", response_model=EquipmentReplacementOut, status_code=status.HTTP_201_CREATED)
def create_replacement_record(
    req: EquipmentReplacementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.HOSPITAL_ADMIN, UserRole.MAINTENANCE_ENGINEER]))
):
    equip = db.query(Equipment).filter(Equipment.id == req.equipment_id).first()
    if not equip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found.")

    repl = EquipmentReplacement(
        equipment_id=equip.id,
        recall_id=req.recall_id,
        old_serial_number=req.old_serial_number or equip.serial_number,
        new_serial_number=req.new_serial_number,
        replacement_reason=req.replacement_reason,
        replacement_date=req.replacement_date or date.today(),
        status=ReplacementStatus.REQUESTED,
        notes=req.notes
    )

    equip.status = EquipmentStatus.REPLACEMENT

    db.add(repl)
    db.commit()
    db.refresh(repl)
    return repl
