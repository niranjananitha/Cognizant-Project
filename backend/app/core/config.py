import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "MedEquip Operations & ML Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # MySQL Database Connection
    DATABASE_URL: str = "mysql+pymysql://root:root@localhost:3306/medequip"
    
    # JWT
    JWT_SECRET_KEY: str = "medequip_super_secret_jwt_key_change_in_production_2026!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:8000",
        "http://[::1]:5173",
        "http://[::1]:5174",
        "http://[::1]:3000"
    ]
    
    # ML Models Path
    ML_MODELS_DIR: str = "mlmodels"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
