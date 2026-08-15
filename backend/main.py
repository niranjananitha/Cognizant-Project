from app.main import app

# Re-export app so `uvicorn main:app --reload` works directly from `backend/`
__all__ = ["app"]
