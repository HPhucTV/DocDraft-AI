import os
from pydantic import BaseModel

class Settings(BaseModel):
    """Application configuration settings."""
    SERVICE_NAME: str = "DocDraft AI Document Processing Service"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # Internal secret token shared between Next.js and FastAPI
    INTERNAL_SECRET_KEY: str = os.getenv(
        "DOCDRAFT_INTERNAL_SECRET", 
        os.getenv("INTERNAL_SECRET_KEY", "docdraft_internal_secret_dev_2026")
    )

settings = Settings()
