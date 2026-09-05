# ADR-008: LỰA CHỌN POSTGRESQL TSVECTOR CHO TÌM KIẾM TOÀN VĂN TIẾNG VIỆT

> **Trạng thái:** Accepted  
> **Ngày quyết định:** 2026-09-05  
> **Người đề xuất:** Kỹ sư kiến trúc hệ thống  
> **Phân cấp ưu tiên:** **P2 (Medium)**  

---

## 1. Bối cảnh & Vấn đề (Context)

Người dùng cần tìm kiếm nhanh các bản nháp văn bản trong Dashboard cá nhân và tìm kiếm văn bản quy phạm pháp luật theo tiêu đề, số hiệu hoặc nội dung trích yếu.

Đặc thù của tiếng Việt:
* Có dấu thanh phức tạp (Huyền, Sắc, Hỏi, Ngã, Nặng).
* Người dùng có thói quen gõ tìm kiếm không dấu (Vd: gõ *"to trinh kinh phi"* vẫn phải tìm ra *"Tờ trình kinh phí"*).

Chúng tôi cần chọn giải pháp tìm kiếm toàn văn (Full-Text Search - FTS) giữa:
1. **Sử dụng tính năng `tsvector` + GIN Index có sẵn trong PostgreSQL.**
2. **Dựng cụm công cụ tìm kiếm chuyên dụng bên ngoài (Elasticsearch, Meilisearch, Algolia).**

---

## 2. Quyết định kiến trúc (Decision)

Chúng tôi quyết định chọn **PostgreSQL `tsvector` kết hợp chỉ mục GIN (Generalized Inverted Index)**:
* Sử dụng từ điển cấu hình `simple` của PostgreSQL để bảo toàn nguyên vẹn các ký tự dấu tiếng Việt.
* Kết hợp hàm chuyển đổi không dấu `unaccent` để hỗ trợ tìm kiếm hai chiều (người dùng gõ có dấu hay không dấu đều trả về kết quả chính xác).
* Thiết lập chỉ mục GIN trên cột tổng hợp:
  ```sql
  CREATE INDEX idx_drafts_search ON document_drafts
  USING GIN (to_tsvector('simple', title));
  ```

---

## 3. Các giải pháp thay thế đã cân nhắc (Alternatives Considered)

### 3.1. Elasticsearch / OpenSearch
* *Ưu điểm:* Cực kỳ mạnh mẽ cho quy mô dữ liệu hàng terabyte, hỗ trợ phân tích âm vị học (phonetic search).
* *Nhược điểm:* Đòi hỏi tài nguyên máy chủ rất lớn (ít nhất 2GB - 4GB RAM cho máy ảo Java); cấu hình phức tạp; phát sinh bài toán đồng bộ dữ liệu liên tục từ PostgreSQL sang Elasticsearch qua CDC (Change Data Capture) hoặc Debezium.
* *Lý do bác bỏ:* Quá thừa thãi (over-engineering) đối với quy mô dữ liệu văn bản nội bộ của dự án.

### 3.2. Algolia
* *Ưu điểm:* Tìm kiếm tức thì theo từng ký tự gõ (Search-as-you-type), giao diện quản trị trực quan.
* *Nhược điểm:* Chi phí tính trên mỗi lượt tìm kiếm; dữ liệu văn bản nhạy cảm bị đẩy lên máy chủ bên thứ ba.
* *Lý do bác bỏ:* Chi phí cao và rủi ro bảo mật dữ liệu hành chính.

---

## 4. Hệ quả & Đánh đổi (Consequences)

### Tích cực (+):
* Tận dụng tối đa sức mạnh sẵn có của PostgreSQL, không phát sinh thêm dịch vụ chạy ngầm nào khác.
* Dữ liệu tìm kiếm luôn cập nhật theo thời gian thực (Real-time consistency): khi văn bản được lưu, chỉ mục GIN cập nhật ngay trong cùng một transaction.
* Tốc độ tìm kiếm cực nhanh (<15ms cho kho dữ liệu dưới 500,000 văn bản).

### Tiêu cực / Thách thức (-):
* Khả năng xếp hạng ngữ nghĩa (Relevance Ranking) ở mức cơ bản theo tần suất từ (`ts_rank`), nhưng được bù đắp hoàn hảo bằng hệ thống Vector Search (pgvector) cho các tác vụ tìm kiếm chuyên sâu.
