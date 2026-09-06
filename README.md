<div align="center">

# 📑 DOCDRAFT AI
### Nền tảng Soạn thảo & Chuẩn hóa Văn bản Hành chính - Doanh nghiệp Thông minh
**Chuẩn thể thức Nghị định 30/2020/NĐ-CP • Trợ lý AI Đa mô hình • Tích hợp Microsoft Word Add-in**

[![Website](https://img.shields.io/badge/Live_Demo-doc--draft--ai.vercel.app-7c3aed?style=for-the-badge&logo=vercel)](https://doc-draft-ai.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![DeepSeek](https://img.shields.io/badge/AI_Engine-DeepSeek--V3_%2F_Gemini_3.7-0ea5e9?style=for-the-badge&logo=openai)](https://deepseek.com)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

[🌐 Trải nghiệm Trực tiếp (Live Demo)](https://doc-draft-ai.vercel.app) • [📖 Tài liệu Kỹ thuật Chi tiết (docs/)](./docs/README.md) • [📋 Bảng Quản lý Nhiệm vụ (Taskboard)](./TASKBOARD.md) • [🤖 Chỉ dẫn AI Agent (agent.md)](./agent.md)

</div>

---

## 💡 Giới thiệu Tổng quan (Executive Summary)

**DOCDRAFT AI** là giải pháp phần mềm thông minh thế hệ mới, giải quyết triệt để nỗi đau: **mất nhiều giờ đồng hồ căn chỉnh lề, sai thể thức pháp lý, lỗi bảng biểu Word và rủi ro ảo giác số liệu** khi soạn thảo văn bản hành chính, công văn, hợp đồng và tờ trình tại Việt Nam.

Với sự kết hợp giữa **mô hình tài liệu AST dạng Tiptap (ProseMirror)**, sức mạnh sinh văn bản của **DeepSeek-V3 / Google Gemini 3.7 Flash** và tiện ích **Microsoft Word Add-in (Office.js)**, DocDraft AI biến toàn bộ quy trình soạn thảo phức tạp thành thao tác **"Form-to-Draft chỉ trong 30 giây"**.

```
[ Nhập biểu mẫu / Nháp thô / Tệp mẫu ] 
                 ⬇️
       [ DocDraft AI Engine ]
   • Bảng ẩn 2 cột Quốc hiệu / Tiêu ngữ / Chữ ký
   • Lề A4 chuẩn 30/15/20/20mm • Times New Roman
   • Chống ảo giác số liệu với Safe Placeholder [...]
                 ⬇️
[ Văn bản A4 Hoàn chỉnh / Xuất Word .docx / PDF / Word Add-in ]
```

---

## 🌟 Tính năng Cốt lõi (Key Features)

### 🏛️ 1. 100% Chuẩn thể thức Nghị định số 30/2020/NĐ-CP
- **Bố cục Bảng ẩn 2 cột (No-border Table):** Tự động dàn trang Quốc hiệu - Tiêu ngữ, Cơ quan ban hành, Số hiệu và Khối chữ ký / Nơi nhận theo đúng tỷ lệ vàng (45% - 55% và 50% - 50%), triệt tiêu hoàn toàn lỗi vỡ layout hay xô lệch khi mở trên các phiên bản Microsoft Word khác nhau.
- **Quy chuẩn trang A4 sắc nét:** Tự động thiết lập lề in chuẩn Việt Nam (Lề trái: 30mm, Lề phải: 15mm, Lề trên & dưới: 20mm), kiểu chữ Times New Roman 13-14pt, giãn dòng 1.2 - 1.25.

### 🤖 2. Trợ lý AI Đa mô hình & Chuốt nháp Thô (Draft-to-Form)
- **Kiến trúc LLM kép:** Sử dụng **DeepSeek-V3 (`deepseek-chat`)** làm mô hình chính với chi phí tối ưu, tự động chuyển mạch (Auto-fallback) sang **Google Gemini 3.7 Flash** khi gặp sự cố mạng hoặc quá tải.
- **Biến nháp thô thành văn bản quy chuẩn:** Dán bất kỳ đoạn ghi chú, email hay ý tưởng phác thảo vào hệ thống, AI sẽ tự động trích xuất các sự kiện cốt lõi và dàn dựng thành công văn, tờ trình hoặc biên bản hoàn chỉnh.
- **Cơ chế Safe Placeholder `[...]` (Chống ảo giác số liệu):** Tuyệt đối không tự ý bịa đặt số tiền, mã số thuế, số căn cước hay ngày ký. Mọi thông tin còn thiếu đều được đánh dấu nổi bật dạng `[TÊN DOANH NGHIỆP]`, `[SỐ TIỀN BẰNG CHỮ]` để người dùng điền bổ sung.

### 📂 3. Tải lên Tệp mẫu & Lưu Mẫu tùy chỉnh (Custom Templates)
- **Tải lên tệp mẫu sẵn có:** Cho phép người dùng tải lên các file mẫu của cơ quan, doanh nghiệp (`.docx`, `.txt`, `.md`) trực tiếp từ Dashboard.
- **Tự động bóc tách biến số:** Hệ thống tự động quét các vị trí `[BIẾN_SỐ]` trong tài liệu và sinh ra **Form Schema tương tác** tự động (hỗ trợ trường ngày tháng, số tiền, text, ghi chú), không cần lập trình JSON thủ công.
- **Lưu mẫu 1-Click từ Copilot AI:** Khi trò chuyện với AI ra được một mẫu văn bản ưng ý, người dùng có thể bấm nút **"⭐ Lưu mẫu"** để đưa ngay vào danh mục cá nhân tái sử dụng nhiều lần.

### 📑 4. Microsoft Word Add-in Độc lập (Office.js Taskpane)
- **Tích hợp sâu trong Microsoft Word:** Hoạt động mượt mà trên cả Microsoft Word Desktop (Windows/macOS) và Word trên trình duyệt web.
- **Auto-insert thông minh:** Tự động ghi trực tiếp nội dung văn bản chuẩn vào trang Word đang mở tại vị trí con trỏ chuột mà không cần sao chép thủ công.
- **Khóa ngắt hàng bảng biểu (`cantSplit`):** Bảo đảm khối tiêu ngữ và bảng chữ ký không bao giờ bị cắt đôi hay tràn lố sang trang thứ hai.

### 🛡️ 5. Kiểm toán & Minh bạch AI (Audit Trail & Version Diff)
- **Nhật ký kiểm toán AI (Audit Trail):** Minh bạch 100% từng thao tác trong văn bản: nội dung nào do AI sinh, điều khoản nào do con người chỉnh sửa thủ công.
- **So sánh Side-by-side Diff:** So sánh trực quan văn bản gốc và văn bản AI đề xuất thay đổi với các đoạn thêm (xanh lá) và đoạn bớt (đỏ).
- **Lịch sử phiên bản & Rollback 1-Click:** Tự động lưu bản nháp theo thời gian, cho phép xem lại và khôi phục về bất kỳ phiên bản nào trong quá khứ.

### 🔐 6. Bảo mật Doanh nghiệp & Tự cấp Key (BYOK)
- **Bring Your Own Key (BYOK):** Cho phép cá nhân và doanh nghiệp sử dụng API Key riêng của DeepSeek hoặc Gemini.
- **Mã hóa AES-256-GCM:** Toàn bộ khóa API người dùng đều được mã hóa bằng thuật toán chuẩn quân sự AES-256 trước khi lưu trữ, giải mã tạm thời trong RAM và không bao giờ lộ ra log hay client.

### 🖨️ 7. Xuất bản Đa kênh chuẩn Vector
- **Xuất Microsoft Word (.docx):** Tạo tệp OpenXML chuẩn xác, mở được trên mọi phiên bản Office.
- **In ấn & Xuất PDF Vector:** Hỗ trợ xuất PDF chất lượng cao, định dạng A4 chuẩn chỉ từng milimet, sắc nét khi in ấn.

---

## 🏗️ Kiến trúc Hệ thống (System Architecture)

```mermaid
flowchart TB
    subgraph Clients ["Ứng dụng Người dùng (Client Surfaces)"]
        WebApp["🌐 Web App (Next.js 16 App Router)"]
        WordAddin["📑 Microsoft Word Add-in (Office.js)"]
    end

    subgraph CoreEngine ["Next.js Backend & API Core"]
        AuthModule["Auth & RBAC (NextAuth.js v5)"]
        DraftManager["Drafts & Version Engine"]
        TemplateParser["Template Parser & Placeholder Extractor"]
        CryptoBYOK["AES-256-GCM Key Vault"]
        SSEStreamer["SSE Streaming Controller"]
    end

    subgraph AIService ["Lớp Trí tuệ Nhân tạo (Dual LLM)"]
        DeepSeek["⚡ Primary LLM: DeepSeek-V3"]
        GeminiFlash["🛡️ Fallback LLM: Gemini 3.7 Flash"]
        PromptEngine["System Prompts chuẩn NĐ 30 & Anti-Hallucination"]
    end

    subgraph DocService ["Document Processing Service"]
        DocxConverter["OpenXML & Word Generator (python-docx / Mammoth)"]
        PdfRenderer["Vector PDF Engine"]
    end

    subgraph StorageEngine ["Lưu trữ & Dữ liệu"]
        PostgresDB[(PostgreSQL 16 / Prisma ORM)]
        RedisCache[(Upstash Redis - Rate Limit & Cache)]
        R2Storage[(Cloudflare R2 Storage - Zero Egress)]
    end

    WebApp --> CoreEngine
    WordAddin --> CoreEngine

    CoreEngine --> AIService
    CoreEngine --> DocService
    CoreEngine --> StorageEngine
    
    AIService --> PromptEngine
```

---

## 🛠️ Công nghệ Sử dụng (Tech Stack)

| Phân tầng | Công nghệ | Công dụng chính |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), React 19, TypeScript | Giao diện hiện đại, tối ưu SEO và Server Components |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), Radix UI, Lucide Icons | Thiết kế A4 canvas thanh lịch, responsive đa thiết bị |
| **Document AST** | [Tiptap Core](https://tiptap.dev/) (ProseMirror) | Trình soạn thảo Rich Text dạng Abstract Syntax Tree |
| **AI LLM** | DeepSeek-V3, Google Gemini 3.7 Flash, OpenAI SDK | Sinh văn bản ngữ cảnh cao, phân tích nháp thô và hỏi đáp |
| **Database** | [PostgreSQL 16](https://www.postgresql.org/) qua [Prisma ORM](https://www.prisma.io/) | Quản lý 14 bảng quan hệ, JSONB schemas, Audit logs |
| **Security** | AES-256-GCM, NextAuth.js v5 | Quản lý phiên đăng nhập và mã hóa an toàn khóa BYOK |
| **Office Integration**| [Office.js](https://learn.microsoft.com/en-us/office/dev/add-ins/) | Tiện ích bổ trợ chạy trực tiếp trong Microsoft Word |
| **Document Tools** | Mammoth, python-docx, Puppeteer | Chuyển đổi và tạo tệp Word (.docx), PDF vector |
| **Cache & Storage** | Upstash Redis, Cloudflare R2 | Bộ nhớ đệm phân tán và kho lưu trữ tệp đính kèm |

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

### 1. Yêu cầu Tiên quyết (Prerequisites)
- **Node.js:** Phiên bản `>= 20.x`
- **npm** hoặc **pnpm / yarn**
- **Cơ sở dữ liệu PostgreSQL:** (Cục bộ hoặc qua Supabase / Neon)
- **API Key:** Khóa API DeepSeek (`DEEPSEEK_API_KEY`) hoặc Gemini (`GEMINI_API_KEY`)

### 2. Cài đặt các gói phụ thuộc
```bash
# Clone kho mã nguồn
git clone https://github.com/HPhucTV/DocDraft-AI.git
cd DocDraft-AI

# Cài đặt thư viện
npm install
```

### 3. Cấu hình Biến môi trường (.env)
Tạo tệp `.env` tại thư mục gốc (tham khảo `.env.example`):

```env
# Cơ sở dữ liệu PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/docdraft_ai?schema=public"

# Khóa bảo mật NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-nextauth-key-32-chars-minimum"
AUTH_SECRET="your-super-secret-nextauth-key-32-chars-minimum"

# AI Provider Keys
DEEPSEEK_API_KEY="sk-your-deepseek-api-key"
GEMINI_API_KEY="AIzaSy-your-gemini-api-key"

# Khóa mã hóa BYOK (32 ký tự hex)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

### 4. Đồng bộ CSDL & Dữ liệu Mẫu (Prisma)
```bash
# Sinh Prisma Client
npx prisma generate

# Đẩy schema lên database
npx prisma db push

# Nạp dữ liệu mẫu 10 biểu mẫu quy chuẩn NĐ 30
npm run prisma:seed
```

### 5. Khởi chạy Ứng dụng
```bash
# Chạy máy chủ phát triển
npm run dev
```

Mở trình duyệt và truy cập: **`http://localhost:3000`**

---

## 📂 Cấu trúc Thư mục Dự án (Directory Structure)

```
DOCDRAFT-AI/
├── src/
│   ├── app/                      # Next.js App Router (Pages & API Routes)
│   │   ├── (auth)/               # Đăng nhập & Đăng ký tài khoản
│   │   ├── api/                  # REST APIs: drafts, templates, ai, export, folders...
│   │   ├── dashboard/            # Không gian làm việc quản lý văn bản & thư mục
│   │   ├── editor/               # Trình soạn thảo A4 tương tác, Ribbon & AI Copilot
│   │   └── word-addin/           # Giao diện Office.js Taskpane cho Microsoft Word
│   ├── components/               # UI Components dùng chung (Editor, Forms, Modals)
│   ├── hooks/                    # Custom React Hooks (Auto-save, Media Queries...)
│   ├── lib/                      # Tiện ích: AI clients, Template parser, Prisma, Crypto
│   └── types/                    # Khai báo TypeScript types & Form schemas
├── prisma/
│   ├── schema.prisma             # Lược đồ cơ sở dữ liệu quan hệ (14 models)
│   └── seed.ts                   # Dữ liệu seed biểu mẫu hành chính quy chuẩn
├── public/                       # Assets tĩnh, favicon, logo, manifest Word Add-in
├── docs/                         # 📚 Hệ thống 24 tài liệu kỹ thuật & kiến trúc chuyên sâu
├── TASKBOARD.md                  # 📋 Bảng quản lý tiến độ 69 tasks phát triển
└── agent.md                      # 🤖 Chỉ dẫn chuẩn ngữ cảnh cho các AI coding assistants
```

---

## 📚 Hệ thống Tài liệu Kỹ thuật Chuyên sâu (Technical Documentation)

Dự án DOCDRAFT AI duy trì hệ thống tài liệu kỹ thuật phân tầng toàn diện đặt tại thư mục [`docs/`](./docs/README.md). Bạn có thể tham khảo chi tiết theo từng chuyên đề:

* 📄 **[docs/README.md](./docs/README.md):** Bản đồ tài liệu kỹ thuật tổng thể (Architecture, API Specs, Database ERD, Prompts).
* 🏛️ **[docs/ai-prompts/master-system-prompt.md](./docs/ai-prompts/master-system-prompt.md):** Kỹ thuật Master Prompt chuẩn hóa Nghị định 30 & chống ảo giác số liệu.
* 🧩 **[docs/architecture/document-ast-pipeline.md](./docs/architecture/document-ast-pipeline.md):** Chi tiết chuyển đổi hai chiều Tiptap JSON AST ↔ OpenXML Word (.docx).
* 📑 **[docs/architecture/word-addin-architecture.md](./docs/architecture/word-addin-architecture.md):** Kiến trúc tích hợp Office.js Task Pane cho Microsoft Office.
* 📋 **[TASKBOARD.md](./TASKBOARD.md):** Lộ trình 69 nhiệm vụ phát triển qua 5 giai đoạn (Phase 1 đến Phase 5).
* ⚖️ **[docs/adr/](./docs/adr/):** 10 tài liệu Quyết định Kiến trúc (ADR-001 đến ADR-010) ghi nhận lý do chọn Next.js, Tiptap, PostgreSQL pgvector, Cloudflare R2...

---

## 🗺️ Lộ trình Phát triển (Roadmap)

- [x] **Phase 1: Nền tảng & Lõi Soạn thảo A4 chuẩn NĐ 30** (Hoàn thành)
  - Biểu mẫu quy chuẩn, AI SSE Streaming, Trình soạn thảo A4 Tiptap, Xuất file Word & PDF.
- [x] **Phase 2: Tin cậy, Năng suất & Tiện ích Mở rộng** (Hoàn thành)
  - Side-by-side Diff View, Audit Trail, Lịch sử phiên bản, Word Add-in độc lập, Tải lên tệp mẫu & Lưu mẫu cá nhân.
- [ ] **Phase 3: Doanh nghiệp & Quy trình Phê duyệt** (Đang triển khai)
  - Luồng trình ký nhiều cấp (Approval Chain), Sinh mã QR xác thực tính toàn vẹn của văn bản.
- [ ] **Phase 4: Trợ lý Pháp lý Thông minh (Legal RAG)**
  - Tích hợp PostgreSQL `pgvector` tra cứu các văn bản quy phạm pháp luật và tự động gợi ý căn cứ ban hành.
- [ ] **Phase 5: Đa nền tảng Mở rộng**
  - Tiện ích Google Docs Add-on và Mobile Taskpane.

---

## 🤝 Đóng góp & Phát triển (Contributing)

Mọi đóng góp nhằm nâng cao chất lượng sản phẩm đều được chào đón! 
1. Fork dự án
2. Tạo nhánh tính năng mới (`git checkout -b feature/tinh-nang-moi`)
3. Commit các thay đổi (`git commit -m 'feat: Thêm tính năng mới'`)
4. Đẩy lên nhánh của bạn (`git push origin feature/tinh-nang-moi`)
5. Mở một **Pull Request**

---

## 📜 Giấy phép Bản quyền (License)

Dự án được phân phối dưới giấy phép [MIT License](LICENSE).

<div align="center">
  <sub>Được phát triển với niềm tự hào phục vụ cộng đồng hành chính & doanh nghiệp Việt Nam.</sub>
</div>
