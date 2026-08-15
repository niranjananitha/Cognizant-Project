import math
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional, List, Dict, Any

from app.database.session import get_db
from app.models.equipment import Equipment, EquipmentStatus
from app.models.health_reading import EquipmentHealthReading
from app.models.prediction import Prediction
from app.models.service_request import ServiceRequest
from app.models.maintenance import MaintenanceService
from app.models.maintenance_activity import MaintenanceActivity
from app.models.recall import Recall
from app.models.replacement import EquipmentReplacement
from app.models.user import User, UserRole
from app.schemas.equipment import EquipmentOut, EquipmentCreate, EquipmentUpdate, PaginatedEquipmentOut
from app.dependencies.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/equipment", tags=["Equipment"])

@router.get("", response_model=PaginatedEquipmentOut)
def list_equipment(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[EquipmentStatus] = None,
    department: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Equipment)

    if search:
        s_term = f"%{search}%"
        query = query.filter(
            or_(
                Equipment.machine_id.ilike(s_term),
                Equipment.machine_name.ilike(s_term),
                Equipment.category.ilike(s_term),
                Equipment.department.ilike(s_term),
                Equipment.location.ilike(s_term)
            )
        )

    if category:
        query = query.filter(Equipment.category.ilike(f"%{category}%"))
    if status:
        query = query.filter(Equipment.status == status)
    if department:
        query = query.filter(Equipment.department.ilike(f"%{department}%"))
    if location:
        query = query.filter(Equipment.location.ilike(f"%{location}%"))

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = query.order_by(Equipment.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedEquipmentOut(
        items=[EquipmentOut.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{equipment_id}", response_model=EquipmentOut)
def get_equipment_detail(equipment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    equip = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equip:
        equip = db.query(Equipment).filter(Equipment.machine_id == str(equipment_id)).first()
    if not equip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found.")
    return equip

@router.post("", response_model=EquipmentOut, status_code=status.HTTP_201_CREATED)
def create_equipment(
    req: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.HOSPITAL_ADMIN, UserRole.MAINTENANCE_ENGINEER]))
):
    existing = db.query(Equipment).filter(Equipment.machine_id == req.machine_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Machine ID '{req.machine_id}' already exists.")

    equip = Equipment(**req.model_dump())
    db.add(equip)
    db.commit()
    db.refresh(equip)
    return equip

@router.patch("/{equipment_id}", response_model=EquipmentOut)
def update_equipment(
    equipment_id: int,
    req: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.HOSPITAL_ADMIN, UserRole.MAINTENANCE_ENGINEER]))
):
    equip = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found.")

    update_data = req.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(equip, key, val)

    db.commit()
    db.refresh(equip)
    return equip

@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.HOSPITAL_ADMIN]))
):
    equip = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found.")
    db.delete(equip)
    db.commit()
    return None

@router.get("/{equipment_id}/timeline")
def get_equipment_lifecycle_timeline(equipment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    equip = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equip:
        equip = db.query(Equipment).filter(Equipment.machine_id == str(equipment_id)).first()
    if not equip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found.")

    timeline = []

    # 1. Equipment Registered
    timeline.append({
        "event_type": "EQUIPMENT_REGISTERED",
        "title": "Equipment Registered in Hospital Catalog",
        "description": f"Registered {equip.machine_name} ({equip.machine_id}) under {equip.department}.",
        "timestamp": equip.created_at.isoformat() if equip.created_at else None,
        "status_badge": "INITIAL"
    })

    # 2. Health Readings
    readings = db.query(EquipmentHealthReading).filter(EquipmentHealthReading.equipment_id == equip.id).order_by(EquipmentHealthReading.recorded_at.desc()).all()
    for r in readings:
        timeline.append({
            "event_type": "HEALTH_READING",
            "title": "Medical Telemetry Reading Logged",
            "description": f"Temp: {r.operating_temperature_c}°C, Pressure: {r.system_pressure_cmh2o} cmH2O, Voltage: {r.backup_battery_voltage_v}V, Error: {r.system_error_code}.",
            "timestamp": r.recorded_at.isoformat() if r.recorded_at else None,
            "status_badge": "TELEMETRY"
        })

    # 3. ML Risk Predictions
    preds = db.query(Prediction).filter(Prediction.equipment_id == equip.id).order_by(Prediction.predicted_at.desc()).all()
    for p in preds:
        timeline.append({
            "event_type": "ML_PREDICTION",
            "title": f"ML Risk Assessment: {p.risk_level.value} ({p.risk_score}%)",
            "description": f"Model: {p.model_name}. Recommended Action: {p.recommended_fix}.",
            "timestamp": p.predicted_at.isoformat() if p.predicted_at else None,
            "status_badge": p.risk_level.value
        })

    # 4. Service Requests
    srs = db.query(ServiceRequest).filter(ServiceRequest.equipment_id == equip.id).order_by(ServiceRequest.created_at.desc()).all()
    for sr in srs:
        timeline.append({
            "event_type": "SERVICE_REQUEST",
            "title": f"Service Request {sr.ticket_number}: {sr.status.value}",
            "description": f"Issue: {sr.issue}. Priority: {sr.priority.value}.",
            "timestamp": sr.created_at.isoformat() if sr.created_at else None,
            "status_badge": sr.status.value
        })

    # 5. Maintenance Activities
    acts = db.query(MaintenanceActivity).filter(MaintenanceActivity.equipment_id == equip.id).order_by(MaintenanceActivity.created_at.desc()).all()
    for a in acts:
        timeline.append({
            "event_type": "MAINTENANCE_ACTIVITY",
            "title": f"Technician Activity: {a.activity}",
            "description": a.notes or "Log recorded by engineering team.",
            "timestamp": a.created_at.isoformat() if a.created_at else None,
            "status_badge": "ACTIVITY"
        })

    # Sort timeline by timestamp desc
    timeline.sort(key=lambda x: x["timestamp"] or "", reverse=True)

    return {
        "equipment_id": equip.id,
        "machine_id": equip.machine_id,
        "machine_name": equip.machine_name,
        "status": equip.status.value,
        "events_count": len(timeline),
        "timeline": timeline
    }
