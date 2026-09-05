# DOCDRAFT AI — TÀI LIỆU KỸ THUẬT DỰ ÁN (TECHNICAL DOCUMENTATION)

> **Dự án:** DOCDRAFT AI — Nền tảng sinh nháp, biên tập và chuẩn hóa văn bản hành chính/doanh nghiệp chuẩn Nghị định 30/2020/NĐ-CP  
> **Phiên bản tài liệu:** 3.1  
> **Cập nhật lần cuối:** 2026-09-05  
> **Bảng quản lý công việc (Task-Board):** [TASKBOARD.md](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/TASKBOARD.md)  
> **Trạng thái:** Triển khai theo phân cấp ưu tiên P0 → P3  

---

## 📌 BẢN ĐỒ TÀI LIỆU HỆ THỐNG (DOCUMENTATION SITEMAP)

Hệ thống tài liệu của dự án DOCDRAFT AI được tổ chức module hóa, phân tách rành mạch theo các khía cạnh kiến trúc, giao tiếp API, cơ sở dữ liệu, kỹ thuật AI và các quyết định kỹ thuật cốt lõi (ADRs). Kế hoạch thực thi các task kỹ thuật được quản lý tập trung tại [TASKBOARD.md](file:///c:/Users/PC/Documents/Duy/DOCDRAFT%20AI/TASKBOARD.md).

```
docs/
├── README.md                                  # [P0] Trang chủ & Mục lục điều hướng hệ thống
├── idea.md                                    # PRD v3.1 (Tài liệu yêu cầu sản phẩm & Roadmap dài hạn)
│
├── architecture/                              # MODULE 1: KIẾN TRÚC HỆ THỐNG & DỮ LIỆU
│   ├── system-overview.md                     # [P0] Tổng quan kiến trúc phân tán Next.js + FastAPI, Data flow & Deployment
│   ├── document-ast-pipeline.md               # [P0] Chi tiết biến đổi AST: Tiptap JSON ↔ OpenXML Word (.docx) ↔ PDF
│   ├── diff-and-audit-engine.md               # [P1] Thiết kế Side-by-side Diff Engine & Nhật ký kiểm toán AI Attribution
│   └── legal-rag-architecture.md              # [P2] Kiến trúc RAG tra cứu văn bản quy phạm pháp luật với pgvector
│
├── api/                                       # MODULE 2: ĐẶC TẢ GIAO DIỆN & HỢP ĐỒNG API
│   ├── core-api-specs.md                      # [P0] REST API Next.js: Auth, Drafts CRUD, Folders, Sharing, Comments
│   ├── ai-streaming-protocol.md               # [P1] Giao thức SSE Streaming: Heartbeat, Disconnect Cleanup, Exponential Retry
│   ├── document-service-api.md                # [P1] FastAPI Microservice: Binary Streaming, Internal Secret Auth, OCR Scan
│   └── approval-workflow-api.md               # [P2] API Luồng trình ký, Phê duyệt & Sinh mã QR xác thực bản gốc
│
├── database/                                  # MODULE 3: THIẾT KẾ CƠ SỞ DỮ LIỆU & STATE MACHINES
│   ├── schema-and-erd.md                      # [P0] DDL 14 bảng quan hệ, Mermaid ERD, GIN & B-Tree Indexes
│   ├── state-machines.md                      # [P1] Mô hình chuyển trạng thái văn bản & quy trình phê duyệt (State Diagrams)
│   └── jsonb-specifications.md                # [P2] Đặc tả JSON Schema cho Tiptap AST, Dynamic Form & Few-shot examples
│
├── ai-prompts/                                # MODULE 4: KỸ THUẬT PROMPT & QUY CHUẨN NĐ 30
│   ├── master-system-prompt.md                # [P0] Master System Prompt: Bảng ẩn 2 cột, Tiêu ngữ, Anti-hallucination [...]
│   ├── compliance-rules-engine.md             # [P1] Bộ luật kiểm tra thể thức NĐ 30/2020 & Thuật toán Auto-fix suggestions
│   └── industry-packs-prompts.md              # [P2] Prompt templates & Form schemas cho 6 Industry Packs (HR, Xây dựng...)
│
└── adr/                                       # MODULE 5: HỒ SƠ QUYẾT ĐỊNH KIẾN TRÚC (ADRs)
    ├── ADR-001-hybrid-nextjs-fastapi.md       # [P0] Quyết định tách biệt Next.js API và FastAPI Document Service
    ├── ADR-002-tiptap-prosemirror-ast.md      # [P0] Quyết định chọn Tiptap ProseMirror làm mô hình Document AST
    ├── ADR-003-supabase-pgvector-for-rag.md   # [P2] Quyết định dùng PostgreSQL pgvector cho Legal Semantic Search
    ├── ADR-004-office-js-taskpane.md          # [P2] Quyết định xây dựng Office.js Task Pane cho Microsoft Word Add-in
    ├── ADR-005-diff-view-and-attribution.md   # [P2] Quyết định tích hợp Side-by-side Diff và Audit Trail minh bạch AI
    ├── ADR-006-auth-and-rbac.md               # [P1] Quyết định chọn NextAuth.js v5 thay vì Clerk / Supabase Auth
    ├── ADR-007-file-storage-r2.md             # [P1] Quyết định chọn Cloudflare R2 thay vì AWS S3 (Zero Egress Fees)
    ├── ADR-008-full-text-search-tsvector.md   # [P2] Quyết định dùng tsvector + GIN thay vì Elasticsearch
    └── ADR-009-caching-strategy-redis.md      # [P2] Quyết định kiến trúc bộ đệm đa tầng (Multi-tier Caching) với Redis
```

---

## 🎯 MA TRẬN PHÂN CẤP ƯU TIÊN (PRIORITY MATRIX)

Nhằm đảm bảo tiến độ triển khai thực tế của dự án dài hạn, toàn bộ tài liệu kỹ thuật được phân tầng theo 4 mức độ:

| Mức độ | Định nghĩa & Tiêu chuẩn phát triển | Tình trạng |
|---|---|---|
| **P0 (Critical)** | **Tài liệu nền móng bắt buộc phải hoàn thành trước khi viết code MVP.** Bao gồm thiết kế tổng quan, đặc tả API cốt lõi, lược đồ CSDL, pipeline AST và Master Prompt. | 🟢 Sẵn sàng / Đang triển khai |
| **P1 (High)** | **Tài liệu hoàn thiện tính năng cốt lõi (Phase 1–2).** Đảm bảo tính ổn định của streaming SSE, FastAPI service, Diff-View, Audit Trail và Compliance Engine. | 🟡 Kế hoạch Sprint Docs 2 |
| **P2 (Medium)** | **Tài liệu mở rộng tính năng nâng cao (Phase 3–4).** Phục vụ luồng Trình ký phê duyệt, RAG căn cứ pháp lý, Word Add-in và Industry Packs. | ⚪ Kế hoạch Sprint Docs 3 |
| **P3 (Reference)** | **Tài liệu hướng dẫn vận hành & mở rộng tương lai.** Sổ tay hướng dẫn CI/CD, tích hợp dịch vụ cấp phép chữ ký số CA (VNPT, Viettel). | ⚪ Kế hoạch mở rộng |

---

## 🏗️ TỔNG QUAN CÔNG NGHỆ CHỦ ĐẠO (TECH STACK HIGHLIGHTS)

* **Frontend:** Next.js 14+ (App Router, Server Actions, Client Components), Tailwind CSS, Shadcn UI, Zustand, TanStack Query.
* **Rich Document Editor:** Tiptap Core (ProseMirror Engine) với custom node extensions cho bảng ẩn 2 cột, highlight placeholder an toàn `[...]`.
* **Backend API:** Next.js Route Handlers (Auth, Drafts, State Management, SSE Streaming).
* **Document Processing Service:** FastAPI (Python 3.11), `python-docx` (OpenXML manipulation), Puppeteer/Playwright (Pixel-perfect PDF vector render).
* **Generative AI:** DeepSeek API (Primary: DeepSeek-V3 / Chat) + Google Gemini 3.7 Flash (Reliable Fallback) + Hỗ trợ cơ chế BYOK (Bring Your Own Key mã hóa AES-256).
* **Database & Vector Store:** PostgreSQL 16 (Supabase) + `pgvector` extension + GIN Full-text Search (`tsvector`).
* **File Storage:** Cloudflare R2 (S3-compatible, không phí băng thông tải ra).
* **Client Add-in:** Office.js Task Pane (tích hợp trực tiếp trong Microsoft Word desktop/web).

---

## 🧭 HƯỚNG DẪN DÀNH CHO DEVELOPER & AGENT

1. **Bắt đầu phát triển tính năng mới:** Luôn đối chiếu yêu cầu tại [PRD (idea.md)](./idea.md), sau đó đọc đặc tả API tại [api/core-api-specs.md](./api/core-api-specs.md) và schema tại [database/schema-and-erd.md](./database/schema-and-erd.md).
2. **Khi can thiệp vào định dạng văn bản:** Đọc kỹ [architecture/document-ast-pipeline.md](./architecture/document-ast-pipeline.md) để đảm bảo không vi phạm quy tắc ánh xạ thẻ OpenXML và bảng ẩn 2 cột chuẩn NĐ 30/2020.
3. **Khi tinh chỉnh Prompt AI:** Đọc kỹ [ai-prompts/master-system-prompt.md](./ai-prompts/master-system-prompt.md) để duy trì các rào cấm ảo giác (Anti-hallucination Guardrails).
4. **Khi đưa ra các quyết định kỹ thuật mới:** Tham khảo và tạo thêm tài liệu theo chuẩn ADR tại thư mục `docs/adr/`.
