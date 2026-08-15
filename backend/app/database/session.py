import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.database.base import Base

logger = logging.getLogger(__name__)

# Primary PostgreSQL Connection
db_url = settings.DATABASE_URL

# Fallback mechanism if PostgreSQL local instance is offline during dev testing
try:
    if "sqlite" in db_url:
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(db_url, pool_pre_ping=True, pool_size=10, max_overflow=20, connect_args={"connect_timeout": 2})
    
    # Test connection
    with engine.connect() as conn:
        logger.info("✅ Database connection established successfully.")
except Exception as e:
    logger.warning(f"⚠️ Could not connect to primary database at {db_url}: {e}")
    logger.info("🔄 Falling back to local SQLite database: sqlite:///./medequip.db")
    fallback_url = "sqlite:///./medequip.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
