# ADR-007: LỰA CHỌN CLOUDFLARE R2 CHO LƯU TRỮ TỆP TIN XUẤT BẢN VÀ SCAN OCR

> **Trạng thái:** Accepted  
> **Ngày quyết định:** 2026-09-05  
> **Người đề xuất:** Kỹ sư kiến trúc hệ thống  
> **Phân cấp ưu tiên:** **P1 (High)**  

---

## 1. Bối cảnh & Vấn đề (Context)

DOCDRAFT AI có nhu cầu lưu trữ tệp tin nhị phân phục vụ 3 nhóm tác vụ chính:
1. **Lưu trữ tệp xuất bản (.docx & PDF):** Các bản in hoàn chỉnh sau khi được render từ FastAPI Document Service.
2. **Lưu trữ tài liệu tải lên & Scan OCR:** Ảnh chụp văn bản giấy, tệp Word gốc do người dùng upload để bóc tách.
3. **Lưu trữ ảnh chữ ký tay & con dấu:** Ảnh PNG tách nền của cán bộ và doanh nghiệp phục vụ chèn vào văn bản đã duyệt.

Vấn đề then chốt: Tần suất tải xuống (Download Egress) của tệp Word và PDF là rất lớn. Trên dịch vụ truyền thống như Amazon Web Services (AWS S3), chi phí băng thông tải ra ngoài (Data Egress Fee) khoảng **$0.09 / GB**, dễ dẫn đến chi phí bị đội lên đột biến ngoài tầm kiểm soát khi sản phẩm có lượng người dùng đông đảo.

---

## 2. Quyết định kiến trúc (Decision)

Chúng tôi quyết định chọn **Cloudflare R2 Storage** làm dịch vụ lưu trữ đối tượng (Object Storage) chính của dự án:
* **Miễn phí 100% băng thông tải ra (Zero Egress Fees):** Người dùng có thể tải tệp tin Word và PDF không giới hạn mà không làm phát sinh thêm chi phí băng thông cho hệ thống.
* **Tương thích hoàn toàn với AWS S3 API:** Cho phép sử dụng trực tiếp bộ thư viện chuẩn `@aws-sdk/client-s3` (Node.js) và `boto3` (Python) mà không phải thay đổi mã nguồn.
* **Bảo mật liên kết tải về qua Presigned URLs:** Tệp tin lưu trữ ở chế độ riêng tư (Private). Khi người dùng yêu cầu tải, máy chủ sinh Presigned URL có chữ ký số với thời hạn hiệu lực ngắn (15 phút) để bảo mật tuyệt đối.

---

## 3. Các giải pháp thay thế đã cân nhắc (Alternatives Considered)

### 3.1. Amazon Web Services (AWS S3)
* *Ưu điểm:* Tiêu chuẩn ngành, độ tin cậy cực cao (99.999999999%).
* *Nhược điểm:* Chi phí băng thông tải ra (egress fee) rất đắt đỏ; giao diện quản trị IAM phức tạp.
* *Lý do bác bỏ:* Chi phí băng thông không tối ưu cho mô hình tải tệp thường xuyên.

### 3.2. Lưu trữ trực tiếp trên máy chủ (Local Disk / Container Volume)
* *Ưu điểm:* Không mất phí dịch vụ ngoài.
* *Nhược điểm:* Container là môi trường tạm thời (ephemeral), khởi động lại sẽ mất file; không thể mở rộng quy mô khi chạy nhiều máy chủ phân tán.
* *Lý do bác bỏ:* Vi phạm nguyên tắc thiết kế ứng dụng đám mây (Cloud-native 12-factor app).

---

## 4. Hệ quả & Đánh đổi (Consequences)

### Tích cực (+):
* Dự toán chi phí hạ tầng ổn định, không lo bùng nổ chi phí khi văn bản được tải về nhiều lần.
* Tích hợp mượt mà với mạng lưới máy chủ phân phối biên (Cloudflare Global Edge CDN), giúp việc tải file tại Việt Nam có độ trễ cực thấp.

### Tiêu cực / Thách thức (-):
* Cần quản lý thêm tài khoản và API Key tại bảng điều khiển Cloudflare.
