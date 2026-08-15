from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date, timezone
from typing import List, Optional

from app.database.session import get_db
from app.models.equipment import Equipment
from app.models.service_request import ServiceRequest, ServiceStatus
from app.models.maintenance import MaintenanceService
from app.models.maintenance_activity import MaintenanceActivity
from app.models.user import User, UserRole
from app.schemas.maintenance import (
    MaintenanceServiceCreate, MaintenanceServiceOut, MaintenanceActivityCreate, MaintenanceActivityOut
)
from app.dependencies.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/maintenance", tags=["Maintenance Services"])

@router.get("", response_model=List[MaintenanceServiceOut])
def list_maintenance_services(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(MaintenanceService).order_by(MaintenanceService.created_at.desc()).all()

@router.get("/history", response_model=List[MaintenanceServiceOut])
def get_maintenance_history_log(equipment_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(MaintenanceService)
    if equipment_id:
        query = query.filter(MaintenanceService.equipment_id == equipment_id)
    return query.order_by(MaintenanceService.service_start_date.desc()).all()

@router.get("/{id}", response_model=MaintenanceServiceOut)
def get_maintenance_service_detail(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = db.query(MaintenanceService).filter(MaintenanceService.id == id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found.")
    return service

@router.post("", response_model=MaintenanceServiceOut, status_code=status.HTTP_201_CREATED)
def create_maintenance_record(
    req: MaintenanceServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == req.service_request_id).first()
    if not sr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linked service request not found.")

    m_service = MaintenanceService(
        service_request_id=req.service_request_id,
        equipment_id=req.equipment_id,
        engineer_id=current_user.id,
        service_start_date=datetime.now(timezone.utc),
        service_end_date=datetime.now(timezone.utc),
        issue=req.issue,
        root_cause=req.root_cause,
        work_performed=req.work_performed,
        parts_replaced=req.parts_replaced,
        service_type=req.service_type,
        maintenance_cost=req.maintenance_cost,
        downtime_hours=req.downtime_hours,
        service_notes=req.service_notes,
        next_service_date=req.next_service_date,
        status="COMPLETED"
    )
    
    sr.status = ServiceStatus.COMPLETED
    db.add(m_service)
    db.commit()
    db.refresh(m_service)
    return m_service

@router.post("/{id}/activity", response_model=MaintenanceActivityOut, status_code=status.HTTP_201_CREATED)
def add_maintenance_activity(
    id: int,
    req: MaintenanceActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == id).first()
    if not sr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")

    activity = MaintenanceActivity(
        equipment_id=sr.equipment_id,
        service_request_id=sr.id,
        engineer_id=current_user.id,
        activity=req.activity,
        notes=req.notes,
        activity_date=req.activity_date or date.today(),
        activity_time=req.activity_time or datetime.now().strftime("%H:%M")
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity

@router.get("/{id}/activities", response_model=List[MaintenanceActivityOut])
def get_service_request_activities(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(MaintenanceActivity).filter(MaintenanceActivity.service_request_id == id).order_by(MaintenanceActivity.created_at.asc()).all()
