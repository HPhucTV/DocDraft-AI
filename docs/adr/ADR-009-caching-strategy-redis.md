# ADR-009: CHIẾN LƯỢC BỘ ĐỆM ĐA TẦNG VÀ GIỚI HẠN TẦN SUẤT BẰNG REDIS (CACHING STRATEGY)

> **Trạng thái:** Accepted  
> **Ngày quyết định:** 2026-09-05  
> **Người đề xuất:** Kỹ sư kiến trúc hệ thống  
> **Phân cấp ưu tiên:** **P2 (Medium)**  

---

## 1. Bối cảnh & Vấn đề (Context)

Một hệ thống AI chuyên sâu như DOCDRAFT AI phải đối mặt với các thách thức lớn về hiệu năng và chi phí vận hành:
1. **Nguy cơ spam và cạn kiệt ngân sách API AI:** Nếu không giới hạn tần suất (Rate Limiting), một số người dùng vô tình hoặc cố ý spam yêu cầu sinh văn bản có thể làm tài khoản DeepSeek/Gemini cạn hạn mức hoặc phát sinh hóa đơn khổng lồ.
2. **Lãng phí khi sinh văn bản lặp lại:** Nhiều người dùng điền form với các thông số cơ bản giống nhau (hoặc cùng một người bấm xuất file nhiều lần liên tiếp), nếu lần nào cũng gọi LLM và Puppeteer sẽ gây lãng phí tài nguyên CPU và chi phí token.
3. **Cần nơi lưu trữ trạng thái phiên tạm thời (Ephemeral State):** Lưu thông tin người đang online, khóa tạm thời khi xử lý đồng thời.

---

## 2. Quyết định kiến trúc (Decision)

Chúng tôi quyết định áp dụng **Kiến trúc Bộ đệm đa tầng (Multi-tier Caching)** sử dụng **Redis (Upstash Serverless Redis)**:

```
Request từ Client
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ TẦNG 1: RATE LIMITING (Sliding Window Counter)         │
│  - Người dùng BYOK (Tự cấp Key): Bỏ qua Rate Limit     │
│  - Người dùng dùng Key hệ thống: Giới hạn 20 req/giờ   │
│  - Giới hạn 100 request API tổng thể/phút              │
└──────────────────────────┬─────────────────────────────┘
                           │ (Hợp lệ)
                           ▼
┌────────────────────────────────────────────────────────┐
│ TẦNG 2: LLM PROMPT CACHE (Semantic / Exact Hash Key)   │
│  - Key: SHA256(template_id + input_data)               │
│  - TTL: 24 giờ                                         │
│  - Hit: Trả kết quả ngay (<10ms), tiết kiệm 100% token │
└──────────────────────────┬─────────────────────────────┘
                           │ (Miss)
                           ▼
┌────────────────────────────────────────────────────────┐
│ TẦNG 3: GỌI DEEPSEEK-V3 (FALLBACK: GEMINI 3.7 FLASH)   │
└────────────────────────────────────────────────────────┘
```

---

## 3. CÁC ỨNG DỤNG CỤ THỂ CỦA REDIS TRONG HỆ THỐNG

1. **Kiểm soát tần suất gọi API (Rate Limiting) & Hỗ trợ BYOK:**
   * Sử dụng thuật toán Sliding Window Counter thông qua thư viện `@upstash/ratelimit`.
   * Đối với người dùng tự cung cấp API Key (BYOK), hệ thống bỏ qua kiểm tra rate limit AI.
   * Đối với người dùng miễn phí dùng key hệ thống, trả về header `X-RateLimit-Limit`, `X-RateLimit-Remaining`. Khi vượt quá, trả về mã lỗi `429 Too Many Requests`.
2. **Bộ đệm tệp tin xuất bản (Export Result Cache):**
   * Lưu trữ metadata và đường dẫn tệp đã render trên Cloudflare R2 theo key mã băm nội dung `exports:{sha256}` với thời hạn TTL 7 ngày.
   * Lần tải thứ hai trở đi của cùng một văn bản được phục vụ ngay lập tức mà không phải khởi động lại Puppeteer.

---

## 4. Hệ quả & Đánh đổi (Consequences)

### Tích cực (+):
* **Bảo vệ ngân sách tuyệt đối:** Ngăn chặn triệt để tình trạng DDoS hoặc spam làm cháy ngân sách API của dự án.
* **Tăng tốc độ phản hồi đáng kể:** Các tác vụ phổ biến và tải lại tệp tin có tốc độ phản hồi gần như tức thì (<10ms).
* **Mô hình Serverless tối ưu:** Upstash tính phí theo số lượng lệnh gọi thực tế (Pay-as-you-go), miễn phí 10,000 lệnh/ngày, rất phù hợp cho giai đoạn phát triển ban đầu.

### Tiêu cực / Thách thức (-):
* Cần cơ chế vô hiệu hóa bộ đệm (Cache Invalidation) chuẩn xác khi người dùng chủ động bấm nút "Tạo lại văn bản mới" (Regenerate).
