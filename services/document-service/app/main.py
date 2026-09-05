from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .middleware import InternalSecretMiddleware
from .routers.health import router as health_router
from .routers.docx import router as docx_router, parse_router as parse_docx_router
from .routers.pdf import router as pdf_router

app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.VERSION,
    description=(
        "DocDraft AI Microservice for high-fidelity Microsoft Word (.docx), "
        "Puppeteer Chromium vector PDF export, and OCR scanning."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS configuration for cross-service development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication middleware checking X-Internal-Secret
app.add_middleware(InternalSecretMiddleware)

# Mount API Routers
app.include_router(health_router)
app.include_router(docx_router)
app.include_router(parse_docx_router)
app.include_router(pdf_router)


@app.get("/")
async def root():
    """Root redirect / informative endpoint."""
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/docs",
        "health": "/health",
    }
