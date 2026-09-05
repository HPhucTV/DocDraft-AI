# 🤖 DOCDRAFT AI — UNIVERSAL AI AGENT INSTRUCTION & CONTEXT GUIDE

> **DÀNH CHO TẤT CẢ CÁC MÔ HÌNH AI (ChatGPT, Claude, Cursor Agent, DeepSeek, Copilot, Antigravity, Roo Code, v.v.):**  
> Đây là tệp chỉ dẫn ngữ cảnh tối cao của dự án **DOCDRAFT AI**. Bất kể bạn là mô hình AI nào khi đọc kho mã nguồn này, bạn **PHẢI** đọc kỹ và tuân thủ tuyệt đối các nguyên tắc kiến trúc, quy tắc thể thức pháp lý, tech stack và quy trình làm việc được định nghĩa dưới đây.

---

## 🌟 1. TỔNG QUAN DỰ ÁN & SỨ MỆNH (EXECUTIVE SUMMARY)

* **Tên dự án:** DOCDRAFT AI (Hệ thống Trợ lý Soạn thảo Văn bản Hành chính & Doanh nghiệp Thông minh).
* **Sứ mệnh cốt lõi:** Giải quyết triệt để nỗi đau mất thời gian, sai thể thức, rủi ro pháp lý và lỗi định dạng Word khi soạn thảo văn bản tại Việt Nam.
* **Tuyên ngôn giá trị (Value Proposition):**
  * **"Form-to-Draft in 30 seconds":** Biến thông tin đầu vào biểu mẫu thành dự thảo văn bản hoàn chỉnh chỉ trong 30 giây.
  * **100% Chuẩn thể thức Nghị định 30/2020/NĐ-CP:** Tự động căn lề chuẩn (trái 30mm, phải 15mm, trên/dưới 20mm), font Times New Roman hoặc font hành chính tương thích, bảng ẩn 2 cột cho Quốc hiệu/Tiêu ngữ/Nơi nhận.
  * **Zero Hallucination (Không bịa đặt số liệu):** Cơ chế Safe Placeholder Guardrail tự động bọc `[...]` vào các thông tin chưa rõ ràng hoặc cần xác thực người thật.
  * **Export Word (.docx) & PDF chuẩn mực:** Xuất file .docx sử dụng OpenXML gốc (không lỗi layout) và PDF in ấn sắc nét không vỡ font.

---

## 🏗️ 2. KIẾN TRÚC KỸ THUẬT & TECH STACK ĐƯỢC PHÊ DUYỆT

Hệ thống được thiết kế theo kiến trúc Microservices kết hợp Modular Monolith hiện đại:

| Phân hệ / Tầng | Công nghệ lựa chọn | Ghi chú & Trách nhiệm kỹ thuật |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14+ (App Router)** | Server Components, Client Components, SSR/SSG tối ưu SEO |
| **Giao diện & UI System** | **Tailwind CSS + Shadcn UI** | Giao diện thanh lịch, tối ưu trải nghiệm (UX), chuẩn Accessibility |
| **Trình soạn thảo văn bản**| **Tiptap Core (ProseMirror)** | Trình soạn thảo Rich Text dạng AST JSON, hỗ trợ bảng ẩn 2 cột |
| **Backend Core API** | **Next.js Route Handlers** | Quản lý Auth, Drafts, Workflows, Audit Trail, SSE Streaming |
| **Document Processing Microservice** | **FastAPI (Python 3.11)** | Xử lý file nặng: `python-docx` (OpenXML render) & Puppeteer (PDF) |
| **Mô hình AI chính (Primary LLM)** | **DeepSeek-V3 (`deepseek-chat`)** | Mô hình chính sinh văn bản qua OpenAI SDK client, tối ưu chi phí |
| **Mô hình AI dự phòng (Fallback LLM)** | **Google Gemini 3.7 Flash (`gemini-3.7-flash`)** | Tự động chuyển mạch khi DeepSeek timeout (>20s), mã lỗi 5xx hoặc rate limit |
| **Cơ chế Tự cấp Key (BYOK)** | **AES-256-GCM Encrypted Storage** | Cho phép người dùng cấu hình DeepSeek/Gemini API Key cá nhân |
| **Cơ sở dữ liệu chính** | **PostgreSQL 16 (Supabase)** | Lưu trữ quan hệ 14 bảng, JSONB schema, tích hợp pgvector |
| **Tìm kiếm ngữ nghĩa & FTS**| **pgvector + tsvector** | Tìm kiếm văn bản pháp luật RAG & Full-text search tiếng Việt |
| **Bộ nhớ đệm & Giới hạn tần suất**| **Redis (Upstash)** | Cache 3 tầng (Form Schema, Exact LLM Hash, Session) & Rate Limit |
| **Lưu trữ tệp tin đám mây** | **Cloudflare R2** | Lưu trữ tệp tin .docx, .pdf, avatar (chuẩn S3, miễn phí tải ra) |
| **Tích hợp ngoài (Add-in)** | **Office.js Task Pane** | Add-in chạy trực tiếp trong Microsoft Word desktop & web |

---

## 🛡️ 3. CÁC NGUYÊN TẮC CỐT LÕI BẤT BIẾN (CORE NON-NEGOTIABLES)

Mọi AI Agent khi lập trình hoặc đề xuất giải pháp cho dự án này **BẮT BUỘC** phải tuân thủ nghiêm ngặt 4 nguyên tắc sau:

### ⛔ Quy tắc 1: Phòng chống Ảo giác Pháp lý & Số liệu (Anti-Hallucination Guardrail)
* **Tuyệt đối KHÔNG tự ý bịa đặt:** Mã số thuế (MST), Số CCCD/CMND, Số tài khoản ngân hàng, Số tiền cụ thể, Địa chỉ trụ sở, Ngày tháng năm ký kết nếu người dùng chưa cung cấp.
* **Quy ước bắt buộc:** Khi thiếu thông tin, AI **phải** đặt giá trị trong dấu ngoặc vuông viết hoa rõ ràng, ví dụ: `[TÊN BÊN B]`, `[SỐ CCCD]`, `[NGÀY... THÁNG... NĂM 2026]`, `[SỐ TIỀN BẰNG CHỮ]`.
* Tuyệt đối không sinh ra các câu văn bản có số liệu giả lập trông giống như thật gây hiểu nhầm cho người dùng.

### 🏛️ Quy tắc 2: Chuẩn mực Thể thức Nghị định 30/2020/NĐ-CP
* **Quốc hiệu - Tiêu ngữ & Cơ quan ban hành:** BẮT BUỘC dàn trang bằng **Bảng ẩn 2 cột (Border = 0, no border)**. Cột trái là Cơ quan ban hành, Số ký hiệu; Cột phải là Quốc hiệu, Tiêu ngữ, Địa danh ngày tháng.
* **Nơi nhận & Thẩm quyền ký:** BẮT BUỘC đặt trong **Bảng ẩn 2 cột** ở cuối văn bản. Cột trái là "Nơi nhận" (font size 11-12, in nghiêng), Cột phải là "Quyền hạn, Chức vụ, Họ tên người ký" (in hoa đậm, căn giữa).
* **Tuyệt đối KHÔNG dùng ký tự space trắng liên tiếp hoặc ký tự tab để căn chỉnh** Quốc hiệu hoặc Chữ ký vì sẽ làm vỡ khung khi mở trên các phiên bản Microsoft Word khác nhau.

### 🔐 Quy tắc 3: Bảo mật BYOK & Tuyệt đối Không Lưu Plain Text Key
* Khóa API cá nhân của người dùng (DeepSeek, Gemini) **phải được mã hóa bằng thuật toán AES-256-GCM** trước khi lưu vào cột `users.custom_api_keys`.
* Khóa giải mã chỉ tồn tại trong RAM trong thời gian thực thi SSE stream và bị dọn dẹp ngay sau khi stream hoàn tất.
* Không bao giờ log API Key vào console, log file hay trả về giao diện người dùng (chỉ hiển thị dạng che giấu: `sk-...abcd`).

### 📄 Quy tắc 4: Đồng bộ Toàn vẹn 2 chiều giữa Tiptap AST và OpenXML (.docx)
* Giao diện soạn thảo Web hiển thị khung mô phỏng trang A4 chuẩn (210mm x 297mm).
* Định dạng lưu trữ trung gian là **Tiptap JSON AST** chuẩn mực.
* Module `document-service` (FastAPI) nhận Tiptap AST và ánh xạ 1-1 sang OpenXML qua `python-docx`. Mọi thuộc tính căn lề, thụt đầu dòng (indent), bảng biểu không viền phải được giữ nguyên vẹn khi tải xuống máy tính người dùng.

---

## 🗺️ 4. BẢN ĐỒ TÀI LIỆU KỸ THUẬT CHI TIẾT (DOCUMENTATION INDEX)

Toàn bộ tài liệu kiến trúc đã được biên soạn đầy đủ tại thư mục [`docs/`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/). Khi cần tìm hiểu sâu về bất kỳ phân hệ nào, hãy đọc tệp tương ứng:

| Phân hệ | Đường dẫn tệp | Nội dung & Mục đích kỹ thuật |
| :--- | :--- | :--- |
| **PRD Gốc** | [`idea.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/idea.md) & [`docs/idea.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/idea.md) | Bản đặc tả yêu cầu sản phẩm hoàn chỉnh (PRD v3.1) |
| **Kiến trúc Tổng quan** | [`docs/architecture/system-overview.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/architecture/system-overview.md) | Sơ đồ khối hệ thống, tương tác Next.js - FastAPI - AI |
| **Kiến trúc Document AST** | [`docs/architecture/document-ast-pipeline.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/architecture/document-ast-pipeline.md) | Luồng chuyển đổi Tiptap JSON AST sang OpenXML .docx |
| **Kiến trúc Pháp lý RAG** | [`docs/architecture/legal-rag-architecture.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/architecture/legal-rag-architecture.md) | Cơ chế Hybrid Search (pgvector + BM25) tra cứu điều luật |
| **Kiến trúc Diff & Audit** | [`docs/architecture/diff-and-audit-engine.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/architecture/diff-and-audit-engine.md) | Thuật toán diff, theo dõi tỷ lệ AI/Người dùng đóng góp |
| **Kiến trúc Word Add-in** | [`docs/architecture/word-addin-architecture.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/architecture/word-addin-architecture.md) | Kiến trúc Office.js Task Pane và SSO Bridge |
| **Đặc tả API Cốt lõi** | [`docs/api/core-api-specs.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/api/core-api-specs.md) | Danh mục REST API: Auth, Templates, Drafts, Workflows |
| **Giao thức SSE Stream** | [`docs/api/ai-streaming-protocol.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/api/ai-streaming-protocol.md) | Chuẩn Server-Sent Events, Heartbeat, Abort & BYOK |
| **Đặc tả Document Service**| [`docs/api/document-service-specs.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/api/document-service-specs.md) | API FastAPI xử lý Render .docx, PDF, OCR scan |
| **Cơ sở dữ liệu & ERD** | [`docs/database/schema-and-erd.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/database/schema-and-erd.md) | Schema 14 bảng PostgreSQL, quan hệ khóa ngoại, types |
| **Chính sách Bảo mật RLS**| [`docs/database/rls-and-permissions.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/database/rls-and-permissions.md) | Row Level Security (RLS) cho phân quyền dữ liệu an toàn |
| **Master System Prompt** | [`docs/ai-prompts/master-system-prompt.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/ai-prompts/master-system-prompt.md) | Prompt hệ thống lõi soạn thảo chuẩn NĐ 30/2020 |
| **Prompt Gói Chuyên ngành**| [`docs/ai-prompts/industry-packs-prompts.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/ai-prompts/industry-packs-prompts.md) | Bộ prompt chuyên sâu: HR, SME, Pháp chế, Y tế, Xây dựng |
| **Prompt Trợ lý Chỉnh sửa**| [`docs/ai-prompts/editor-copilot-prompts.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/ai-prompts/editor-copilot-prompts.md) | Prompt làm gọn câu, trang trọng hóa, kiểm tra thể thức |
| **Bảo mật & Compliance** | [`docs/security/compliance-and-encryption.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/security/compliance-and-encryption.md) | Chuẩn mã hóa AES-256, Audit Trail, tuân thủ NĐ 13/2023 |
| **Chiến lược Kiểm thử** | [`docs/testing/testing-strategy.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/testing/testing-strategy.md) | Unit tests, Integration tests, Playwright E2E tests |
| **Quyết định Kỹ thuật** | [`docs/adr/`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/adr/) | 10 tài liệu Architecture Decision Records (ADR-001 đến 010) |
| **Triển khai & CI/CD** | [`docs/deployment/ci-cd-and-hosting.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/deployment/ci-cd-and-hosting.md) | Quy trình GitHub Actions, Docker hóa, Vercel/Fly.io |

---

## 📋 5. QUY TRÌNH QUẢN LÝ TIẾN ĐỘ & BẢNG NHIỆM VỤ (TASKBOARD)

Toàn bộ kế hoạch phát triển kỹ thuật được theo dõi tập trung tại tệp [`TASKBOARD.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/TASKBOARD.md). Tệp này bao gồm **69 tasks kỹ thuật chi tiết** chia thành 5 giai đoạn:

* **Phase 1 (MVP - Foundation & Core Engine):** TASK-101 đến TASK-117 (Khởi tạo dự án, CSDL, Form Engine, AI Streaming, Tiptap Editor, FastAPI Microservice).
* **Phase 2 (Trust & Productivity):** TASK-201 đến TASK-214 (Diff Viewer, Audit Trail, Legal RAG, OCR Scan, Word Add-in).
* **Phase 3 (Enterprise & Collaboration):** TASK-301 đến TASK-313 (Phê duyệt đa cấp, Phân quyền RBAC, Multi-tenancy, Xuất hàng loạt).
* **Phase 4 (Scale, Quality & Performance):** TASK-401 đến TASK-413 (Tối ưu Cache Redis, CI/CD, Kiểm thử tự động E2E, Giám sát Sentry).
* **Phase 5 & Backlog (Ecosystem Expansion):** TASK-501 đến TASK-512 (Thị trường Template, Chữ ký số E-Signature eKYC).

### ⚙️ Quy trình 4 bước bắt buộc khi AI Agent thực thi bất kỳ Task nào:
1. **Bước 1 - Tra cứu Task:** Đọc Task ID và Mô tả trong [`TASKBOARD.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/TASKBOARD.md), mở tài liệu tham chiếu được liên kết trong thư mục `docs/`.
2. **Bước 2 - Tuân thủ Tech Stack:** Viết mã nguồn đúng cấu trúc thư mục quy định, kiểu dữ liệu chặt chẽ (TypeScript strict, Pydantic validation), không sử dụng code chắp vá hoặc placeholder tạm bợ.
3. **Bước 3 - Tự kiểm thử (Verification):** Chạy kiểm tra lint, biên dịch hoặc test đảm bảo không phát sinh lỗi phá vỡ hệ thống.
4. **Bước 4 - Cập nhật Trạng thái:** Chuyển đổi trạng thái checkbox trong `TASKBOARD.md` từ `- [ ]` thành `- [x]`, ghi nhận kết quả bàn giao rõ ràng cho người dùng.

---

## 💻 6. TIÊU CHUẨN MÃ NGUỒN DÀNH CHO AI (CODE CONVENTIONS)

* **TypeScript / Next.js:**
  * Bật chế độ `strict: true` trong `tsconfig.json`.
  * Tuyệt đối không dùng `any` bừa bãi. Sử dụng interface hoặc type tường minh cho payload, models và state.
  * Phân định rõ Client Components (`'use client'`) và Server Components.
  * Mọi dữ liệu đầu vào từ người dùng (API requests, Form data) BẮT BUỘC phải được validate bằng thư viện `zod`.
* **Python / FastAPI (`document-service`):**
  * Sử dụng Python 3.11+.
  * Dùng `Pydantic v2` cho Schema Request/Response.
  * Xử lý ngoại lệ có cấu trúc với HTTP status code phù hợp (400, 401, 403, 404, 422, 500).
* **CSS & Giao diện:**
  * Sử dụng utility classes của Tailwind CSS kết hợp với components từ Shadcn UI.
  * Thiết kế responsive, hỗ trợ chế độ tương phản cao, tối ưu hiển thị trên màn hình Desktop chuyên dụng cho nhân viên văn phòng.
* **Xử lý phản hồi lỗi (Error Format):**
  * Định dạng JSON lỗi đồng nhất cho toàn bộ các API:
    ```json
    {
      "success": false,
      "error": {
        "code": "VALIDATION_FAILED",
        "message": "Dữ liệu đầu vào không hợp lệ.",
        "details": []
      }
    }
    ```

---

## 🚀 7. BẮT ĐẦU LÀM VIỆC (QUICK START FOR ANY AI)

Khi bạn (AI Agent) tiếp nhận yêu cầu từ người dùng:
1. Xác định người dùng muốn triển khai task nào trong [`TASKBOARD.md`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/TASKBOARD.md) (ví dụ: `TASK-101`).
2. Mở tệp tài liệu kỹ thuật liên quan trong [`docs/`](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/docs/) để nắm chắc cấu trúc schema, endpoint và hành vi mong đợi.
3. Triển khai mã nguồn chính xác, tôn trọng các nguyên tắc cốt lõi về thể thức và bảo mật.
4. Cập nhật `TASKBOARD.md` khi hoàn tất.

*Chúc bạn cộng tác hiệu quả và xây dựng nên một hệ sinh thái soạn thảo văn bản hàng đầu Việt Nam!*
