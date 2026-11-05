import os
from pydantic_settings import BaseSettings
from typing import List, Optional

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

    # Multi-hospital isolation (users without an explicit hospital belong here)
    DEFAULT_HOSPITAL_ID: str = "HOSP-001"

    # NVIDIA NIM GenAI for the Nurse Equipment Assistance chatbot (https://build.nvidia.com).
    # Credentials come ONLY from the environment / .env file.
    # Leave NVIDIA_API_KEY empty to run the assistant in retrieval-only mode.
    NVIDIA_API_KEY: Optional[str] = None
    NVIDIA_API_URL: str = "https://integrate.api.nvidia.com/v1/chat/completions"
    NVIDIA_MODEL: str = "nvidia/nemotron-3.5-super-vl-120b-a12b"
    NVIDIA_TIMEOUT_SECONDS: float = 90.0   # large reasoning model; allow extra time
    NVIDIA_MAX_TOKENS: int = 4096

    # RAG / Knowledge Base
    RAG_CHUNK_SIZE: int = 900          # characters per chunk
    RAG_CHUNK_OVERLAP: int = 150       # characters carried into the next chunk
    RAG_TOP_K: int = 5
    RAG_MIN_RELEVANCE: float = 0.08    # cosine similarity floor (TF-IDF is lexical)
    KNOWLEDGE_MAX_UPLOAD_MB: int = 20

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
