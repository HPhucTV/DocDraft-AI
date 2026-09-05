# 📄 DocDraft AI — Document Processing Microservice

> **Framework:** FastAPI (Python 3.11+)  
> **Cổng nội bộ:** `http://document-service:8000`  
> **Kiến trúc:** [ADR-001](../../docs/adr/ADR-001-hybrid-nextjs-fastapi.md) | **API Spec:** [API-003](../../docs/api/document-service-api.md)

---

## 🌟 Chức năng chính

1. **Xuất bản Microsoft Word (.docx) chuẩn Nghị định 30/2020/NĐ-CP:**
   - Dàn trang lề in chuẩn (Trái 30mm, Phải 15mm, Trên 20mm, Dưới 20mm).
   - Tự động dựng bảng ẩn 2 cột cho Quốc hiệu, Cơ quan ban hành, và Nơi nhận/Chữ ký.
   - Stream nhị phân trực tiếp từ RAM (`io.BytesIO`), không ghi file rác xuống ổ đĩa (Zero-disk streaming).
2. **Xuất bản Vector PDF sắc nét (Chromium Headless):**
   - Render vector chuẩn in ấn, hỗ trợ nhúng watermark và QR code kiểm tra tính xác thực.
3. **Phân tích bóc tách tệp Word (.docx → Tiptap AST):**
   - Đọc ngược các tài liệu mẫu có sẵn để nạp vào trình soạn thảo Rich Text.
4. **Bảo mật mạng nội bộ:**
   - Middleware chặn toàn bộ request thiếu hoặc sai header `X-Internal-Secret` với mã lỗi `403 Forbidden`.
   - Endpoint `/health` mở công khai phục vụ Docker & Kubernetes healthcheck probes.

---

## 🚀 Khởi chạy cục bộ (Local Development)

```bash
cd services/document-service

# Cài đặt thư viện
pip install -r requirements.txt

# Khởi chạy server Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 🧪 Kiểm thử tự động (Pytest)

```bash
pytest tests -v
```

## 🐳 Khởi chạy với Docker

```bash
# Build & chạy riêng container
docker build -t docdraft-document-service .
docker run -p 8000:8000 docdraft-document-service

# Hoặc khởi chạy qua Docker Compose từ thư mục gốc
docker compose up -d
```
