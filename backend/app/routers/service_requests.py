import math
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.session import get_db
from app.models.equipment import Equipment, EquipmentStatus
from app.models.service_request import ServiceRequest, ServiceStatus, ServicePriority
from app.models.maintenance import MaintenanceService
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole
from app.schemas.service_request import (
    ServiceRequestOut, ServiceRequestCreate, ServiceRequestUpdate, PaginatedServiceRequestOut
)
from app.dependencies.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/service-requests", tags=["Service Requests"])

def generate_ticket_number(db: Session) -> str:
    count = db.query(ServiceRequest).count() + 1
    return f"SR-{datetime.now().year}-{count:04d}"

@router.get("", response_model=PaginatedServiceRequestOut)
def list_service_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[ServiceStatus] = None,
    priority: Optional[ServicePriority] = None,
    equipment_id: Optional[int] = None,
    assigned_engineer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ServiceRequest)

    if status:
        query = query.filter(ServiceRequest.status == status)
    if priority:
        query = query.filter(ServiceRequest.priority == priority)
    if equipment_id:
        query = query.filter(ServiceRequest.equipment_id == equipment_id)
    if assigned_engineer_id:
        query = query.filter(ServiceRequest.assigned_engineer_id == assigned_engineer_id)

    # If maintenance engineer role, return assigned or unassigned tickets
    if current_user.role == UserRole.MAINTENANCE_ENGINEER:
        pass  # Engineers see all tickets to pick up

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = query.order_by(ServiceRequest.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedServiceRequestOut(
        items=[ServiceRequestOut.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{id}", response_model=ServiceRequestOut)
def get_service_request_detail(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == id).first()
    if not sr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")
    return sr

@router.post("", response_model=ServiceRequestOut, status_code=status.HTTP_201_CREATED)
def raise_service_request(
    req: ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    equip = db.query(Equipment).filter(Equipment.id == req.equipment_id).first()
    if not equip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target equipment not found.")

    ticket = generate_ticket_number(db)

    sr = ServiceRequest(
        ticket_number=ticket,
        equipment_id=equip.id,
        raised_by_id=current_user.id,
        priority=req.priority,
        issue=req.issue,
        observed_symptoms=req.observed_symptoms,
        additional_observation=req.additional_observation,
        risk_score=req.risk_score or 0.0,
        status=ServiceStatus.RAISED
    )
    
    # Update equipment status to UNDER_MAINTENANCE if HIGH/CRITICAL priority
    if req.priority in [ServicePriority.HIGH, ServicePriority.CRITICAL]:
        equip.status = EquipmentStatus.UNDER_MAINTENANCE

    db.add(sr)
    
    # Log Audit
    audit = AuditLog(
        user_id=current_user.id,
        action="SERVICE_REQUEST_CREATED",
        entity_type="SERVICE_REQUEST",
        new_value={"ticket_number": ticket, "issue": req.issue, "priority": req.priority.value}
    )
    db.add(audit)
    
    db.commit()
    db.refresh(sr)
    return sr

@router.patch("/{id}", response_model=ServiceRequestOut)
def update_service_request(
    id: int,
    req: ServiceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER, UserRole.HOSPITAL_ADMIN]))
):
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == id).first()
    if not sr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")

    update_data = req.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(sr, key, val)

    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/acknowledge", response_model=ServiceRequestOut)
def acknowledge_service_request(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == id).first()
    if not sr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")

    sr.status = ServiceStatus.ACKNOWLEDGED
    sr.assigned_engineer_id = current_user.id
    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/start-diagnosis", response_model=ServiceRequestOut)
def start_diagnosis(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == id).first()
    if not sr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")

    sr.status = ServiceStatus.IN_DIAGNOSIS
    sr.assigned_engineer_id = current_user.id
    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/start-service", response_model=ServiceRequestOut)
def start_service(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == id).first()
    if not sr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")

    sr.status = ServiceStatus.IN_SERVICE
    sr.assigned_engineer_id = current_user.id
    
    equip = db.query(Equipment).filter(Equipment.id == sr.equipment_id).first()
    if equip:
        equip.status = EquipmentStatus.UNDER_MAINTENANCE

    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/waiting-for-parts", response_model=ServiceRequestOut)
def mark_waiting_for_parts(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == id).first()
    if not sr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")

    sr.status = ServiceStatus.WAITING_FOR_PARTS
    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/delay", response_model=ServiceRequestOut)
def mark_service_delayed(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == id).first()
    if not sr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")

    sr.status = ServiceStatus.SERVICE_DELAYED
    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/complete", response_model=ServiceRequestOut)
def complete_service_request(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == id).first()
    if not sr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")

    sr.status = ServiceStatus.COMPLETED

    # Reset equipment status to AVAILABLE
    equip = db.query(Equipment).filter(Equipment.id == sr.equipment_id).first()
    if equip:
        equip.status = EquipmentStatus.AVAILABLE
        equip.last_service_date = datetime.now().date()

    # Log Audit
    audit = AuditLog(
        user_id=current_user.id,
        action="SERVICE_COMPLETED",
        entity_type="SERVICE_REQUEST",
        entity_id=sr.id,
        new_value={"ticket_number": sr.ticket_number, "status": "COMPLETED"}
    )
    db.add(audit)

    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/reject", response_model=ServiceRequestOut)
def reject_service_request(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER, UserRole.HOSPITAL_ADMIN]))
):
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == id).first()
    if not sr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")

    sr.status = ServiceStatus.REJECTED
    db.commit()
    db.refresh(sr)
    return sr
