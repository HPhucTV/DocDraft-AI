from .health import router as health_router
from .docx import router as docx_router
from .pdf import router as pdf_router

__all__ = ["health_router", "docx_router", "pdf_router"]
