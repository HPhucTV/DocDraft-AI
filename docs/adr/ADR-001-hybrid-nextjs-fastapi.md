# ADR-001: TÁCH BIỆT NEXT.JS API VÀ FASTAPI DOCUMENT PROCESSING MICROSERVICE

> **Trạng thái:** Accepted  
> **Ngày quyết định:** 2026-09-05  
> **Người đề xuất:** Kỹ sư kiến trúc hệ thống  
> **Phân cấp ưu tiên:** **P0 (Critical)**  

---

## 1. Bối cảnh & Vấn đề (Context)

Dự án **DOCDRAFT AI** đòi hỏi hai nhóm tác vụ có đặc tính kỹ thuật rất khác biệt:
1. **Tác vụ Web & Tương tác người dùng:** Quản lý giao diện, xác thực phiên đăng nhập (OAuth Google), CRUD bản nháp, thư mục, bình luận, và điều phối luồng streaming Server-Sent Events (SSE) từ mô hình ngôn ngữ lớn (Gemini). Nhóm tác vụ này phù hợp với hệ sinh thái TypeScript/Node.js.
2. **Tác vụ Xử lý tài liệu chuyên sâu:** Chuyển đổi và thao tác trực tiếp với các tệp tin nhị phân và định dạng văn phòng phức tạp:
   * Tạo tệp Microsoft Word `.docx` chuẩn OpenXML với bảng ẩn không viền và lề in chính xác theo Nghị định 30/2020/NĐ-CP.
   * Xuất bản PDF vector pixel-perfect sử dụng Chromium headless (Puppeteer / Playwright).
   * Phân tích bóc tách tài liệu Word/PDF tải lên và nhận dạng quang học ký tự (OCR).

Hệ sinh thái Node.js có một số thư viện như `docx` hay `pdfmake`, tuy nhiên:
* Thư viện Python `python-docx` và `pdfplumber` trưởng thành hơn vượt bậc trong việc can thiệp chi tiết vào từng thẻ XML (`w:tcPr`, `w:pgMar`, `w:tblHeader`) và đọc bảng biểu phức tạp.
* Việc chạy Chromium headless trên môi trường Serverless (Vercel) bị giới hạn nghiêm ngặt về dung lượng gói deploy (50MB) và thời gian thực thi (timeout 15–60s).

---

## 2. Quyết định kiến trúc (Decision)

Chúng tôi quyết định áp dụng **Kiến trúc Hybrid phân tách 2 dịch vụ độc lập**:
* **Next.js 14+ (App Router):** Đóng vai trò là Ứng dụng chính (Monolith Core API), phụ trách toàn bộ Frontend UI, Auth (NextAuth.js v5), Quản trị Database PostgreSQL qua Prisma/Drizzle, và Điều phối AI LLM Streaming.
* **FastAPI (Python 3.11 Microservice):** Đóng vai trò là Document Processing Service độc lập, đóng gói trong Docker container chạy trên Render / Fly.io / AWS ECS, chỉ phụ trách:
  * `/export/docx`: Nhận Tiptap JSON AST → Render ra tệp `.docx`.
  * `/export/pdf`: Nhận HTML trang in → Render ra tệp `.pdf`.
  * `/parse/docx`: Nhận tệp `.docx` → Phân tích thành Tiptap JSON AST.
  * `/ocr/scan`: Nhận ảnh quét → Trích xuất ký tự qua Google Cloud Vision.

Hai dịch vụ giao tiếp nội bộ qua HTTP REST kèm mã bí mật xác thực `X-Internal-Secret`.

---

## 3. Các giải pháp thay thế đã cân nhắc (Alternatives Considered)

### 3.1. Thuần Node.js (Next.js Monolith duy nhất)
* *Ưu điểm:* 1 ngôn ngữ duy nhất (TypeScript), một repo deploy duy nhất trên Vercel.
* *Nhược điểm:*
  * Thư viện `docx` của JS khó can thiệp sâu vào các thuộc tính phức tạp của bảng ẩn OpenXML chuẩn NĐ 30.
  * Thường xuyên gặp lỗi bộ nhớ (out-of-memory) và vượt ngưỡng giới hạn kích thước Serverless khi nhúng Chromium/Puppeteer.
* *Lý do bác bỏ:* Rủi ro cao về độ ổn định khi xuất file và giới hạn nền tảng.

### 3.2. Thuần Python (FastAPI + Jinja2 hoặc Django)
* *Ưu điểm:* Xử lý tài liệu và AI bằng Python rất thuận tiện.
* *Nhược điểm:* Trải nghiệm phát triển Frontend kém hơn rất nhiều so với React/Next.js; không tận dụng được sức mạnh của Tiptap/ProseMirror (vốn chạy trên trình duyệt web).
* *Lý do bác bỏ:* Giao diện soạn thảo Rich Text hiện đại bắt buộc phải dựa trên hệ sinh thái JavaScript/React.

---

## 4. Hệ quả & Đánh đổi (Consequences)

### Tích cực (+):
* **Độc lập về tài nguyên:** Các tác vụ nặng (render PDF, xử lý OCR) chạy trong container riêng, không làm nghẽn Event Loop của ứng dụng Next.js chính.
* **Tối ưu công cụ:** Sử dụng đúng thế mạnh tốt nhất của từng ngôn ngữ (TypeScript cho UI/Web; Python cho xử lý tệp văn phòng).
* **Dễ bảo trì và scale:** Có thể tăng CPU/RAM riêng cho Document Service mà không cần nâng cấp toàn bộ ứng dụng web.

### Tiêu cực / Thách thức (-):
* Cần quản lý 2 ứng dụng trong quá trình CI/CD và triển khai local.
* Phát sinh độ trễ mạng nhỏ (50–150ms) cho các cuộc gọi nội bộ giữa Next.js và FastAPI (được khắc phục bằng cơ chế hash cache trên Cloudflare R2).
