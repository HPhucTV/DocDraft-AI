# ADR-004: PHÁT TRIỂN TIỆN ÍCH MICROSOFT WORD BẰNG OFFICE.JS TASK PANE

> **Trạng thái:** Accepted  
> **Ngày quyết định:** 2026-09-05  
> **Người đề xuất:** Kỹ sư kiến trúc hệ thống  
> **Phân cấp ưu tiên:** **P2 (Medium)**  

---

## 1. Bối cảnh & Vấn đề (Context)

Hơn 90% đối tượng người dùng mục tiêu (cán bộ văn phòng, thư ký, pháp chế) có thói quen làm việc gắn liền với phần mềm Microsoft Word.
* Việc bắt buộc người dùng phải rời khỏi Word, mở trình duyệt web, copy-paste nội dung qua lại tạo ra **ma sát rất lớn (Friction)** làm giảm tỷ lệ sử dụng sản phẩm.
* Do đó, một tiện ích mở rộng tích hợp trực tiếp trong Microsoft Word là vũ khí chiến lược để thâm nhập thị trường.

Chúng tôi cần lựa chọn công nghệ phát triển Add-in cho Microsoft Word giữa:
1. **VSTO / COM Add-in truyền thống (C# / .NET).**
2. **Office.js Web Add-in (HTML / JavaScript / React) hiển thị dạng Task Pane.**

---

## 2. Quyết định kiến trúc (Decision)

Chúng tôi quyết định chọn **Office.js Web Add-in (Task Pane)**:
* Giao diện chạy như một thanh bên (Sidebar) trực tiếp bên phải cửa sổ Microsoft Word.
* Tái sử dụng trực tiếp các React component, API client và Design System từ ứng dụng Next.js chính.
* Tương tác với tài liệu Word thông qua bộ thư viện chính thức `Word.run(async (context) => { ... })`:
  * Đọc đoạn văn bản đang được bôi đen trong Word.
  * Tự động điều chỉnh lề in trang (`context.document.sections.getFirst().body.pageSetup`).
  * Chèn khối bảng ẩn Quốc hiệu/Tiêu ngữ chuẩn NĐ 30 trực tiếp vào tệp Word đang mở.

Lộ trình chia làm 2 giai đoạn:
* **Phase 3 (Add-in Lite):** Tập trung vào tính năng 1-click chuẩn hóa thể thức (Font Times New Roman, lề 30/15/20/20mm, chia bảng ẩn tiêu ngữ).
* **Phase 5 (Add-in Full):** Đưa toàn bộ form sinh văn bản và AI Copilot vào Word.

---

## 3. Các giải pháp thay thế đã cân nhắc (Alternatives Considered)

### 3.1. VSTO / COM Add-in (.NET Framework)
* *Ưu điểm:* Can thiệp rất sâu vào các hàm nội bộ của Word desktop.
* *Nhược điểm:* Chỉ chạy được trên Windows; không chạy được trên Mac và Word trên trình duyệt web (Word Online); cài đặt phức tạp qua file `.msi` (thường bị IT cơ quan chặn do chính sách bảo mật).
* *Lý do bác bỏ:* Hạn chế đa nền tảng và khó phân phối cập nhật.

---

## 4. Hệ quả & Đánh đổi (Consequences)

### Tích cực (+):
* **Đa nền tảng (Cross-platform 100%):** Một codebase duy nhất chạy trên Word Windows, Word macOS và Word Online.
* **Cập nhật tức thì (Instant Over-The-Air Updates):** Vì Add-in thực chất là một trang web HTTPS nhúng trong khung iframe của Word, khi cập nhật mã nguồn trên server, người dùng lập tức có tính năng mới mà không cần cài đặt lại.

### Tiêu cực / Thách thức (-):
* Office.js API có một số giới hạn khi can thiệp vào các thuộc tính OpenXML quá chi tiết so với VSTO, đòi hỏi phải xử lý khéo léo qua các hàm chèn OOXML (`insertOoxml`).
