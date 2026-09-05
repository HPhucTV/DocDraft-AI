import io
import urllib.parse
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
import docx

from ..schemas.document import ExportDocxRequest, ParseDocxResponse
from ..services.docx_renderer import render_tiptap_to_docx

router = APIRouter(prefix="/export", tags=["Word Processing"])
parse_router = APIRouter(prefix="/parse", tags=["Word Processing"])


@router.post("/docx")
async def export_docx(payload: ExportDocxRequest):
    """
    Render Tiptap JSON AST to Microsoft Word (.docx) format with NĐ 30/2020 layout.
    Streams the binary file directly from memory without writing to disk.
    """
    try:
        buffer = render_tiptap_to_docx(
            content_json=payload.content_json,
            config=payload.config,
            title=payload.title,
        )

        # Encode filename safely for Content-Disposition header
        safe_filename = urllib.parse.quote(f"{payload.title or 'Van_ban'}.docx")

        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{safe_filename}",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render docx: {str(e)}")


@parse_router.post("/docx", response_model=ParseDocxResponse)
async def parse_docx(file: UploadFile = File(...)):
    """
    Parse an uploaded .docx file into Tiptap ProseMirror AST JSON.
    """
    if not file.filename or not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are supported")
    
    try:
        contents = await file.read()
        doc = docx.Document(io.BytesIO(contents))
        
        # Simple extraction for initial pipeline
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        title = paragraphs[0] if paragraphs else file.filename.replace(".docx", "")
        
        tiptap_content = []
        for p_text in paragraphs:
            tiptap_content.append({
                "type": "paragraph",
                "content": [{"type": "text", "text": p_text}]
            })
            
        content_json = {
            "type": "doc",
            "content": tiptap_content
        }
        
        word_count = sum(len(p.split()) for p in paragraphs)
        table_count = len(doc.tables)
        
        return ParseDocxResponse(
            success=True,
            title=title,
            content_json=content_json,
            word_count=word_count,
            table_count=table_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse docx: {str(e)}")
