# 📘 HƯỚNG DẪN CÀI ĐẶT GOOGLE DOCS ADD-ON — DOCDRAFT AI

> **Dự án:** DocDraft AI (Nghị định 30/2020/NĐ-CP)  
> **Nhiệm vụ:** TASK-502 — Google Docs Workspace Add-on  
> **Thời gian cài đặt:** ~2 phút  

---

## 🚀 Cách Cài Đặt Trong 3 Bước Nhanh

Tiện ích mở rộng Google Docs của DocDraft AI hoạt động thông qua nền tảng chính thức **Google Apps Script** của Google.

### Bước 1: Mở trình soạn thảo Google Apps Script
1. Mở một tài liệu bất kỳ trên [Google Docs](https://docs.google.com).
2. Trên thanh menu trên cùng, chọn: **Tiện ích mở rộng (Extensions)** → **Apps Script**.
3. Một tab trình duyệt mới sẽ mở ra với giao diện lập trình của Google.

### Bước 2: Sao chép mã nguồn vào dự án Apps Script
1. **Tạo tệp mã nguồn:**
   - Trong giao diện Apps Script, mở tệp `Code.gs` và xóa nội dung mặc định.
   - Sao chép toàn bộ nội dung trong tệp [`google-docs-addon/Code.gs`](./Code.gs) dán vào `Code.gs`.
2. **Tạo tệp giao diện Sidebar:**
   - Bấm vào dấu **`+`** bên cạnh mục *Tệp (Files)* → chọn **HTML**.
   - Đặt tên tệp chính xác là: `Sidebar` (Google sẽ tự tạo `Sidebar.html`).
   - Sao chép toàn bộ nội dung trong tệp [`google-docs-addon/Sidebar.html`](./Sidebar.html) dán vào `Sidebar.html`.
3. **Cấu hình quyền (Manifest):**
   - Bấm vào biểu tượng ⚙️ **Cài đặt dự án (Project Settings)** ở thanh bên trái.
   - Tích chọn: ☑️ *Hiển thị tệp kê khai "appsscript.json" trong trình chỉnh sửa*.
   - Quay lại phần Trình chỉnh sửa (biểu tượng `<>`), bấm vào `appsscript.json`.
   - Dán nội dung từ tệp [`google-docs-addon/appsscript.json`](./appsscript.json) vào.
4. Bấm biểu tượng 💾 **Lưu dự án** (`Ctrl + S`).

### Bước 3: Chạy thử và cấp quyền
1. Trong thanh công cụ phía trên của Apps Script, chọn hàm `onOpen` và bấm **Chạy (Run)**.
2. Google sẽ hiển thị bảng yêu cầu cấp quyền:
   - Bấm **Xem xét quyền (Review Permissions)**.
   - Chọn tài khoản Google của bạn.
   - Bấm **Nâng cao (Advanced)** → Chọn **Đi tới ... (không an toàn)** (đây là cảnh báo tiêu chuẩn cho script cá nhân).
   - Bấm **Cho phép (Allow)**.
3. Quay lại tab Google Docs của bạn và tải lại trang (`F5`):
   - Bạn sẽ thấy menu mới **"DocDraft AI (Nghị định 30)"** xuất hiện trên thanh công cụ!
   - Bấm **Mở bảng điều khiển (Sidebar)** để bắt đầu sử dụng.

---

## 🎯 Các Tính Năng Có Sẵn Trong Google Docs

| Tính năng | Mô tả chi tiết |
|---|---|
| **⚡ 1-Click Chuẩn hóa thể thức NĐ 30** | Tự động đặt lề trái 30mm, lề phải 15mm, lề trên 20mm, lề dưới 20mm; đổi phông Times New Roman 13pt; căn đều 2 bên. |
| **➕ Khối Quốc hiệu & Tiêu ngữ** | Chèn bảng ẩn 2 cột (40/60) không viền chuẩn NĐ 30 vào đầu văn bản. |
| **➕ Khối Nơi nhận & Ký tên** | Chèn bảng ẩn 2 cột (50/50) vào cuối văn bản. |
| **✨ AI Copilot bôi đen** | Bôi đen văn bản trong Google Docs để: Hành chính hóa, Rút gọn, Viết chi tiết hoặc Sửa lỗi chính tả. |
| **📄 Mẫu văn bản AI** | Chọn mẫu tờ trình, công văn, quyết định và sinh văn bản tự động chèn vào Google Docs. |
| **📑 Chuốt nháp thô (Raw-to-Doc)** | Dán ghi chú cuộc họp thô để AI chuyển hóa thành văn bản hành chính hoàn chỉnh. |

---

## 🔧 Kết Nối Máy Chủ DocDraft AI Cục Bộ hoặc Production
Trong tab **Cấu hình** của thanh bên Google Docs:
- Mặc định kết nối tới `http://localhost:3000` (khi bạn đang chạy `npm run dev` trên máy).
- Khi đưa lên máy chủ thực tế (VD: `https://docdraft.vn`), chỉ cần cập nhật URL này một lần.
