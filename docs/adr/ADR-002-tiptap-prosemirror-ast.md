# ADR-002: LỰA CHỌN TIPTAP (PROSEMIRROR) LÀM NỀN TẢNG DOCUMENT AST VÀ TRÌNH SOẠN THẢO

> **Trạng thái:** Accepted  
> **Ngày quyết định:** 2026-09-05  
> **Người đề xuất:** Kỹ sư kiến trúc hệ thống  
> **Phân cấp ưu tiên:** **P0 (Critical)**  

---

## 1. Bối cảnh & Vấn đề (Context)

Một trình soạn thảo văn bản hành chính theo tiêu chuẩn Việt Nam (như Nghị định 30/2020/NĐ-CP) đòi hỏi những năng lực kỹ thuật đặc biệt khắt khe mà các trình soạn thảo thông thường không đáp ứng được:
1. **Cấu trúc dữ liệu có tính ngữ nghĩa cao (Semantic AST):** Cần một mô hình dữ liệu dạng cây cú pháp (JSON AST) có thể serialize/deserialize chuẩn xác để chuyển đổi qua lại giữa giao diện Web ↔ Microsoft Word OpenXML (`.docx`) ↔ Vector PDF.
2. **Khả năng can thiệp sâu vào cấu trúc Node & Mark:** Hỗ trợ bảng biểu phức tạp (Table, TableRow, TableCell), bảng ẩn không viền chia 2 cột, và các custom node độc quyền như Badge Placeholder an toàn `[SỐ TIỀN CỤ THỂ]`.
3. **Headless & Tương thích với Tailwind CSS:** Cho phép tùy biến 100% giao diện thanh công cụ (Toolbar) và trang giấy A4 trực quan (Canvas View), không bị gò bó bởi CSS dựng sẵn.
4. **Sẵn sàng cho tính năng Cộng tác thời gian thực (Collaborative Editing):** Kiến trúc của trình soạn thảo phải có khả năng tích hợp thuật toán CRDT (Yjs) trong tương lai.

---

## 2. Quyết định kiến trúc (Decision)

Chúng tôi quyết định chọn **Tiptap v2 (xây dựng trên nền ProseMirror Engine)** làm nền tảng cốt lõi cho trình soạn thảo và mô hình dữ liệu văn bản của DOCDRAFT AI.

Lý do lựa chọn:
* **ProseMirror Engine:** Được xem là tiêu chuẩn vàng trong ngành công nghiệp cho các trình soạn thảo tài liệu phức tạp (được tin dùng bởi The New York Times, Atlassian Confluence, Notion).
* **Mô hình Schema bất biến (Schema Constraints):** Ngăn chặn người dùng tạo ra các cấu trúc HTML vô nghĩa hoặc bị lỗi lồng thẻ.
* **Cấu trúc JSON AST chuẩn mực:** Mỗi tài liệu được biểu diễn dưới dạng cây JSON phân cấp rõ ràng (`type`, `content`, `attrs`, `marks`), giúp Backend dễ dàng duyệt cây để tạo tệp Word OpenXML.
* **Headless Architecture:** Tích hợp hoàn hảo với React, Tailwind CSS và Shadcn UI.

---

## 3. Các giải pháp thay thế đã cân nhắc (Alternatives Considered)

### 3.1. Slate.js
* *Ưu điểm:* Thuần React, mô hình dữ liệu JSON linh hoạt.
* *Nhược điểm:* API thay đổi liên tục giữa các phiên bản (breaking changes); thiếu tính ổn định lâu dài; xử lý bảng biểu (table) rất phức tạp và hay gặp lỗi con trỏ.
* *Lý do bác bỏ:* Thiếu sự ổn định cần thiết cho một sản phẩm dài hạn.

### 3.2. Quill.js
* *Ưu điểm:* Dễ tích hợp, nhẹ.
* *Nhược điểm:* Sử dụng định dạng Delta (chủ yếu tập trung vào văn bản phẳng kèm định dạng), rất yếu khi xử lý các cấu trúc khối phân cấp phức tạp như bảng biểu, chia cột hay custom interactive nodes.
* *Lý do bác bỏ:* Không phù hợp để mô hình hóa cấu trúc văn bản hành chính phân cấp.

### 3.3. Draft.js (Facebook)
* *Lý do bác bỏ:* Đã bị Meta ngừng phát triển (deprecated) từ lâu, không hỗ trợ tốt các tính năng hiện đại.

---

## 4. Hệ quả & Đánh đổi (Consequences)

### Tích cực (+):
* Tiptap JSON AST đóng vai trò là "Single Source of Truth" duy nhất cho toàn bộ hệ thống (lưu trữ trong cột `content_json` của bảng `document_drafts`).
* Dễ dàng tích hợp các extension custom: `PlaceholderNode`, `HiddenTableNode`, `InlineDiffMark`.
* Sẵn sàng mở rộng sang cộng tác thời gian thực nhiều người cùng viết (Real-time collaborative editing qua Yjs) ở Phase 5 mà không phải đập đi xây lại editor.

### Tiêu cực / Thách thức (-):
* Độ dốc học tập (learning curve) của ProseMirror khá cao đối với các kỹ sư mới tham gia dự án khi cần viết custom plugin can thiệp vào Transaction và Steps.
