from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ExportConfig(BaseModel):
    """Configuration options for Word/PDF document generation."""
    # Quy chuẩn Nghị định 30/2020/NĐ-CP: Lề trên 20-25mm, lề dưới 20-25mm, lề trái 30-35mm, lề phải 15-20mm
    margin_top_mm: int = Field(default=20, ge=10, le=40)
    margin_bottom_mm: int = Field(default=20, ge=10, le=40)
    margin_left_mm: int = Field(default=30, ge=15, le=40)
    margin_right_mm: int = Field(default=15, ge=10, le=30)
    font_family: str = Field(default="Times New Roman")
    font_size_pt: int = Field(default=13, ge=10, le=16)
    include_signature: bool = Field(default=False)
    signature_image_url: Optional[str] = None
    watermark_text: Optional[str] = None
    qr_verify_url: Optional[str] = None


class ExportDocxRequest(BaseModel):
    """Payload to render a Word document from Tiptap AST."""
    draft_id: str
    title: str
    content_json: Dict[str, Any]  # Tiptap ProseMirror JSON AST
    config: ExportConfig = Field(default_factory=ExportConfig)


class ExportPdfRequest(BaseModel):
    """Payload to render a PDF document from pre-rendered HTML."""
    draft_id: str
    title: str
    html_content: str
    config: ExportConfig = Field(default_factory=ExportConfig)


class ParseDocxResponse(BaseModel):
    """Response returned when parsing an uploaded .docx file into Tiptap AST."""
    success: bool
    title: str
    content_json: Dict[str, Any]
    word_count: int
    table_count: int


class OcrScanResponse(BaseModel):
    """Response returned when performing OCR on a scanned document image or PDF."""
    success: bool
    raw_text: str
    confidence: float
    language: str
    detected_entities: Dict[str, Any] = Field(default_factory=dict)
