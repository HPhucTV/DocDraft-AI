# ĐẶC TẢ GIAO DIỆN DOCUMENT SERVICE MICROSERVICE (FASTAPI API SPECIFICATION)

> **Mã tài liệu:** API-003  
> **Phân cấp ưu tiên:** **P1 (High — Hoàn thiện Core Engines Phase 1–2)**  
> **Trạng thái:** Approved  
> **Framework:** FastAPI (Python 3.11)  
> **Mạng nội bộ:** `http://document-service:8000` (Không public ra ngoài Internet)  
> **Cập nhật lần cuối:** 2026-09-05  

---

## 1. NGUYÊN TẮC BẢO MẬT & KẾT NỐI NỘI BỘ

* **Mã bí mật dịch vụ (Internal Secret Token):** Mọi request gửi tới FastAPI Document Service bắt buộc phải có header:
  `X-Internal-Secret: <DOCDRAFT_SHARED_SECRET_KEY>`
  Nếu thiếu hoặc sai secret, dịch vụ trả về `403 Forbidden` ngay tại middleware.
* **Cơ chế Truyền tải tệp nhị phân trực tiếp (Zero-disk Binary Streaming):**
  * Dịch vụ sử dụng `fastapi.responses.StreamingResponse` kết hợp `io.BytesIO` trong bộ nhớ RAM.
  * Không tạo file rác trên ổ cứng container, triệt tiêu nguy cơ rò rỉ dữ liệu hoặc đầy ổ đĩa tạm.

---

## 2. PYDANTIC SCHEMAS ĐẶC TẢ DỮ LIỆU

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ExportConfig(BaseModel):
    margin_top_mm: int = Field(default=20, ge=10, le=40)
    margin_bottom_mm: int = Field(default=20, ge=10, le=40)
    margin_left_mm: int = Field(default=30, ge=15, le=40)  # Chuẩn NĐ 30: 30mm đóng gáy
    margin_right_mm: int = Field(default=15, ge=10, le=30)
    font_family: str = Field(default="Times New Roman")
    font_size_pt: int = Field(default=13, ge=10, le=16)
    include_signature: bool = Field(default=False)
    signature_image_url: Optional[str] = None
    watermark_text: Optional[str] = None
    qr_verify_url: Optional[str] = None

class ExportDocxRequest(BaseModel):
    draft_id: str
    title: str
    content_json: Dict[str, Any]  # Tiptap ProseMirror AST
    config: ExportConfig = Field(default_factory=ExportConfig)

class ExportPdfRequest(BaseModel):
    draft_id: str
    title: str
    html_content: str  # HTML trang in đã render đầy đủ CSS
    config: ExportConfig = Field(default_factory=ExportConfig)

class ParseDocxResponse(BaseModel):
    success: bool
    title: str
    content_json: Dict[str, Any]
    word_count: int
    table_count: int

class OcrScanResponse(BaseModel):
    success: bool
    raw_text: str
    confidence: float
    language: str
    detected_entities: Dict[str, Any]  # { "so_ky_hieu": "...", "ngay_ban_hanh": "..." }
```

---

## 3. DANH MỤC CÁC ENDPOINT CHI TIẾT

### 3.1. `POST /export/docx` — Xuất Microsoft Word chuẩn NĐ 30

* **Mô tả:** Nhận Tiptap JSON AST, duyệt cây cú pháp và sử dụng `python-docx` để dựng tệp OpenXML chuẩn in ấn.
* **Headers:**
  * `X-Internal-Secret: string` (Bắt buộc)
  * `Content-Type: application/json`
* **Request Body:** `ExportDocxRequest`
* **Response 200 OK:**
  * `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  * `Content-Disposition: attachment; filename="Văn_bản.docx"`
  * Body: Dòng dữ liệu nhị phân (Binary Stream).

---

### 3.2. `POST /export/pdf` — Xuất Vector PDF bằng Puppeteer

* **Mô tả:** Nhận chuỗi HTML dàn trang hoàn chỉnh, khởi chạy instance Chromium headless để "in" ra tệp PDF vector sắc nét từng chữ, hỗ trợ nhúng mã QR xác thực góc chân trang.
* **Headers:**
  * `X-Internal-Secret: string` (Bắt buộc)
  * `Content-Type: application/json`
* **Request Body:** `ExportPdfRequest`
* **Response 200 OK:**
  * `Content-Type: application/pdf`
  * `Content-Disposition: attachment; filename="Văn_bản.pdf"`
  * Body: Dòng dữ liệu nhị phân (Binary Stream).

---

### 3.3. `POST /parse/docx` — Bóc tách tệp Word đưa vào Editor

* **Mô tả:** Nhận tệp `.docx` tải lên từ người dùng, phân tích các đối tượng Paragraphs, Runs, Styles và Tables để dịch ngược thành Tiptap JSON AST.
* **Headers:**
  * `X-Internal-Secret: string`
  * `Content-Type: multipart/form-data`
* **Form Data:**
  * `file`: UploadFile (.docx binary, tối đa 10MB)
* **Response 200 OK:**
  ```json
  {
    "success": true,
    "title": "Báo cáo tiến độ dự án Q3",
    "content_json": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "attrs": { "textAlign": "center" },
          "content": [{ "type": "text", "text": "BÁO CÁO TIẾN ĐỘ" }]
        }
      ]
    },
    "word_count": 820,
    "table_count": 2
  }
  ```

---

### 3.4. `POST /ocr/scan` — Nhận dạng ký tự quang học tiếng Việt

* **Mô tả:** Nhận file ảnh chụp văn bản giấy hoặc tệp PDF dạng scan, gửi sang Google Cloud Vision API để trích xuất chữ tiếng Việt có dấu kèm tọa độ khối.
* **Headers:**
  * `X-Internal-Secret: string`
  * `Content-Type: multipart/form-data`
* **Form Data:**
  * `file`: UploadFile (JPEG, PNG, PDF scan, tối đa 25MB)
* **Response 200 OK:**
  ```json
  {
    "success": true,
    "raw_text": "ỦY BAN NHÂN DÂN QUẬN 1\nSố: 45/TB-UBND\nTHÔNG BÁO\nVề việc...",
    "confidence": 0.965,
    "language": "vi",
    "detected_entities": {
      "co_quan_ban_hanh": "ỦY BAN NHÂN DÂN QUẬN 1",
      "so_ky_hieu": "45/TB-UBND",
      "loai_van_ban": "Thông báo"
    }
  }
  ```

---

### 3.5. `GET /health` — Kiểm tra sức khỏe dịch vụ (Health Check)

* **Mô tả:** Sử dụng cho Docker Container hoặc Kubernetes Liveness / Readiness Probes.
* **Response 200 OK:**
  ```json
  {
    "status": "healthy",
    "version": "1.0.0",
    "chrome_available": true,
    "uptime_seconds": 86400
  }
  ```
