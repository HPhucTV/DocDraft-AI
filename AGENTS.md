# 🤖 DOCDRAFT AI — AI AGENT CONTEXT & INSTRUCTIONS

> Tệp chỉ dẫn ngữ cảnh và quy chuẩn kiến trúc chính thức của dự án **DOCDRAFT AI** được lưu trữ tại [`agent.md`](./agent.md).
> 
> Bất kỳ mô hình AI nào (ChatGPT, Claude, Cursor, Copilot, DeepSeek, Antigravity, Roo Code, v.v.) khi làm việc trong kho mã nguồn này hãy đọc ngay [`agent.md`](./agent.md) và [`TASKBOARD.md`](./TASKBOARD.md) để nắm bắt:
> 1. Sứ mệnh & Tech Stack dự án (Next.js 14, FastAPI, DeepSeek-V3, Gemini 3.7 Flash Fallback, BYOK).
> 2. 4 Nguyên tắc cốt lõi bất biến (Phòng chống ảo giác số liệu `[...]`, Bảng ẩn 2 cột chuẩn NĐ 30, Mã hóa AES-256 BYOK, Đồng bộ Tiptap AST - OpenXML).
> 3. Bản đồ 24 tài liệu kỹ thuật trong `docs/`.
> 4. Quy trình 4 bước thực thi 69 tasks trong `TASKBOARD.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
