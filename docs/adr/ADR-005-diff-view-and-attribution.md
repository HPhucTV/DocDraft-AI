# ADR-005: TÍCH HỢP SIDE-BY-SIDE DIFF VIEW VÀ MINH BẠCH NGUỒN GỐC CHỈNH SỬA (AUDIT TRAIL)

> **Trạng thái:** Accepted  
> **Ngày quyết định:** 2026-09-05  
> **Người đề xuất:** Kỹ sư kiến trúc hệ thống  
> **Phân cấp ưu tiên:** **P2 (Medium)**  

---

## 1. Bối cảnh & Vấn đề (Context)

Nhiều công cụ AI hiện nay áp dụng cách tiếp cận "ghi đè trực tiếp" (Direct Overwrite): khi người dùng yêu cầu AI viết lại, toàn bộ văn bản cũ biến mất và được thay thế bằng văn bản mới.

Cách tiếp cận này gặp phải sự phản kháng quyết liệt trong môi trường hành chính và doanh nghiệp Việt Nam:
1. **Mất kiểm soát nội dung:** Người dùng không biết AI đã âm thầm thay đổi những từ ngữ nào, có vô tình cắt bỏ các điều khoản quan trọng hay không.
2. **Thiếu trách nhiệm giải trình (Lack of Accountability):** Khi xảy ra tranh chấp pháp lý hoặc sai sót số liệu, tổ chức không thể chứng minh được đoạn văn bản đó do cán bộ soạn thảo hay do AI đề xuất.

---

## 2. Quyết định kiến trúc (Decision)

Chúng tôi quyết định áp dụng **Nguyên tắc "Kiểm soát trước khi Áp dụng" (Review Before Apply)**:
1. **Không bao giờ ghi đè trực tiếp:** Bất kỳ thao tác viết lại nào từ AI đều bắt buộc kích hoạt giao diện **Side-by-side Diff View** (sử dụng thuật toán so sánh khối `jsdiff`).
2. **Cơ chế duyệt từng phần (Chunk-by-Chunk Granularity):** Người dùng có quyền chấp nhận (Accept) hoặc từ chối (Reject) từng thay đổi nhỏ riêng biệt thay vì buộc phải chọn tất cả hoặc không gì cả.
3. **Gắn nhãn nguồn gốc bắt buộc trên mọi Snapshot:** Mọi phiên bản lưu trong bảng `draft_versions` đều có thuộc tính `edit_source` phân định rõ:
   * `AI_GENERATE`
   * `AI_INLINE_EDIT`
   * `AI_CHAT_APPLY`
   * `USER_MANUAL`
4. **Bảng ghi log chi tiết `audit_logs`:** Ghi nhận actor, thời điểm, địa chỉ IP và mức độ thay đổi từ ngữ.

---

## 3. Hệ quả & Đánh đổi (Consequences)

### Tích cực (+):
* **Xây dựng niềm tin vững chắc:** Người dùng cảm thấy hoàn toàn làm chủ công cụ, loại bỏ 100% tâm lý sợ mất dữ liệu.
* **Sẵn sàng cho môi trường Enterprise:** Tính năng Audit Trail đáp ứng các tiêu chuẩn khắt khe về quản trị dữ liệu và kiểm toán nội bộ của các tập đoàn và cơ quan nhà nước.

### Tiêu cực / Thách thức (-):
* Phát sinh thêm độ phức tạp trong việc xây dựng giao diện hợp nhất (Merge UI) và xử lý đồng bộ cây ProseMirror AST trên Frontend.
