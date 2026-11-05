import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.base import Base
from app.database.session import get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.services.llm_service import LLMService, get_llm_service

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test_medequip.db"

engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Start from a clean schema so new columns/tables are always present.
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed Personas into Test DB
    personas = [
        ("Dr. Priya", "nurse@medequip.com", "NursePass123!", UserRole.NURSE_DOCTOR),
        ("Senior Technician J. Miller", "engineer@medequip.com", "EngPass123!", UserRole.MAINTENANCE_ENGINEER),
        ("Dr. Sarah Chen", "admin@medequip.com", "AdminPass123!", UserRole.HOSPITAL_ADMIN)
    ]
    for name, email, pw, role in personas:
        if not db.query(User).filter(User.email == email).first():
            u = User(full_name=name, email=email, password_hash=get_password_hash(pw), role=role, is_active=True)
            db.add(u)
    db.commit()
    db.close()
    
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    # Never call the real NVIDIA API from tests: default to an unconfigured client.
    app.dependency_overrides[get_llm_service] = lambda: LLMService(api_key="")
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
