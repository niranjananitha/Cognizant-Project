from pydantic import BaseModel
from typing import List, Dict, Any

class ClinicalDashboardOut(BaseModel):
    total_equipment: int
    equipment_at_risk: int
    under_maintenance: int
    recall_count: int
    emergency_backup_count: int
    available_count: int
    critical_equipment: int
    recent_service_requests: List[Dict[str, Any]]

class MaintenanceDashboardOut(BaseModel):
    my_service_requests: int
    total_services: int
    high_risk_services: int
    critical_services: int
    overdue_services: int
    waiting_for_parts: int
    today_schedule: List[Dict[str, Any]]
    recent_activities: List[Dict[str, Any]]
    critical_requests: List[Dict[str, Any]]

class AdminDashboardOut(BaseModel):
    total_equipment: int
    available: int
    under_maintenance: int
    high_risk: int
    emergency_backup: int
    recall: int
    replacement: int
    department_summary: List[Dict[str, Any]]
    downtime_summary: Dict[str, Any]
    maintenance_cost_summary: Dict[str, Any]
    service_completion_summary: Dict[str, Any]
