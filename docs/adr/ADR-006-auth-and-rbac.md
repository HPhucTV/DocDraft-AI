# ADR-006: LỰA CHỌN NEXTAUTH.JS V5 VÀ KIẾN TRÚC PHÂN QUYỀN RBAC

> **Trạng thái:** Accepted  
> **Ngày quyết định:** 2026-09-05  
> **Người đề xuất:** Kỹ sư kiến trúc hệ thống  
> **Phân cấp ưu tiên:** **P1 (High)**  

---

## 1. Bối cảnh & Vấn đề (Context)

Một nền tảng soạn thảo văn bản phục vụ doanh nghiệp và cơ quan hành chính đòi hỏi:
1. **Khả năng kiểm soát dữ liệu người dùng tuyệt đối:** Dữ liệu danh tính cán bộ, phân quyền, và tổ chức phải được lưu trữ trực tiếp trong cơ sở dữ liệu PostgreSQL của dự án, không bị ràng buộc vào dịch vụ bên thứ ba (Vendor Lock-in).
2. **Chi phí mở rộng bền vững (Predictable Cost):** Các dịch vụ như Clerk hay Auth0 tính phí tăng dần theo số lượng người dùng hoạt động hàng tháng (Monthly Active Users - MAU), gây áp lực tài chính lớn khi triển khai diện rộng cho các trường học, cơ quan lớn.
3. **Tương thích hoàn hảo với Next.js 14+ App Router:** Hỗ trợ xác thực phiên làm việc mượt mà trên Server Components, Server Actions, Route Handlers và Edge Middleware.
4. **Hỗ trợ phân quyền dựa trên vai trò (Role-Based Access Control - RBAC):** Cần phân định rõ ràng giữa người soạn thảo (`USER`), người phê duyệt (`APPROVER`), quản trị viên (`ADMIN`) và khách xem (`VIEWER`).

---

## 2. Quyết định kiến trúc (Decision)

Chúng tôi quyết định chọn **NextAuth.js (Auth.js v5)** kết hợp **Database Session / JWT Hybrid Strategy**:
* Tích hợp OAuth 2.0 Google (ưu tiên số 1 tại Việt Nam) và Credentials Provider (Email/Password với bcrypt).
* Quản lý dữ liệu người dùng thông qua 2 bảng trong cơ sở dữ liệu chính: `users` và `accounts`.
* Triển khai mô hình phân quyền RBAC 4 cấp:
  * `USER`: Tạo, sửa, xóa bản nháp của chính mình; gọi AI sinh văn bản.
  * `APPROVER`: Nhận thông báo trình ký, duyệt, bác bỏ hoặc ký duyệt văn bản.
  * `ADMIN`: Quản lý danh mục mẫu (`templates`), xem Dashboard phân tích, quản lý thành viên tổ chức.
  * `VIEWER`: Chỉ xem qua link chia sẻ bảo mật, không có quyền can thiệp nội dung.

---

## 3. Các giải pháp thay thế đã cân nhắc (Alternatives Considered)

### 3.1. Clerk
* *Ưu điểm:* Giao diện dựng sẵn tuyệt đẹp, setup rất nhanh (dưới 15 phút).
* *Nhược điểm:* Chi phí đắt đỏ khi lượng người dùng tăng; dữ liệu người dùng bị lưu trữ trên hạ tầng máy chủ của Clerk ở nước ngoài (khó tuân thủ quy định bảo vệ dữ liệu cá nhân tại Việt Nam - Nghị định 13/2023/NĐ-CP).
* *Lý do bác bỏ:* Vấn đề chủ quyền dữ liệu và chi phí dài hạn.

### 3.2. Supabase Auth
* *Ưu điểm:* Tích hợp sâu với PostgreSQL và Row Level Security (RLS).
* *Nhược điểm:* Ràng buộc chặt chẽ với hạ tầng Supabase; khó chuyển đổi sang máy chủ PostgreSQL tự quản trị (Self-hosted) nếu sau này khách hàng cơ quan yêu cầu cài đặt on-premise.
* *Lý do bác bỏ:* Giảm tính linh hoạt trong các kịch bản triển khai đa dạng.

---

## 4. Hệ quả & Đánh đổi (Consequences)

### Tích cực (+):
* Hoàn toàn miễn phí, không phát sinh chi phí theo số lượng người dùng.
* Dữ liệu danh tính nằm trọn vẹn trong PostgreSQL của tổ chức.
* Sẵn sàng cho việc mở rộng tích hợp xác thực một lần (SSO SAML / Microsoft Entra ID) trong tương lai.

### Tiêu cực / Thách thức (-):
* Đội ngũ phải tự thiết kế giao diện trang Login, Register, Profile thay vì dùng component có sẵn của Clerk.
