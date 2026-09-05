import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel

# Load .env from workspace root if present
root_env = Path(__file__).resolve().parent.parent.parent.parent / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()

class Settings(BaseModel):
    """Application configuration settings."""
    SERVICE_NAME: str = "DocDraft AI Document Processing Service"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # Internal secret token shared between Next.js and FastAPI
    INTERNAL_SECRET_KEY: str = (
        os.getenv("DOCDRAFT_INTERNAL_SECRET") 
        or os.getenv("INTERNAL_SECRET")
        or os.getenv("INTERNAL_SECRET_KEY")
        or "docdraft_internal_secret_dev_2026"
    )

settings = Settings()
