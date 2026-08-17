import os
import joblib
import pandas as pd
import numpy as np
from datetime import date
from typing import Dict, Any, Tuple
from app.core.config import settings

class MLService:
    def __init__(self):
        self.xgb_model = None
        self.preprocessor = None
        self.fix_preprocessor = None
        self.label_encoder_fix = None
        self.is_loaded = False
        self.load_models()

    def _get_model_dir(self) -> str:
        # Check mlmodels or models directory
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        mlmodels_path = os.path.join(base_dir, "mlmodels")
        models_path = os.path.join(base_dir, "models")
        if os.path.exists(mlmodels_path):
            return mlmodels_path
        return models_path

    def load_models(self):
        model_dir = self._get_model_dir()
        xgb_path = os.path.join(model_dir, "xgb_model.joblib")
        prep_path = os.path.join(model_dir, "preprocessor.joblib")
        fix_prep_path = os.path.join(model_dir, "fix_preprocessor.joblib")
        le_fix_path = os.path.join(model_dir, "label_encoder_fix_category.joblib")

        try:
            if os.path.exists(xgb_path) and os.path.exists(prep_path):
                self.xgb_model = joblib.load(xgb_path)
                self.preprocessor = joblib.load(prep_path)

                if os.path.exists(fix_prep_path):
                    self.fix_preprocessor = joblib.load(fix_prep_path)
                if os.path.exists(le_fix_path):
                    self.label_encoder_fix = joblib.load(le_fix_path)

                self.is_loaded = True
                print(f"[INFO] ML Models loaded successfully from {model_dir}")
            else:
                print(f"[WARNING] ML Model files not found in {model_dir}. Rule-based evaluation active.")
        except Exception as e:
            print(f"[ERROR] Exception loading ML models: {e}")
            self.is_loaded = False

    def predict_health(
        self,
        machine_name: str,
        category: str,
        temp_c: float,
        pressure_cmh2o: float,
        operating_hours: int,
        downtime_hours: int,
        battery_voltage_v: float,
        flow_rate_lmin: float,
        system_error_code: str,
        clinical_notes: str,
        last_service_date: date = None
    ) -> Dict[str, Any]:

        # Calculate days_since_service from last_service_date
        if last_service_date:
            days_since_service = max(0, (date.today() - last_service_date).days)
        else:
            days_since_service = 90

        notes_str = str(clinical_notes or "")
        notes_len = len(notes_str)
        notes_abnormal = 1 if any(kw in notes_str.lower() for kw in ['fail', 'abnormal', 'unable', 'error', 'fault', 'degrad']) else 0

        # Construct single row dataframe matching preprocessor exact schema
        input_df = pd.DataFrame([{
            'Operating_Temperature_C': temp_c,
            'System_Pressure_cmH2O': pressure_cmh2o,
            'Total_Operating_Hours': operating_hours,
            'Recent_Downtime_Hours': downtime_hours,
            'Backup_Battery_Voltage_V': battery_voltage_v,
            'Flow_Rate_Lmin': flow_rate_lmin,
            'Days_Since_Service': days_since_service,
            'Notes_Length': notes_len,
            'Notes_Mentions_Abnormal': notes_abnormal,
            'Machine_Name': machine_name,
            'Category': category,
            'System_Error_Code': system_error_code or "NONE"
        }])

        contributing_factors = []
        if temp_c > 40.0: contributing_factors.append("High Operating Temperature (>40.0°C)")
        if battery_voltage_v < 11.5: contributing_factors.append("Backup Battery Under-Voltage (<11.5V)")
        if downtime_hours > 10: contributing_factors.append("Excessive Recent Downtime (>10 hrs)")
        if system_error_code and system_error_code.upper() != "NONE": contributing_factors.append(f"Self-Diagnostic System Error ({system_error_code})")
        if notes_abnormal: contributing_factors.append("Abnormalities Logged in Clinical Observation Notes")

        if self.is_loaded and self.xgb_model and self.preprocessor:
            try:
                processed_features = self.preprocessor.transform(input_df)
                prob_failure = float(self.xgb_model.predict_proba(processed_features)[0][1] * 100)
                is_fail = prob_failure > 50.0

                recommended_fix = "Routine PM inspection & verification"
                if is_fail:
                    if hasattr(self.xgb_model, 'fix_model') and self.fix_preprocessor and self.label_encoder_fix:
                        try:
                            fix_features = self.fix_preprocessor.transform(input_df)
                            fix_code = self.xgb_model.fix_model.predict(fix_features)[0]
                            recommended_fix = str(self.label_encoder_fix.inverse_transform([fix_code])[0])
                        except Exception:
                            recommended_fix = self._rule_based_fix(temp_c, battery_voltage_v, system_error_code, downtime_hours)
                    else:
                        recommended_fix = self._rule_based_fix(temp_c, battery_voltage_v, system_error_code, downtime_hours)

                risk_level = "CRITICAL" if prob_failure > 70 else ("HIGH" if prob_failure > 50 else ("MEDIUM" if prob_failure > 30 else "LOW"))

                return {
                    "risk_score": round(prob_failure, 2),
                    "risk_level": risk_level,
                    "recommended_fix": recommended_fix,
                    "contributing_factors": contributing_factors if contributing_factors else ["Nominal baseline telemetry"],
                    "model_name": "XGBoost Classifier Pipeline",
                    "model_version": "1.0.0",
                    "days_since_service": days_since_service
                }
            except Exception as e:
                print(f"[WARNING] ML execution error: {e}. Executing rule-based fallback...")

        # Rule-based fallback if ML joblib artifacts unavailable
        return self._rule_based_predict(temp_c, battery_voltage_v, downtime_hours, system_error_code, days_since_service, contributing_factors)

    def _rule_based_fix(self, temp: float, voltage: float, error_code: str, downtime: int) -> str:
        err = (error_code or "").upper()
        if "BAT" in err or voltage < 11.5:
            return "Battery"
        elif "CHILL" in err or temp > 41.0:
            return "Thermal/Cooling"
        elif "CAL" in err or "ERR" in err:
            return "Calibration"
        elif downtime > 15:
            return "Electrical Safety"
        return "Mechanical/PM"

    def _rule_based_predict(self, temp: float, voltage: float, downtime: int, error_code: str, days_since: int, factors: list) -> Dict[str, Any]:
        score = 10.0
        if temp > 42.0: score += 40.0
        elif temp > 39.5: score += 20.0

        if voltage < 11.0: score += 35.0
        elif voltage < 12.0: score += 15.0

        if error_code and error_code.upper() != "NONE": score += 35.0
        if downtime > 12: score += 20.0
        if days_since > 180: score += 15.0

        prob = min(98.5, score)
        risk_level = "CRITICAL" if prob > 70 else ("HIGH" if prob > 50 else ("MEDIUM" if prob > 30 else "LOW"))
        fix = self._rule_based_fix(temp, voltage, error_code, downtime) if prob > 50 else "Routine PM inspection & verification"

        return {
            "risk_score": round(prob, 2),
            "risk_level": risk_level,
            "recommended_fix": fix,
            "contributing_factors": factors if factors else ["Nominal telemetry parameters"],
            "model_name": "Telemetry Rule Engine Fallback",
            "model_version": "1.0.0",
            "days_since_service": days_since
        }

ml_service = MLService()
