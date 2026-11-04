# MedEquip Backend (FastAPI + ML)

REST API for the MedEquip platform. It handles authentication and role-based access, equipment inventory, health readings, ML risk predictions, the service-request workflow, maintenance logs, spare parts, recalls, replacements, dashboards, notifications and reports.

- **Base URL:** `http://localhost:8000`
- **API prefix:** `/api`
- **Swagger UI:** `http://localhost:8000/docs`, **ReDoc:** `/redoc`
- **Health check:** `GET /` returns status, version and `models_loaded`

---

## Setup

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env              # then edit values
python scripts/seed_database.py     # tables + demo data
python run.py                       # uvicorn with reload on 0.0.0.0:8000
```

Alternative: `uvicorn main:app --reload` (`main.py` re-exports `app.main:app`).

Tables are also created automatically on startup (`Base.metadata.create_all` in the app lifespan).

---

## Configuration (`.env`)

Loaded by `app/core/config.py` (pydantic-settings).

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `mysql+pymysql://root:root@localhost:3306/medequip` | SQLAlchemy URL. Supports SQLite, MySQL and PostgreSQL. |
| `JWT_SECRET_KEY` | dev placeholder | **Change this for any real deployment.** |
| `JWT_ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Token lifetime (8 hours) |
| `FRONTEND_URL` | `http://localhost:5173` | |
| `ML_MODELS_DIR` | `mlmodels` | |

**Database fallback:** `app/database/session.py` tries to connect to `DATABASE_URL` with a 3-second timeout. If that fails, it logs a warning and uses `sqlite:///./medequip.db`. For MySQL, also run `pip install pymysql` (it isn't in `requirements.txt`). For PostgreSQL, `psycopg` is already included; use a `postgresql+psycopg://...` URL.

**CORS:** any `localhost` / `127.0.0.1` origin on any port is allowed (see `ALLOWED_ORIGINS` and the origin regex in `app/main.py`).

---

## Project structure

```
backend/
├── app/
│   ├── main.py               FastAPI app, CORS, router registration, legacy /api/predict
│   ├── core/
│   │   ├── config.py         Settings
│   │   ├── security.py       Password hashing (bcrypt) + JWT create/decode
│   │   └── permissions.py    require_nurse_or_doctor / require_engineer / require_admin
│   ├── database/             Declarative Base, engine + SessionLocal + SQLite fallback
│   ├── dependencies/         get_current_user (JWT bearer), get_db
│   ├── models/               SQLAlchemy ORM models (see Data model)
│   ├── schemas/              Pydantic request/response models
│   ├── routers/              One module per resource (see API reference)
│   └── services/ml_service.py  ML inference + rule-based fallback (singleton `ml_service`)
├── mlmodels/                 Trained artifacts
├── scripts/                  create_db.py, seed_database.py, import_dataset.py
├── tests/                    pytest suite
├── alembic/ + alembic.ini    Migration scaffolding (no revisions yet)
├── reset_passwords.py        Resets the demo users' passwords
└── run.py                    Dev server launcher
```

---

## Roles & permissions

`UserRole` enum (`app/models/user.py`):

| Role | Can |
| --- | --- |
| `NURSE_DOCTOR` | Log health readings, run assessments, raise service requests, view inventory |
| `MAINTENANCE_ENGINEER` | Work service requests through their lifecycle, log maintenance activity, request spare parts |
| `HOSPITAL_ADMIN` | Everything above, plus recalls approve/close, replacements, admin dashboard |

`HOSPITAL_ADMIN` passes every role check (`app/core/permissions.py`).

**Auth flow:** `POST /api/auth/login` returns a JWT. Send it as `Authorization: Bearer <token>` on every protected endpoint.

---

## API reference

All paths are prefixed with `/api`. Swagger at `/docs` has the full request and response schemas.

### Auth & users
| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT access token |
| GET | `/auth/me` | Current user profile |
| GET | `/users` | List users |
| GET | `/users/{user_id}` | Get user |

### Equipment, health & predictions
| Method | Path | Description |
| --- | --- | --- |
| GET | `/equipment` | Paginated, filterable list |
| GET | `/equipment/{id}` | Get one |
| POST | `/equipment` | Register equipment |
| PATCH | `/equipment/{id}` | Update |
| DELETE | `/equipment/{id}` | Remove |
| GET | `/equipment/{id}/timeline` | Combined event timeline |
| POST | `/equipment/{id}/health` | Record a health reading |
| GET | `/equipment/{id}/health` | Reading history |
| GET | `/equipment/{id}/health/latest` | Latest reading |
| POST | `/equipment/{id}/health-assessment` | Reading + ML assessment in one call |
| GET | `/equipment/{id}/predictions` | Prediction history |
| POST | `/predict` | Legacy stateless prediction (no auth, raw telemetry dict) |

### Service requests (work orders)
| Method | Path | Transition |
| --- | --- | --- |
| GET | `/service-requests` | Paginated list |
| GET | `/service-requests/{id}` | Get one |
| POST | `/service-requests` | Create, status `RAISED` |
| PATCH | `/service-requests/{id}` | Edit fields |
| POST | `/service-requests/{id}/acknowledge` | `ACKNOWLEDGED` |
| POST | `/service-requests/{id}/start-diagnosis` | `IN_DIAGNOSIS` |
| POST | `/service-requests/{id}/start-service` | `IN_SERVICE` |
| POST | `/service-requests/{id}/waiting-for-parts` | `WAITING_FOR_PARTS` |
| POST | `/service-requests/{id}/delay` | `SERVICE_DELAYED` |
| POST | `/service-requests/{id}/complete` | `COMPLETED` |
| POST | `/service-requests/{id}/reject` | `REJECTED` |

Priorities: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

### Maintenance, parts, recalls, replacements
| Method | Path | Description |
| --- | --- | --- |
| GET / POST | `/maintenance` | List / create maintenance service records |
| GET | `/maintenance/history` | Completed maintenance history |
| GET | `/maintenance/{id}` | Get one |
| POST / GET | `/maintenance/{id}/activity`, `/maintenance/{id}/activities` | Log / list activities |
| GET | `/spare-parts` | Inventory |
| GET / POST | `/spare-parts/requests` | Part requests |
| GET / POST | `/recalls` | List / create recalls |
| GET | `/recalls/{id}` | Get one |
| POST | `/recalls/{id}/approve`, `/recalls/{id}/close` | Recall lifecycle |
| GET / POST | `/replacements` | Equipment replacement records |

### Dashboards, notifications, reports
| Method | Path | Description |
| --- | --- | --- |
| GET | `/dashboard/clinical` | Clinical KPIs |
| GET | `/dashboard/maintenance` | Engineer KPIs |
| GET | `/dashboard/admin` | Executive KPIs |
| GET | `/notifications` | Current user's notifications |
| POST | `/notifications/{id}/read` | Mark read |
| GET | `/reports/summary` | Summary report |

---

## Data model

ORM models in `app/models/`:

| Model | Purpose |
| --- | --- |
| `User` | Accounts and roles |
| `Equipment` | Asset registry (status, department, manufacturer, service dates) |
| `EquipmentHealthReading` | Telemetry snapshots |
| `Prediction` | ML outputs (risk score, level, recommended fix) |
| `ServiceRequest` | Work orders (ticket number, status, priority) |
| `MaintenanceService` / `MaintenanceActivity` | Service records and their activity log |
| `SparePart` / `SparePartRequest` | Inventory and requests |
| `Recall` | Manufacturer safety recalls |
| `EquipmentReplacement` | Replacement decisions |
| `Warranty`, `Invoice` | Contract and cost data |
| `Notification`, `AuditLog` | User alerts and audit trail |

---

## ML engine

`app/services/ml_service.py` exposes a singleton `ml_service`.

**Inputs:** machine name, category, temperature (°C), pressure (cmH₂O), operating hours, downtime hours, battery voltage (V), flow rate (L/min), system error code, clinical notes and last service date.

**Derived features:** `Days_Since_Service` (90 when unknown), `Notes_Length`, and `Notes_Mentions_Abnormal` (set when the notes contain keywords such as fail, error, fault or abnormal).

**Model path (when `mlmodels/xgb_model.joblib` and `preprocessor.joblib` exist):**
1. `preprocessor.transform`, then `xgb_model.predict_proba` gives the failure probability as a percentage.
2. If the probability is over 50%, the fix model (`fix_preprocessor` + `label_encoder_fix_category`) predicts the repair category. If that fails, the rule-based fix is used.

**Fallback path:** a rule engine based on thresholds such as temperature > 40 °C, battery < 11.5 V, downtime > 10 h, and a non-`NONE` error code.

**Risk levels:** `CRITICAL` > 70, `HIGH` > 50, `MEDIUM` > 30, otherwise `LOW`.

| Artifact | Role |
| --- | --- |
| `xgb_model.joblib` | Failure classifier |
| `preprocessor.joblib` | Feature pipeline for the classifier |
| `fix_preprocessor.joblib`, `label_encoder_fix_category.joblib` | Fix-category model support |
| `pytorch_mlp_model.pth` | PyTorch MLP weights (not loaded by the current service) |

---

## Scripts

| Command | What it does |
| --- | --- |
| `python scripts/seed_database.py` | Creates tables and seeds the 3 demo users, equipment, readings, service requests, parts, recalls and warranties |
| `python scripts/create_db.py` | Creates the MySQL/PostgreSQL database named in `DATABASE_URL` (`CREATE DATABASE IF NOT EXISTS`) |
| `python scripts/import_dataset.py --file <path.xlsx>` | Bulk-imports an equipment/telemetry Excel dataset (default file name `hospital_predictive_maintenance_20000_enhanced.xlsx`) |
| `python reset_passwords.py` | ⚠️ Sets **every** user's password to `Password123!` and prints the hashes. Dev use only. |

---

## Tests

```powershell
pytest -v
```

| File | Covers |
| --- | --- |
| `tests/conftest.py` | Isolated `sqlite:///./test_medequip.db`, seeds the 3 personas, overrides `get_db` |
| `tests/test_auth.py` | `test_register_and_login` |
| `tests/test_equipment.py` | `test_create_and_get_equipment` |
| `tests/test_health_prediction.py` | `test_health_assessment_endpoint` |
| `tests/test_service_workflow.py` | `test_service_request_workflow` |
