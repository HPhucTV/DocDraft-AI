# KIẾN TRÚC TRA CỨU CĂN CỨ PHÁP LÝ BẰNG RAG & PGVECTOR (LEGAL RAG ARCHITECTURE)

> **Mã tài liệu:** ARCH-004  
> **Phân cấp ưu tiên:** **P2 (Medium — Mở rộng Phase 3–4)**  
> **Trạng thái:** Approved  
> **Công nghệ:** PostgreSQL pgvector (HNSW Index) + Gemini Text Embedding  
> **Cập nhật lần cuối:** 2026-09-05  

---

## 1. MỤC TIÊU & TẦM QUAN TRỌNG ĐỘT PHÁ

Trong văn bản hành chính Việt Nam, phần **"Căn cứ pháp lý"** là phần dễ bị sai sót nhất:
* Người dùng hay viết sai tên hoặc số hiệu văn bản quy phạm pháp luật (Vd: Nhầm giữa Nghị định và Thông tư, nhớ sai năm ban hành).
* Không nắm được văn bản đó còn hiệu lực hay đã bị thay thế / hủy bỏ bởi văn bản mới.

Kiến trúc **Legal RAG (Retrieval-Augmented Generation)** giải quyết triệt để vấn đề này: Khi người soạn thảo gõ cụm từ *"Căn cứ..."* kèm theo chủ đề (Vd: *"quản lý chi phí xây dựng"*), hệ thống tự động tra cứu ngữ nghĩa và hiển thị gợi ý câu căn cứ chính xác 100%.

```
┌─────────────────────────┐
│ CSDL VĂN BẢN PHÁP QUY   │ (Nguồn: vanban.chinhphu.vn)
│ (Luật, Nghị định, TT)   │
└────────────┬────────────┘
             │
             ▼ Chunking theo Điều/Khoản + Gắn Meta dữ liệu
┌─────────────────────────┐
│ GEMINI TEXT EMBEDDING   │ (768 chiều vector)
└────────────┬────────────┘
             │
             ▼ Lưu trữ & Đánh chỉ mục HNSW
┌─────────────────────────┐
│ SUPABASE PGVECTOR       │ ◄──────────┐
└────────────┬────────────┘            │ Hybrid Search (FTS + Vector)
             │                         │
             ▼                         │
┌─────────────────────────┐   Người dùng gõ: "Căn cứ quản lý chi phí..."
│ AUTOCOMPLETE DROPDOWN   │─── Trong Tiptap Editor
└─────────────────────────┘
```

---

## 2. QUY TRÌNH NẠP & XỬ LÝ DỮ LIỆU PHÁP LUẬT (DATA INGESTION PIPELINE)

### 2.1. Nguồn dữ liệu & Phạm vi tuyển chọn
* **Nguồn chính thống:** Cổng thông tin điện tử Chính phủ (`vanban.chinhphu.vn`) — đảm bảo 100% tính hợp pháp, không vi phạm điều khoản dịch vụ (ToS).
* **Giai đoạn 1 (Curated 200–300 văn bản phổ biến):**
  * Hành chính & Văn thư: NĐ 30/2020/NĐ-CP.
  * Lao động: Bộ luật Lao động 2019, NĐ 145/2020/NĐ-CP.
  * Doanh nghiệp & Đầu tư: Luật Doanh nghiệp 2020, Luật Đầu tư 2020.
  * Xây dựng & Đấu thầu: Luật Xây dựng, Luật Đấu thầu 2023, NĐ 10/2021/NĐ-CP.

### 2.2. Chiến lược phân mảnh tài liệu (Legal Chunking Strategy)
Văn bản pháp luật có tính cấu trúc hình cây nghiêm ngặt:
* Không cắt vụn theo độ dài ký tự cố định (fixed token chunking).
* Cắt theo **Ranh giới ngữ nghĩa Điều / Khoản (Article / Clause Chunking)**:
  * Mỗi chunk giữ trọn vẹn: `Tên luật` + `Chương` + `Điều` + `Nội dung điều khoản`.
  * Tiêu đề đầy đủ được chuẩn hóa thành chuỗi `full_citation`:
    > *Ví dụ:* `"Căn cứ Nghị định số 10/2021/NĐ-CP ngày 09 tháng 02 năm 2021 của Chính phủ về quản lý chi phí đầu tư xây dựng;"`

---

## 3. CƠ CHẾ TÌM KIẾM LAI KẾT HỢP (HYBRID SEARCH ALGORITHM)

Để đạt độ chính xác cao nhất (khi người dùng gõ cả từ khóa số hiệu chính xác lẫn từ khóa mang tính ý nghĩa), hệ thống áp dụng **Hybrid Search**:

1. **Tìm kiếm từ khóa (Keyword Search):** Sử dụng `tsvector` và `tsquery` của PostgreSQL để khớp chính xác số hiệu: `"10/2021/NĐ-CP"`.
2. **Tìm kiếm ngữ nghĩa (Semantic Search):** Sử dụng khoảng cách Cosine trên chỉ mục `HNSW` của `pgvector`:
   $$\text{Similarity} = 1 - (\text{embedding} \Leftrightarrow \text{query\_vector})$$
3. **Hợp nhất kết quả bằng Reciprocal Rank Fusion (RRF):**
   $$RRF\_Score(d) = \frac{1}{60 + Rank_{FTS}(d)} + \frac{1}{60 + Rank_{Vector}(d)}$$

---

## 4. TÍCH HỢP GỢI Ý TỰ ĐỘNG VÀO TRÌNH SOẠN THẢO (EDITOR INTEGRATION)

1. **Tiptap Suggestion Extension:**
   * Lắng nghe chuỗi ký tự nhập: Khi phát hiện mẫu regex `/(?:căn cứ|can cu)\s+(.+)/i`.
   * Gửi request debounce (300ms) tới `GET /api/legal/suggest?q=...`.
2. **Hiển thị Popover Gợi ý:**
   * Hiển thị danh sách 5 văn bản pháp luật phù hợp nhất kèm trạng thái hiệu lực (🟢 Còn hiệu lực / 🔴 Hết hiệu lực).
   * Người dùng bấm phím `Enter` hoặc `Tab` → Tự động chèn câu trích dẫn chuẩn mực kèm dấu chấm phẩy `;` vào văn bản.
