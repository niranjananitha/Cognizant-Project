from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.equipment import Equipment
from app.models.service_request import ServiceRequest
from app.models.maintenance import MaintenanceService
from app.models.user import User, UserRole
from app.dependencies.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/summary")
def get_hospital_maintenance_summary_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.HOSPITAL_ADMIN, UserRole.MAINTENANCE_ENGINEER]))
):
    total_equip = db.query(Equipment).count()
    total_requests = db.query(ServiceRequest).count()
    total_completed = db.query(MaintenanceService).count()
    
    return {
        "report_title": "Hospital Equipment & Maintenance Summary",
        "generated_by": current_user.full_name,
        "total_equipment": total_equip,
        "total_service_requests": total_requests,
        "total_completed_maintenances": total_completed
    }
