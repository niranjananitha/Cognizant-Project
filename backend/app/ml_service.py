import os
import joblib
import pandas as pd
import numpy as np
from app.schemas import TelemetryInput, PredictionResult

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")

XGB_MODEL_PATH = os.path.join(MODELS_DIR, "xgb_model.joblib")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.joblib")
FIX_PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "fix_preprocessor.joblib")
LABEL_ENCODER_FIX_PATH = os.path.join(MODELS_DIR, "label_encoder_fix_category.joblib")

class MLInferenceService:
    def __init__(self):
        self.xgb_model = None
        self.preprocessor = None
        self.fix_preprocessor = None
        self.label_encoder_fix = None
        self.is_loaded = False
        self.load_models()

    def load_models(self):
        try:
            if (
                os.path.exists(XGB_MODEL_PATH)
                and os.path.exists(PREPROCESSOR_PATH)
            ):
                self.xgb_model = joblib.load(XGB_MODEL_PATH)
                self.preprocessor = joblib.load(PREPROCESSOR_PATH)
                
                if os.path.exists(FIX_PREPROCESSOR_PATH):
                    self.fix_preprocessor = joblib.load(FIX_PREPROCESSOR_PATH)
                if os.path.exists(LABEL_ENCODER_FIX_PATH):
                    self.label_encoder_fix = joblib.load(LABEL_ENCODER_FIX_PATH)

                self.is_loaded = True
                print("[INFO] ML Models & Preprocessors loaded successfully!")
            else:
                print("[WARNING] Model files not found in backend/models/. Fallback telemetry evaluation enabled.")
        except Exception as e:
            print(f"[ERROR] Error loading ML models: {e}")
            self.is_loaded = False

    def predict(self, input_data: TelemetryInput) -> PredictionResult:
        notes_text = str(input_data.clinical_notes or "")
        notes_len = len(notes_text)
        notes_abn = 1 if any(kw in notes_text.lower() for kw in ['fail', 'abnormal', 'unable', 'error', 'fault', 'degrad']) else 0

        # Construct single row dataframe matching preprocessor features
        sample_df = pd.DataFrame([{
            'Operating_Temperature_C': input_data.operating_temperature_c,
            'System_Pressure_cmH2O': input_data.system_pressure_cmh2o,
            'Total_Operating_Hours': input_data.total_operating_hours,
            'Recent_Downtime_Hours': input_data.recent_downtime_hours,
            'Backup_Battery_Voltage_V': input_data.backup_battery_voltage_v,
            'Flow_Rate_Lmin': input_data.flow_rate_lmin,
            'Days_Since_Service': input_data.days_since_service or 90,
            'Notes_Length': notes_len,
            'Notes_Mentions_Abnormal': notes_abn,
            'Machine_Name': input_data.machine_name,
            'Category': input_data.category,
            'System_Error_Code': input_data.system_error_code or "NONE"
        }])

        if self.is_loaded and self.xgb_model and self.preprocessor:
            try:
                sample_p = self.preprocessor.transform(sample_df)
                prob_failure = float(self.xgb_model.predict_proba(sample_p)[0][1] * 100)
                is_fail = prob_failure > 50.0

                fix_category = "Mechanical/PM"
                if is_fail and self.fix_preprocessor and hasattr(self.xgb_model, 'fix_model'):
                    try:
                        sample_fix_p = self.fix_preprocessor.transform(sample_df)
                        fix_code = self.xgb_model.fix_model.predict(sample_fix_p)[0]
                        fix_category = str(self.label_encoder_fix.inverse_transform([fix_code])[0])
                    except Exception:
                        fix_category = self._heuristic_fix(input_data)
                elif is_fail:
                    fix_category = self._heuristic_fix(input_data)
                else:
                    fix_category = "Mechanical/PM"

                status = "CRITICAL" if prob_failure > 70 else ("WARNING" if prob_failure > 35 else "OPTIMAL")

                return PredictionResult(
                    machine_name=input_data.machine_name,
                    category=input_data.category,
                    failure_probability=round(prob_failure, 2),
                    is_failure_risk=is_fail,
                    status=status,
                    recommended_fix_category=fix_category,
                    model_used="XGBoost ML Pipeline"
                )
            except Exception as e:
                print(f"Inference error: {e}. Using fallback telemetry rules.")

        # Heuristic fallback if model files not yet copied to models/
        return self._heuristic_predict(input_data, sample_df)

    def _heuristic_fix(self, input_data: TelemetryInput) -> str:
        err = (input_data.system_error_code or "").upper()
        if "BAT" in err or input_data.backup_battery_voltage_v < 11.5:
            return "Battery"
        elif "CHILL" in err or input_data.operating_temperature_c > 41.0:
            return "Thermal/Cooling"
        elif "CAL" in err or "ERR" in err:
            return "Calibration"
        elif input_data.recent_downtime_hours > 15:
            return "Electrical Safety"
        return "Mechanical/PM"

    def _heuristic_predict(self, input_data: TelemetryInput, df: pd.DataFrame) -> PredictionResult:
        score = 0
        if input_data.operating_temperature_c > 42.0: score += 40
        elif input_data.operating_temperature_c > 39.5: score += 20

        if input_data.backup_battery_voltage_v < 11.0: score += 35
        elif input_data.backup_battery_voltage_v < 12.0: score += 15

        if input_data.system_error_code and input_data.system_error_code.upper() != "NONE":
            score += 35

        if input_data.recent_downtime_hours > 12: score += 20
        if input_data.total_operating_hours > 15000: score += 15

        prob = float(min(score, 98.5))
        is_fail = prob > 50.0
        status = "CRITICAL" if prob > 65 else ("WARNING" if prob > 30 else "OPTIMAL")
        fix_cat = self._heuristic_fix(input_data) if is_fail else "Mechanical/PM"

        return PredictionResult(
            machine_name=input_data.machine_name,
            category=input_data.category,
            failure_probability=round(prob, 2),
            is_failure_risk=is_fail,
            status=status,
            recommended_fix_category=fix_cat,
            model_used="Telemetry Heuristic Rule Engine"
        )

# Global Singleton Instance
ml_service = MLInferenceService()
