from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.database.session import get_db
from app.models.equipment import Equipment, EquipmentStatus
from app.models.health_reading import EquipmentHealthReading
from app.models.prediction import Prediction, RiskLevel
from app.models.user import User
from app.schemas.health import HealthReadingCreate, HealthReadingOut
from app.schemas.prediction import HealthAssessmentResponse
from app.services.ml_service import ml_service
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/equipment", tags=["Equipment Health & Diagnostics"])

@router.post("/{equipment_id}/health", response_model=HealthReadingOut, status_code=status.HTTP_201_CREATED)
def create_health_reading(
    equipment_id: int,
    req: HealthReadingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    equip = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equip:
        equip = db.query(Equipment).filter(Equipment.machine_id == str(equipment_id)).first()
    if not equip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found.")

    days_since = (datetime.now().date() - equip.last_service_date).days if equip.last_service_date else 90

    reading = EquipmentHealthReading(
        equipment_id=equip.id,
        operating_temperature_c=req.operating_temperature_c,
        system_pressure_cmh2o=req.system_pressure_cmh2o,
        total_operating_hours=req.total_operating_hours,
        recent_downtime_hours=req.recent_downtime_hours,
        backup_battery_voltage_v=req.backup_battery_voltage_v,
        flow_rate_lmin=req.flow_rate_lmin,
        system_error_code=req.system_error_code,
        clinical_notes=req.clinical_notes,
        days_since_service=days_since,
        recorded_by_id=current_user.id
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading

@router.get("/{equipment_id}/health", response_model=List[HealthReadingOut])
def get_health_readings(equipment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    equip = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equip:
        equip = db.query(Equipment).filter(Equipment.machine_id == str(equipment_id)).first()
    if not equip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found.")

    return db.query(EquipmentHealthReading).filter(EquipmentHealthReading.equipment_id == equip.id).order_by(EquipmentHealthReading.recorded_at.desc()).all()

@router.get("/{equipment_id}/health/latest", response_model=HealthReadingOut)
def get_latest_health_reading(equipment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    equip = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equip:
        equip = db.query(Equipment).filter(Equipment.machine_id == str(equipment_id)).first()
    if not equip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found.")

    reading = db.query(EquipmentHealthReading).filter(EquipmentHealthReading.equipment_id == equip.id).order_by(EquipmentHealthReading.recorded_at.desc()).first()
    if not reading:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No telemetry health readings found for this equipment.")
    return reading

@router.post("/{equipment_id}/health-assessment", response_model=HealthAssessmentResponse)
def execute_health_assessment_and_predict(
    equipment_id: int,
    req: HealthReadingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    equip = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equip:
        equip = db.query(Equipment).filter(Equipment.machine_id == str(equipment_id)).first()
    if not equip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found.")

    days_since = (datetime.now().date() - equip.last_service_date).days if equip.last_service_date else 90

    # 1. Save Health Reading
    reading = EquipmentHealthReading(
        equipment_id=equip.id,
        operating_temperature_c=req.operating_temperature_c,
        system_pressure_cmh2o=req.system_pressure_cmh2o,
        total_operating_hours=req.total_operating_hours,
        recent_downtime_hours=req.recent_downtime_hours,
        backup_battery_voltage_v=req.backup_battery_voltage_v,
        flow_rate_lmin=req.flow_rate_lmin,
        system_error_code=req.system_error_code,
        clinical_notes=req.clinical_notes,
        days_since_service=days_since,
        recorded_by_id=current_user.id
    )
    db.add(reading)
    db.flush()

    # 2. Run ML Prediction Service
    ml_result = ml_service.predict_health(
        machine_name=equip.machine_name,
        category=equip.category,
        temp_c=req.operating_temperature_c,
        pressure_cmh2o=req.system_pressure_cmh2o,
        operating_hours=req.total_operating_hours,
        downtime_hours=req.recent_downtime_hours,
        battery_voltage_v=req.backup_battery_voltage_v,
        flow_rate_lmin=req.flow_rate_lmin,
        system_error_code=req.system_error_code,
        clinical_notes=req.clinical_notes,
        last_service_date=equip.last_service_date
    )

    # 3. Map Risk Level Enum
    risk_level_str = ml_result["risk_level"]
    risk_level_enum = RiskLevel.CRITICAL if risk_level_str == "CRITICAL" else (RiskLevel.HIGH if risk_level_str == "HIGH" else (RiskLevel.MEDIUM if risk_level_str == "MEDIUM" else RiskLevel.LOW))

    # 4. Save Prediction Record in PostgreSQL
    prediction = Prediction(
        equipment_id=equip.id,
        health_reading_id=reading.id,
        risk_score=ml_result["risk_score"],
        risk_level=risk_level_enum,
        recommended_fix=ml_result["recommended_fix"],
        contributing_factors={"factors": ml_result["contributing_factors"]},
        model_name=ml_result["model_name"],
        model_version=ml_result["model_version"]
    )
    db.add(prediction)

    # 5. Update Equipment Status if Critical Failure Risk Detected
    if ml_result["risk_score"] > 70.0:
        equip.status = EquipmentStatus.HIGH_RISK

    db.commit()
    db.refresh(reading)
    db.refresh(prediction)

    return HealthAssessmentResponse(
        equipment_id=equip.id,
        machine_id=equip.machine_id,
        machine_name=equip.machine_name,
        risk_score=ml_result["risk_score"],
        risk_level=risk_level_str,
        recommended_fix=ml_result["recommended_fix"],
        contributing_factors=ml_result["contributing_factors"],
        health_reading_id=reading.id,
        prediction_id=prediction.id,
        timestamp=datetime.now(timezone.utc)
    )
