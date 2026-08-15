from app.schemas.auth import LoginRequest, TokenResponse, RegisterRequest
from app.schemas.user import UserOut, UserCreate, UserUpdate
from app.schemas.equipment import EquipmentOut, EquipmentCreate, EquipmentUpdate, PaginatedEquipmentOut
from app.schemas.health import HealthReadingCreate, HealthReadingOut
from app.schemas.prediction import PredictionOut, HealthAssessmentResponse
from app.schemas.service_request import ServiceRequestOut, ServiceRequestCreate, ServiceRequestUpdate, PaginatedServiceRequestOut
from app.schemas.maintenance import MaintenanceServiceCreate, MaintenanceServiceOut, MaintenanceActivityCreate, MaintenanceActivityOut
from app.schemas.spare_part import SparePartOut, SparePartRequestCreate, SparePartRequestOut
from app.schemas.recall import RecallCreate, RecallOut
from app.schemas.replacement import EquipmentReplacementCreate, EquipmentReplacementOut
from app.schemas.dashboard import ClinicalDashboardOut, MaintenanceDashboardOut, AdminDashboardOut

__all__ = [
    "LoginRequest", "TokenResponse", "RegisterRequest",
    "UserOut", "UserCreate", "UserUpdate",
    "EquipmentOut", "EquipmentCreate", "EquipmentUpdate", "PaginatedEquipmentOut",
    "HealthReadingCreate", "HealthReadingOut",
    "PredictionOut", "HealthAssessmentResponse",
    "ServiceRequestOut", "ServiceRequestCreate", "ServiceRequestUpdate", "PaginatedServiceRequestOut",
    "MaintenanceServiceCreate", "MaintenanceServiceOut", "MaintenanceActivityCreate", "MaintenanceActivityOut",
    "SparePartOut", "SparePartRequestCreate", "SparePartRequestOut",
    "RecallCreate", "RecallOut",
    "EquipmentReplacementCreate", "EquipmentReplacementOut",
    "ClinicalDashboardOut", "MaintenanceDashboardOut", "AdminDashboardOut"
]
