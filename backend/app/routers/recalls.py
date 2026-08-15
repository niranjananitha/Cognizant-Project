from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.database.session import get_db
from app.models.equipment import Equipment, EquipmentStatus
from app.models.recall import Recall, RecallStatus
from app.models.user import User, UserRole
from app.schemas.recall import RecallCreate, RecallOut
from app.dependencies.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/recalls", tags=["Recall Management"])

@router.get("", response_model=List[RecallOut])
def list_recalls(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Recall).order_by(Recall.created_at.desc()).all()

@router.get("/{id}", response_model=RecallOut)
def get_recall_detail(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recall = db.query(Recall).filter(Recall.id == id).first()
    if not recall:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recall record not found.")
    return recall

@router.post("", response_model=RecallOut, status_code=status.HTTP_201_CREATED)
def create_recall_recommendation(
    req: RecallCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER, UserRole.HOSPITAL_ADMIN, UserRole.NURSE_DOCTOR]))
):
    equip = db.query(Equipment).filter(Equipment.id == req.equipment_id).first()
    if not equip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found.")

    # Check repeated faults count for automatic warning boost
    existing_recalls = db.query(Recall).filter(Recall.equipment_id == equip.id).count()
    occ_count = req.occurrence_count + existing_recalls

    recall = Recall(
        equipment_id=equip.id,
        service_request_id=req.service_request_id,
        reported_by_id=current_user.id,
        reason=req.reason,
        fault_pattern=req.fault_pattern,
        occurrence_count=occ_count,
        engineer_assessment=req.engineer_assessment,
        status=RecallStatus.REPORTED
    )
    
    equip.status = EquipmentStatus.RECALL

    db.add(recall)
    db.commit()
    db.refresh(recall)
    return recall

@router.post("/{id}/approve", response_model=RecallOut)
def approve_recall(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.HOSPITAL_ADMIN]))
):
    recall = db.query(Recall).filter(Recall.id == id).first()
    if not recall:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recall record not found.")

    recall.status = RecallStatus.RECALL_APPROVED
    db.commit()
    db.refresh(recall)
    return recall

@router.post("/{id}/close", response_model=RecallOut)
def close_recall(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.HOSPITAL_ADMIN]))
):
    recall = db.query(Recall).filter(Recall.id == id).first()
    if not recall:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recall record not found.")

    recall.status = RecallStatus.CLOSED
    db.commit()
    db.refresh(recall)
    return recall
