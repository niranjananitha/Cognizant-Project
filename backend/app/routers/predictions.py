from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.equipment import Equipment
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import PredictionOut
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/equipment", tags=["Predictions"])

@router.get("/{equipment_id}/predictions", response_model=List[PredictionOut])
def get_equipment_predictions(equipment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    equip = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equip:
        equip = db.query(Equipment).filter(Equipment.machine_id == str(equipment_id)).first()
    if not equip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found.")

    return db.query(Prediction).filter(Prediction.equipment_id == equip.id).order_by(Prediction.predicted_at.desc()).all()
