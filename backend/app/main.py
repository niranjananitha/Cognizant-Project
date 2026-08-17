import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database.session import engine
from app.database.base import Base
from app.services.ml_service import ml_service

from app.routers import (
    auth, users, equipment, health, predictions,
    service_requests, maintenance, spare_parts, recalls,
    replacements, dashboards, notifications, reports
)
from app.schemas.health import HealthReadingCreate
from app.schemas.prediction import HealthAssessmentResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medequip")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting MedEquip Operations & ML Platform Backend...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables verified/created successfully.")
    except Exception as e:
        logger.warning(f"⚠️ Could not create tables automatically: {e}")
    yield
    logger.info("🛑 Shutting down MedEquip Backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade FastAPI backend for hospital medical equipment operations, service workflows, and ML risk predictions.",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"❌ Validation Error for {request.method} {request.url.path}: {exc.errors()} | Body: {exc.body}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()}
    )

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(equipment.router, prefix=settings.API_V1_STR)
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(predictions.router, prefix=settings.API_V1_STR)
app.include_router(service_requests.router, prefix=settings.API_V1_STR)
app.include_router(maintenance.router, prefix=settings.API_V1_STR)
app.include_router(spare_parts.router, prefix=settings.API_V1_STR)
app.include_router(recalls.router, prefix=settings.API_V1_STR)
app.include_router(replacements.router, prefix=settings.API_V1_STR)
app.include_router(dashboards.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "Online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "models_loaded": ml_service.is_loaded
    }

# Legacy Compatibility Endpoint (POST /api/predict)
@app.post("/api/predict")
def legacy_ml_predict(req: dict):
    logger.info(f"Incoming predict payload: {req}")
    try:
        result = ml_service.predict_health(
            machine_name=req.get("machine_name", "Respironics V60 Ventilator"),
            category=req.get("category", "Ventilators"),
            temp_c=float(req.get("operating_temperature_c", 38.5)),
            pressure_cmh2o=float(req.get("system_pressure_cmh2o", 14.2)),
            operating_hours=int(req.get("total_operating_hours", 12450)),
            downtime_hours=int(req.get("recent_downtime_hours", 12)),
            battery_voltage_v=float(req.get("backup_battery_voltage_v", 12.4)),
            flow_rate_lmin=float(req.get("flow_rate_lmin", 45.0)),
            system_error_code=str(req.get("system_error_code", "NONE")),
            clinical_notes=str(req.get("clinical_notes", ""))
        )
        return {
            "machine_name": req.get("machine_name", "Respironics V60 Ventilator"),
            "category": req.get("category", "Ventilators"),
            "failure_probability": result["risk_score"],
            "is_failure_risk": result["risk_score"] > 50.0,
            "status": "CRITICAL" if result["risk_score"] > 70 else ("WARNING" if result["risk_score"] > 35 else "OPTIMAL"),
            "recommended_fix_category": result["recommended_fix"],
            "model_used": result["model_name"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
