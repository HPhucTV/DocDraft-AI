import io
import urllib.parse
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..schemas.document import ExportPdfRequest

router = APIRouter(prefix="/export", tags=["PDF Processing"])


@router.post("/pdf")
async def export_pdf(payload: ExportPdfRequest):
    """
    Render HTML to vector PDF.
    Streams the binary PDF directly from memory.
    """
    try:
        # Fallback / initial placeholder PDF stream (in task 203 we will connect headless Chromium)
        pdf_bytes = b"%PDF-1.4\n%DocDraft AI Initial PDF Export Buffer\n%%EOF"
        buffer = io.BytesIO(pdf_bytes)
        buffer.seek(0)
        
        safe_filename = urllib.parse.quote(f"{payload.title or 'Van_ban'}.pdf")
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{safe_filename}",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render pdf: {str(e)}")
