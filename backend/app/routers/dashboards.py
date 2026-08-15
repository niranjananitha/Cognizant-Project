from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timezone

from app.database.session import get_db
from app.models.equipment import Equipment, EquipmentStatus
from app.models.service_request import ServiceRequest, ServiceStatus, ServicePriority
from app.models.maintenance import MaintenanceService
from app.models.maintenance_activity import MaintenanceActivity
from app.models.recall import Recall
from app.models.user import User, UserRole
from app.schemas.dashboard import ClinicalDashboardOut, MaintenanceDashboardOut, AdminDashboardOut
from app.dependencies.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/dashboard", tags=["Dashboards & Analytics"])

@router.get("/clinical", response_model=ClinicalDashboardOut)
def get_clinical_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_equip = db.query(Equipment).count()
    at_risk = db.query(Equipment).filter(Equipment.status == EquipmentStatus.HIGH_RISK).count()
    under_maint = db.query(Equipment).filter(Equipment.status == EquipmentStatus.UNDER_MAINTENANCE).count()
    recall_cnt = db.query(Equipment).filter(Equipment.status == EquipmentStatus.RECALL).count()
    backup_cnt = db.query(Equipment).filter(Equipment.is_backup_ready == True).count()
    avail_cnt = db.query(Equipment).filter(Equipment.status == EquipmentStatus.AVAILABLE).count()
    critical_cnt = db.query(Equipment).filter(Equipment.status == EquipmentStatus.CRITICAL).count()

    recent_srs = db.query(ServiceRequest).order_by(ServiceRequest.created_at.desc()).limit(5).all()
    recent_sr_list = [
        {
            "id": sr.id,
            "ticket_number": sr.ticket_number,
            "issue": sr.issue,
            "priority": sr.priority.value,
            "status": sr.status.value,
            "created_at": sr.created_at.isoformat()
        } for sr in recent_srs
    ]

    return ClinicalDashboardOut(
        total_equipment=total_equip,
        equipment_at_risk=at_risk,
        under_maintenance=under_maint,
        recall_count=recall_cnt,
        emergency_backup_count=backup_cnt,
        available_count=avail_cnt,
        critical_equipment=critical_cnt,
        recent_service_requests=recent_sr_list
    )

@router.get("/maintenance", response_model=MaintenanceDashboardOut)
def get_maintenance_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    my_srs = db.query(ServiceRequest).filter(ServiceRequest.assigned_engineer_id == current_user.id).count()
    total_services = db.query(MaintenanceService).count()
    high_risk_svcs = db.query(ServiceRequest).filter(ServiceRequest.priority == ServicePriority.HIGH).count()
    critical_svcs = db.query(ServiceRequest).filter(ServiceRequest.priority == ServicePriority.CRITICAL).count()
    overdue_svcs = db.query(ServiceRequest).filter(ServiceRequest.status == ServiceStatus.SERVICE_DELAYED).count()
    waiting_parts = db.query(ServiceRequest).filter(ServiceRequest.status == ServiceStatus.WAITING_FOR_PARTS).count()

    today_srs = db.query(ServiceRequest).order_by(ServiceRequest.updated_at.desc()).limit(6).all()
    today_sched = [
        {
            "id": sr.id,
            "ticket_number": sr.ticket_number,
            "issue": sr.issue,
            "priority": sr.priority.value,
            "status": sr.status.value
        } for sr in today_srs
    ]

    recent_acts = db.query(MaintenanceActivity).order_by(MaintenanceActivity.created_at.desc()).limit(5).all()
    act_list = [
        {
            "id": a.id,
            "activity": a.activity,
            "notes": a.notes,
            "time": a.activity_time
        } for a in recent_acts
    ]

    crit_reqs = db.query(ServiceRequest).filter(ServiceRequest.priority == ServicePriority.CRITICAL).limit(5).all()
    crit_list = [
        {
            "id": sr.id,
            "ticket_number": sr.ticket_number,
            "issue": sr.issue,
            "status": sr.status.value
        } for sr in crit_reqs
    ]

    return MaintenanceDashboardOut(
        my_service_requests=my_srs,
        total_services=total_services,
        high_risk_services=high_risk_svcs,
        critical_services=critical_svcs,
        overdue_services=overdue_svcs,
        waiting_for_parts=waiting_parts,
        today_schedule=today_sched,
        recent_activities=act_list,
        critical_requests=crit_list
    )

@router.get("/admin", response_model=AdminDashboardOut)
def get_admin_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([UserRole.HOSPITAL_ADMIN]))):
    total_equip = db.query(Equipment).count()
    avail = db.query(Equipment).filter(Equipment.status == EquipmentStatus.AVAILABLE).count()
    under_maint = db.query(Equipment).filter(Equipment.status == EquipmentStatus.UNDER_MAINTENANCE).count()
    high_risk = db.query(Equipment).filter(Equipment.status == EquipmentStatus.HIGH_RISK).count()
    backup = db.query(Equipment).filter(Equipment.is_backup_ready == True).count()
    recall = db.query(Equipment).filter(Equipment.status == EquipmentStatus.RECALL).count()
    replacement = db.query(Equipment).filter(Equipment.status == EquipmentStatus.REPLACEMENT).count()

    dept_counts = db.query(Equipment.department, func.count(Equipment.id)).group_by(Equipment.department).all()
    dept_summary = [{"department": dept or "General", "count": count} for dept, count in dept_counts]

    total_cost = db.query(func.sum(MaintenanceService.maintenance_cost)).scalar() or 0.0
    total_downtime = db.query(func.sum(MaintenanceService.downtime_hours)).scalar() or 0.0
    total_completed = db.query(ServiceRequest).filter(ServiceRequest.status == ServiceStatus.COMPLETED).count()

    return AdminDashboardOut(
        total_equipment=total_equip,
        available=avail,
        under_maintenance=under_maint,
        high_risk=high_risk,
        emergency_backup=backup,
        recall=recall,
        replacement=replacement,
        department_summary=dept_summary,
        downtime_summary={"total_downtime_hours": round(total_downtime, 1)},
        maintenance_cost_summary={"total_cost_usd": round(total_cost, 2)},
        service_completion_summary={"total_completed_services": total_completed}
    )
