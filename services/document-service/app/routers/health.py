import time
import shutil
from fastapi import APIRouter
from ..config import settings

router = APIRouter(tags=["System"])

START_TIME = time.time()


def check_chromium_available() -> bool:
    """Check if Chromium or Google Chrome binary is available on the system."""
    for binary in ["chromium", "chromium-browser", "google-chrome", "chrome"]:
        if shutil.which(binary) is not None:
            return True
    return False


@router.get("/health")
async def health_check():
    """
    Health check endpoint for container liveness and readiness probes.
    Publicly accessible without authentication secret.
    """
    uptime = int(time.time() - START_TIME)
    chrome_ready = check_chromium_available()
    
    return {
        "status": "healthy",
        "service": "document-service",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "chrome_available": chrome_ready,
        "uptime_seconds": uptime,
    }
