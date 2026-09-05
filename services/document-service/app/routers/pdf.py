import io
import urllib.parse
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..schemas.document import ExportPdfRequest
from ..services.pdf_renderer import render_html_to_vector_pdf

router = APIRouter(prefix="/export", tags=["PDF Processing"])


@router.post("/pdf")
async def export_pdf(payload: ExportPdfRequest):
    """
    Render HTML to vector PDF with A4 dimensions and NĐ 30/2020 margins.
    Streams the binary PDF directly from memory without writing to disk.
    """
    try:
        buffer = render_html_to_vector_pdf(
            html_content=payload.html_content,
            config=payload.config,
        )

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
