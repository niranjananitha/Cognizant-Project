import os
import sys
from datetime import datetime, date, timedelta, timezone

# Add backend root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.equipment import Equipment, EquipmentStatus
from app.models.health_reading import EquipmentHealthReading
from app.models.prediction import Prediction, RiskLevel
from app.models.service_request import ServiceRequest, ServiceStatus, ServicePriority
from app.models.maintenance import MaintenanceService, ServiceType
from app.models.maintenance_activity import MaintenanceActivity
from app.models.spare_part import SparePart, SparePartRequest, SparePartRequestStatus
from app.models.recall import Recall, RecallStatus
from app.models.warranty import Warranty, WarrantyType

def seed_database():
    print("[INFO] Initializing Database Tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("[INFO] Seeding Persona Users...")
        # Personas
        personas = [
            {
                "full_name": "Dr. Priya",
                "email": "nurse@medequip.com",
                "password": "NursePass123!",
                "role": UserRole.NURSE_DOCTOR,
                "department": "Intensive Care Unit (ICU)"
            },
            {
                "full_name": "Senior Technician J. Miller",
                "email": "engineer@medequip.com",
                "password": "EngPass123!",
                "role": UserRole.MAINTENANCE_ENGINEER,
                "department": "Biomedical Engineering"
            },
            {
                "full_name": "Dr. Sarah Chen",
                "email": "admin@medequip.com",
                "password": "AdminPass123!",
                "role": UserRole.HOSPITAL_ADMIN,
                "department": "Hospital Administration"
            }
        ]

        users_map = {}
        for p in personas:
            user = db.query(User).filter(User.email == p["email"]).first()
            if not user:
                user = User(
                    full_name=p["full_name"],
                    email=p["email"],
                    password_hash=get_password_hash(p["password"]),
                    role=p["role"],
                    department=p["department"],
                    is_active=True
                )
                db.add(user)
                db.flush()
                print(f"  + Created Persona User: {p['full_name']} ({p['email']})")
            users_map[p["role"]] = user

        db.commit()

        # Equipment Catalog (11 Machines)
        print("[INFO] Seeding Equipment Catalog...")
        equipment_list = [
            {"id": "VEN-2023-8472", "name": "Respironics V60 Ventilator", "cat": "Ventilators", "dept": "Intensive Care (ICU)", "loc": "ICU - Bed 04", "status": EquipmentStatus.AVAILABLE},
            {"id": "MX700-04", "name": "IntelliVue MX700 Monitor", "cat": "Patient Monitors", "dept": "Intensive Care (ICU)", "loc": "ICU - Bed 01", "status": EquipmentStatus.AVAILABLE},
            {"id": "DEF-402-B", "name": "BeneHeart D3 Defibrillator", "cat": "Defibrillators", "dept": "Emergency (ER)", "loc": "ER Bay 02", "status": EquipmentStatus.UNDER_MAINTENANCE},
            {"id": "INF-3301-P", "name": "Alaris System Infusion Pump", "cat": "Infusion Pumps", "dept": "Surgery", "loc": "OR-3", "status": EquipmentStatus.AVAILABLE},
            {"id": "MRI-102", "name": "Siemens Magnetom 3.0T MRI", "cat": "Imaging Systems", "dept": "Radiology", "loc": "Radiology Suite 1", "status": EquipmentStatus.AVAILABLE},
            {"id": "MON-B650-01", "name": "GE Carescape B650", "cat": "Patient Monitors", "dept": "Intensive Care (ICU)", "loc": "ICU - Bed 08", "status": EquipmentStatus.AVAILABLE},
            {"id": "DEF-ZOL-03", "name": "Zoll R Series / AED Plus", "cat": "Defibrillators", "dept": "Cardiology", "loc": "CCU - Bed 02", "status": EquipmentStatus.AVAILABLE},
            {"id": "INF-ALR-05", "name": "BD Alaris System", "cat": "Infusion Pumps", "dept": "Pediatrics", "loc": "Pediatrics Room 204", "status": EquipmentStatus.AVAILABLE},
            {"id": "IMG-CARM-07", "name": "GE OEC 3D C-Arm", "cat": "Imaging Systems", "dept": "Surgery", "loc": "OR-Hybrid", "status": EquipmentStatus.AVAILABLE},
            {"id": "IMG-XRAY-08", "name": "Siemens Mobilett Elara Max X-ray", "cat": "Imaging Systems", "dept": "Radiology", "loc": "Radiology Suite 3", "status": EquipmentStatus.AVAILABLE},
            {"id": "IMG-US-09", "name": "Fujifilm Sonosite Ultrasound", "cat": "Imaging Systems", "dept": "Emergency (ER)", "loc": "ER Cart 01", "status": EquipmentStatus.AVAILABLE},
        ]

        equip_map = {}
        for eq in equipment_list:
            existing = db.query(Equipment).filter(Equipment.machine_id == eq["id"]).first()
            if not existing:
                existing = Equipment(
                    machine_id=eq["id"],
                    machine_name=eq["name"],
                    category=eq["cat"],
                    manufacturer="Certified Med OEM",
                    model="Standard Series",
                    serial_number=f"SN-{eq['id']}",
                    department=eq["dept"],
                    location=eq["loc"],
                    purchase_date=date(2021, 5, 10),
                    last_service_date=date(2024, 2, 1),
                    next_service_date=date(2024, 8, 1),
                    status=eq["status"],
                    is_backup_ready=True
                )
                db.add(existing)
                db.flush()
                print(f"  + Added Equipment: {eq['name']} ({eq['id']})")
            equip_map[eq["id"]] = existing

        db.commit()

        # Seed Health Readings
        print("[INFO] Seeding Equipment Health Readings & ML Predictions...")
        v60 = equip_map.get("VEN-2023-8472")
        if v60:
            reading = EquipmentHealthReading(
                equipment_id=v60.id,
                operating_temperature_c=38.5,
                system_pressure_cmh2o=14.2,
                total_operating_hours=12450,
                recent_downtime_hours=12,
                backup_battery_voltage_v=12.4,
                flow_rate_lmin=45.0,
                system_error_code="ERR-042-T",
                clinical_notes="Slight compressor motor vibration noted during peak flow demand.",
                days_since_service=90,
                recorded_by_id=users_map[UserRole.NURSE_DOCTOR].id
            )
            db.add(reading)
            db.flush()

            pred = Prediction(
                equipment_id=v60.id,
                health_reading_id=reading.id,
                risk_score=78.5,
                risk_level=RiskLevel.HIGH,
                recommended_fix="Thermal/Cooling",
                contributing_factors={"high_temp": 38.5, "downtime": 12},
                model_name="XGBoost Classifier",
                model_version="1.0.0"
            )
            db.add(pred)

        # Seed Service Requests
        print("[INFO] Seeding Service Requests...")
        sr = db.query(ServiceRequest).filter(ServiceRequest.ticket_number == "SR-2026-0001").first()
        if not sr and v60:
            sr = ServiceRequest(
                ticket_number="SR-2026-0001",
                equipment_id=v60.id,
                raised_by_id=users_map[UserRole.NURSE_DOCTOR].id,
                assigned_engineer_id=users_map[UserRole.MAINTENANCE_ENGINEER].id,
                priority=ServicePriority.HIGH,
                issue="Compressor Motor Vibration & Temperature Drift",
                observed_symptoms="Cooling fan running continuously at 100% capacity.",
                risk_score=78.5,
                status=ServiceStatus.IN_SERVICE
            )
            db.add(sr)
            db.flush()

            activity = MaintenanceActivity(
                equipment_id=v60.id,
                service_request_id=sr.id,
                engineer_id=users_map[UserRole.MAINTENANCE_ENGINEER].id,
                activity="Started Inspection & Cleaning",
                notes="Inspected airway transducer and cooling fan bearing.",
                activity_date=date.today(),
                activity_time="09:30 AM"
            )
            db.add(activity)

        # Seed Spare Parts
        print("[INFO] Seeding Spare Parts Inventory...")
        parts = [
            {"pid": "PRT-HEPA-01", "name": "ICU Ventilator HEPA Filter Assembly", "stock": 25, "cost": 85.0},
            {"pid": "PRT-BAT-02", "name": "Defibrillator Li-ion Battery Pack 14.8V", "stock": 12, "cost": 240.0},
            {"pid": "PRT-SEN-03", "name": "Airway Pressure Transducer Sensor", "stock": 8, "cost": 150.0},
            {"pid": "PRT-FAN-04", "name": "Brushless Cooling Fan 12V DC", "stock": 15, "cost": 45.0},
        ]
        for p in parts:
            sp = db.query(SparePart).filter(SparePart.product_id == p["pid"]).first()
            if not sp:
                sp = SparePart(
                    product_id=p["pid"],
                    part_name=p["name"],
                    description="Medical grade OEM certified replacement component.",
                    quantity_in_stock=p["stock"],
                    minimum_stock=5,
                    unit_cost=p["cost"]
                )
                db.add(sp)

        db.commit()
        print("==================================================")
        print("[SUCCESS] DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("Standard User Accounts:")
        print(" 1. Nurse/Doctor:      nurse@medequip.com      / NursePass123!")
        print(" 2. Maintenance Eng:   engineer@medequip.com   / EngPass123!")
        print(" 3. Hospital Admin:    admin@medequip.com      / AdminPass123!")
        print("==================================================")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
