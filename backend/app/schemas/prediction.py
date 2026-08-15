from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from app.models.prediction import RiskLevel

class PredictionOut(BaseModel):
    id: int
    equipment_id: int
    health_reading_id: Optional[int] = None
    risk_score: float
    risk_level: RiskLevel
    recommended_fix: Optional[str] = None
    contributing_factors: Optional[dict] = None
    model_name: str
    model_version: str
    predicted_at: datetime

    model_config = ConfigDict(from_attributes=True)

class HealthAssessmentResponse(BaseModel):
    equipment_id: int
    machine_id: str
    machine_name: str
    risk_score: float
    risk_level: str
    recommended_fix: str
    contributing_factors: List[str]
    health_reading_id: int
    prediction_id: int
    timestamp: datetime
