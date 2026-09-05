# ADR-003: LỰA CHỌN POSTGRESQL PGVECTOR CHO HỆ THỐNG TRA CỨU CĂN CỨ PHÁP LÝ (LEGAL RAG)

> **Trạng thái:** Accepted  
> **Ngày quyết định:** 2026-09-05  
> **Người đề xuất:** Kỹ sư kiến trúc hệ thống  
> **Phân cấp ưu tiên:** **P2 (Medium)**  

---

## 1. Bối cảnh & Vấn đề (Context)

Tính năng gợi ý căn cứ pháp lý thông minh (Legal Citation Auto-Suggest) yêu cầu lưu trữ và tìm kiếm tương đồng trên hàng chục nghìn vector embedding trích xuất từ văn bản quy phạm pháp luật Việt Nam.

Chúng tôi cần chọn giải pháp cơ sở dữ liệu vector đáp ứng các tiêu chí:
1. **Tránh phân mảnh kiến trúc (No Dual-Database Overhead):** Không muốn vận hành song song một CSDL quan hệ (PostgreSQL) và một CSDL vector độc lập (Pinecone, Milvus), dẫn đến việc phải đồng bộ dữ liệu hai chiều phức tạp.
2. **Hỗ trợ Tìm kiếm lai (Hybrid Search trong 1 câu truy vấn):** Có thể kết hợp mượt mà giữa tìm kiếm từ khóa số hiệu (`"10/2021/NĐ-CP"`) qua Full-text search và tìm kiếm ý nghĩa ngữ nghĩa qua vector.
3. **Tối ưu chi phí hạ tầng:** Giữ chi phí ở mức tối thiểu trong giai đoạn phát triển và thử nghiệm sản phẩm.

---

## 2. Quyết định kiến trúc (Decision)

Chúng tôi quyết định sử dụng **Tiện ích mở rộng `pgvector` tích hợp trực tiếp trên PostgreSQL 16 (Supabase)**:
* Thêm cột `embedding vector(768)` trực tiếp vào bảng `legal_documents`.
* Sử dụng chỉ mục **HNSW (Hierarchical Navigable Small World)** với toán tử đo khoảng cách Cosine `vector_cosine_ops`.
* Thực hiện tìm kiếm tương đồng vector và lọc dữ liệu nghiệp vụ (loại văn bản, còn hiệu lực hay không) trong cùng một câu lệnh `SELECT SQL` duy nhất.

---

## 3. Các giải pháp thay thế đã cân nhắc (Alternatives Considered)

### 3.1. Pinecone / Weaviate Cloud
* *Ưu điểm:* Dịch vụ vector chuyên dụng, hiệu năng tìm kiếm ở quy mô hàng chục triệu vector cực nhanh.
* *Nhược điểm:* Chi phí tốn kém (từ $70/tháng trở lên); phát sinh bài toán đồng bộ dữ liệu (nếu xóa một văn bản luật ở PostgreSQL thì phải gọi API xóa vector ở Pinecone, dễ bị lệch dữ liệu).
* *Lý do bác bỏ:* Quy mô CSDL pháp luật chọn lọc của DOCDRAFT AI ở mức vài nghìn đến vài chục nghìn vector, hoàn toàn nằm trong khả năng xử lý xuất sắc của `pgvector` mà không cần tốn thêm chi phí.

### 3.2. ChromaDB (Self-hosted)
* *Nhược điểm:* Cần tự dựng thêm một service Python chạy nền; quản lý backup phân tán phức tạp hơn.
* *Lý do bác bỏ:* Làm tăng độ phức tạp trong vận hành hệ thống.

---

## 4. Hệ quả & Đánh đổi (Consequences)

### Tích cực (+):
* Kiến trúc dữ liệu tập trung duy nhất tại PostgreSQL, đảm bảo tính toàn vẹn giao dịch (ACID).
* Dễ dàng thực hiện các câu truy vấn kết hợp: lọc trạng thái `status = 'ACTIVE'` và tính điểm tương đồng ngữ nghĩa trong một lệnh gọi.
* Hoàn toàn không phát sinh thêm chi phí hạ tầng mới.

### Tiêu cực / Thách thức (-):
* Cần tinh chỉnh bộ nhớ `work_mem` và tham số `ef_search` trong PostgreSQL để đảm bảo tốc độ truy vấn HNSW luôn dưới 50ms khi lượng vector tăng cao.
