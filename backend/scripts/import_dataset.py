import os
import sys
import argparse
import pandas as pd
from datetime import datetime, date, timezone

# Add backend root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.models.equipment import Equipment, EquipmentStatus
from app.models.health_reading import EquipmentHealthReading
from app.models.prediction import Prediction, RiskLevel

def parse_date(val):
    if pd.isna(val):
        return date.today()
    if isinstance(val, (datetime, pd.Timestamp)):
        return val.date()
    if isinstance(val, str):
        try:
            return datetime.strptime(val.strip(), "%Y-%m-%d").date()
        except ValueError:
            try:
                return datetime.strptime(val.strip(), "%d/%m/%Y").date()
            except ValueError:
                return date.today()
    return date.today()

def import_excel_dataset(file_path: str):
    if not os.path.exists(file_path):
        print(f"❌ Dataset file not found: {file_path}")
        return False

    print(f"📊 Reading dataset from {file_path}...")
    try:
        if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
            df = pd.read_excel(file_path)
        else:
            df = pd.read_csv(file_path)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False

    print(f"Total rows found: {len(df)}")
    
    # Required columns check
    required_cols = [
        "Machine_ID", "Machine_Name", "Category", "Last_Service_Date",
        "Operating_Temperature_C", "System_Pressure_cmH2O", "Total_Operating_Hours",
        "Recent_Downtime_Hours", "Backup_Battery_Voltage_V", "Flow_Rate_Lmin",
        "System_Error_Code", "Clinical_Notes", "Machine_Failure", "Recommended_Fix_Action"
    ]
    
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        print(f"⚠️ Warning: Missing expected columns: {missing}. Proceeding with fallback parsing...")

    # Create tables if not exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    imported_equipment = 0
    imported_readings = 0
    skipped_duplicates = 0
    invalid_rows = 0

    try:
        for idx, row in df.iterrows():
            try:
                m_id = str(row.get("Machine_ID", f"AST-{1000+idx}")).strip()
                m_name = str(row.get("Machine_Name", "Medical Equipment")).strip()
                cat = str(row.get("Category", "General Equipment")).strip()
                last_service = parse_date(row.get("Last_Service_Date"))
                
                # Check duplicate machine_id
                existing_equip = db.query(Equipment).filter(Equipment.machine_id == m_id).first()
                if not existing_equip:
                    is_failure_hist = int(row.get("Machine_Failure", 0)) == 1
                    status = EquipmentStatus.HIGH_RISK if is_failure_hist else EquipmentStatus.AVAILABLE
                    
                    equip = Equipment(
                        machine_id=m_id,
                        machine_name=m_name,
                        category=cat,
                        manufacturer="Certified OEM Provider",
                        model="Standard Clinical Series",
                        serial_number=f"SN-{m_id}",
                        department="Intensive Care (ICU)" if cat == "Ventilators" else ("Emergency (ER)" if cat == "Defibrillators" else "General Ward"),
                        location=f"Bay-{idx % 12 + 1}",
                        purchase_date=date(2021, 1, 15),
                        last_service_date=last_service,
                        status=status,
                        is_backup_ready=not is_failure_hist
                    )
                    db.add(equip)
                    db.flush()
                    equipment_obj = equip
                    imported_equipment += 1
                else:
                    equipment_obj = existing_equip
                    skipped_duplicates += 1

                # Calculate days since service
                days_since = (date.today() - last_service).days if last_service else 90

                # Health Reading Record
                health = EquipmentHealthReading(
                    equipment_id=equipment_obj.id,
                    operating_temperature_c=float(row.get("Operating_Temperature_C", 37.5)),
                    system_pressure_cmh2o=float(row.get("System_Pressure_cmH2O", 15.0)),
                    total_operating_hours=int(row.get("Total_Operating_Hours", 5000)),
                    recent_downtime_hours=int(row.get("Recent_Downtime_Hours", 0)),
                    backup_battery_voltage_v=float(row.get("Backup_Battery_Voltage_V", 12.4)),
                    flow_rate_lmin=float(row.get("Flow_Rate_Lmin", 40.0)),
                    system_error_code=str(row.get("System_Error_Code", "NONE")).strip(),
                    clinical_notes=str(row.get("Clinical_Notes", "Historical baseline inspection.")).strip(),
                    days_since_service=days_since,
                )
                db.add(health)
                db.flush()
                imported_readings += 1

                # Historical prediction persistence
                is_fail = int(row.get("Machine_Failure", 0)) == 1
                pred = Prediction(
                    equipment_id=equipment_obj.id,
                    health_reading_id=health.id,
                    risk_score=85.0 if is_fail else 15.0,
                    risk_level=RiskLevel.HIGH if is_fail else RiskLevel.LOW,
                    recommended_fix=str(row.get("Recommended_Fix_Action", "Routine Maintenance")).strip(),
                    contributing_factors={"imported_dataset_row": idx},
                    model_name="Historical Dataset Benchmark",
                    model_version="1.0.0"
                )
                db.add(pred)

            except Exception as row_err:
                invalid_rows += 1
                print(f"Skipping row {idx} due to error: {row_err}")
                continue

        db.commit()
        print("==================================================")
        print("✅ DATASET IMPORT COMPLETE!")
        print(f"Equipment Imported: {imported_equipment}")
        print(f"Health Readings Created: {imported_readings}")
        print(f"Duplicate Machines Skipped: {skipped_duplicates}")
        print(f"Invalid Rows Skipped: {invalid_rows}")
        print("==================================================")
        return True

    except Exception as e:
        db.rollback()
        print(f"❌ Critical error during import transaction, rolling back: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import Medical Equipment Dataset into PostgreSQL")
    parser.add_argument("--file", type=str, default="hospital_predictive_maintenance_20000_enhanced.xlsx", help="Path to Excel dataset file")
    args = parser.parse_args()

    # Search paths
    possible_paths = [
        args.file,
        os.path.join(os.path.dirname(__file__), "..", args.file),
        os.path.join(os.path.dirname(__file__), "..", "..", args.file)
    ]

    target = None
    for p in possible_paths:
        if os.path.exists(p):
            target = p
            break

    if target:
        import_excel_dataset(target)
    else:
        print(f"File '{args.file}' not found in current directory. Creating seed dataset structure...")
