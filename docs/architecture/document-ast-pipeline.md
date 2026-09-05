# ĐẶC TẢ CHI TIẾT ĐỘNG CƠ BIẾN ĐỔI CÂY CÚ PHÁP TÀI LIỆU (DOCUMENT AST PIPELINE)

> **Mã tài liệu:** ARCH-002  
> **Phân cấp ưu tiên:** **P0 (Critical — Bắt buộc trước khi code MVP)**  
> **Trạng thái:** Approved  
> **Cập nhật lần cuối:** 2026-09-05  

---

## 1. TỔNG QUAN VỀ KIẾN TRÚC AST TRONG DOCDRAFT AI

Trái tim của DOCDRAFT AI là bộ động cơ chuyển đổi cây cú pháp trừu tượng (Abstract Syntax Tree - AST). Hệ thống không lưu trữ tài liệu dưới dạng HTML hay Markdown thô, mà sử dụng **ProseMirror / Tiptap JSON AST làm nguồn chân lý duy nhất (Single Source of Truth)**.

Mô hình này đảm bảo tính nhất quán 100% khi chuyển đổi đa hướng giữa:
1. **Trình soạn thảo Web (Tiptap ProseMirror Canvas)**
2. **Tài liệu Microsoft Word OpenXML (`.docx`)**
3. **Bản in Vector PDF (Puppeteer Chromium)**
4. **Tệp Word nhập ngược lại hệ thống (`.docx` → AST)**

```
                  ┌─────────────────────────────────────────┐
                  │    TIPTAP PROSEMIRROR JSON (AST)        │
                  │       (Single Source of Truth)          │
                  └───────┬─────────────────────────▲───────┘
                          │                         │
            ┌─────────────┴─────────────┐           │ python-docx
            ▼                           ▼           │ Parser
  ┌───────────────────┐       ┌───────────────────┐ │
  │   OPENXML (.docx) │       │   VECTOR PDF      │ │
  │  python-docx SDK  │       │ Puppeteer/Chromium│ │
  │  Chuẩn NĐ 30/2020 │       │ WYSIWYG Print     │ │
  └───────────────────┘       └───────────────────┘ │
            │                                       │
            └───────────────────────────────────────┘
```

---

## 2. BẢNG ÁNH XẠ CỤ THỂ TỪ TIPTAP AST SANG OPENXML WORD

### 2.1. Ánh xạ các Node (Khối cấu trúc)

| Tiptap Node | Thẻ OpenXML tương ứng | Mô tả & Quy tắc xử lý thuộc tính |
|---|---|---|
| `doc` | `w:body` | Gốc tài liệu chứa toàn bộ các khối nội dung và section properties |
| `paragraph` | `w:p` | Khối đoạn văn. Hỗ trợ căn lề qua `w:jc` (`both`, `center`, `left`, `right`) |
| `heading` (level 1-3) | `w:p` + `w:pStyle` | Tiêu đề văn bản. Map sang Style chuẩn hoặc gán trực tiếp cỡ chữ qua `w:sz` |
| `bulletList` | `w:p` + `w:numPr` | Danh sách không thứ tự (Bullet point `w:numId` định nghĩa ký tự tròn) |
| `orderedList` | `w:p` + `w:numPr` | Danh sách có thứ tự (Đánh số 1, 2, 3... qua `w:numId`) |
| `listItem` | `w:p` | Một mục trong danh sách, kết hợp với thuộc tính danh sách cha |
| `table` | `w:tbl` | Bảng biểu. Thiết lập độ rộng cột cố định `w:gridCol` và `w:tblW` |
| `tableRow` | `w:tr` | Hàng trong bảng. Hỗ trợ thuộc tính lặp lại tiêu đề `w:tblHeader` nếu qua trang |
| `tableCell` | `w:tc` | Ô bảng. Chứa thuộc tính viền `w:tcBorders`, padding `w:tcMar` và độ rộng `w:tcW` |
| `blockquote` | `w:p` + `w:ind` | Khối trích dẫn: thụt lề trái 1.27cm (`w:left="720"`), in nghiêng toàn bộ |
| `hardBreak` | `w:br` | Ngắt dòng thủ công trong cùng một đoạn văn bản |
| `horizontalRule` | `w:p` + `w:pBdr/w:bottom` | Đường kẻ ngang ngăn cách nội dung |

### 2.2. Ánh xạ các Mark (Thuộc tính định dạng chữ)

| Tiptap Mark | Thẻ OpenXML tương ứng | Ví dụ cấu trúc XML |
|---|---|---|
| `bold` | `w:b` | `<w:r><w:rPr><w:b/></w:rPr><w:t>In đậm</w:t></w:r>` |
| `italic` | `w:i` | `<w:r><w:rPr><w:i/></w:rPr><w:t>In nghiêng</w:t></w:r>` |
| `underline` | `w:u` | `<w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>Gạch chân</w:t></w:r>` |
| `strike` | `w:strike` | `<w:r><w:rPr><w:strike/></w:rPr><w:t>Gạch ngang chữ</w:t></w:r>` |
| `textColor` | `w:color` | `<w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>Màu chữ</w:t></w:r>` |
| `textHighlight` | `w:highlight` | `<w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>[...]</w:t></w:r>` |

---

## 3. XỬ LÝ ĐẶC THÙ THỂ THỨC HÀNH CHÍNH VIỆT NAM (NGHỊ ĐỊNH 30/2020/NĐ-CP)

### 3.1. Cấu trúc Bảng ẩn 2 cột (Hidden 2-Column Tables)

Để đảm bảo văn bản hiển thị chuẩn xác trên mọi phiên bản Microsoft Word (từ Office 2013 đến Microsoft 365) mà không bị xô lệch lề hay vỡ dòng, hệ thống áp dụng kỹ thuật **Bảng 2 cột triệt tiêu viền (No-Border Table)** cho 2 vị trí quan trọng:

1. **Khối Tiêu ngữ & Quốc hiệu (Header Block):**
   * *Cột trái (40% bề rộng):* Tên cơ quan chủ quản, Đơn vị soạn thảo, Số và ký hiệu văn bản.
   * *Cột phải (60% bề rộng):* Dòng chữ "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", Tiêu ngữ "Độc lập - Tự do - Hạnh phúc", Địa danh và ngày tháng năm.
2. **Khối Nơi nhận & Chữ ký (Footer Block):**
   * *Cột trái (50% bề rộng):* Mục "Nơi nhận:", danh sách cơ quan/cá nhân nhận văn bản, nơi lưu trữ.
   * *Cột phải (50% bề rộng):* Chức danh người ký, chữ ký hình ảnh, họ và tên người ký.

**Quy tắc XML triệt tiêu đường viền:**
```xml
<w:tcPr>
  <w:tcBorders>
    <w:top w:val="none"/>
    <w:left w:val="none"/>
    <w:bottom w:val="none"/>
    <w:right w:val="none"/>
  </w:tcBorders>
</w:tcPr>
```

### 3.2. Căn lề trang giấy A4 chuẩn in ấn (Page Margins)

Quy định tại Mục II Phụ lục I Nghị định 30/2020/NĐ-CP:
* Lề trên (Top): 20 mm (`1134 dxa`)
* Lề dưới (Bottom): 20 mm (`1134 dxa`)
* Lề trái (Left): 30 mm (`1701 dxa`) — *Dành khoảng trống để bấm lỗ đóng gáy hồ sơ*
* Lề phải (Right): 15 mm (`850 dxa`)

**Cấu hình OpenXML `w:pgMar` trong `w:sectPr`:**
```xml
<w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701" w:header="708" w:footer="708" w:gutter="0"/>
```

### 3.3. Đường kẻ nét liền dưới Tiêu ngữ và Tên cơ quan

* Đường kẻ dưới Tiêu ngữ "Độc lập - Tự do - Hạnh phúc": Chiều dài bằng chiều dài của dòng chữ, nét liền mảnh.
* **Xử lý kỹ thuật:** Thay vì dùng chuỗi gạch ngang `───────` (dễ bị đứt đoạn hoặc thừa thiếu khi thay đổi cỡ chữ), `python-docx` tạo border dưới của đoạn văn bản với bề rộng căn chỉnh chính xác, hoặc vẽ hình chữ nhật (Drawing VML/DrawingML) có độ dày `0.5pt - 1pt`.

---

## 4. CHIẾN LƯỢC XỬ LÝ LỖI & DỰ PHÒNG (ERROR HANDLING & FALLBACK)

```
Node Tiptap đầu vào
       │
       ▼
Kiểm tra Schema hợp lệ? ──(KHÔNG)──▶ Chuyển thành Paragraph plain-text + Ghi log Warning
       │ (CÓ)
       ▼
Thẻ có hỗ trợ trong OpenXML? ──(KHÔNG)──▶ Trích xuất thẻ con (Flatten children)
       │ (CÓ)
       ▼
Render OpenXML thành công
```

1. **Gặp Node không xác định (Unknown Node):**
   * Hệ thống không làm gián đoạn (crash) tiến trình xuất file.
   * Node không hỗ trợ được tự động bóc tách text thuần và bọc trong một `paragraph` thông thường.
   * Ghi log cảnh báo vào hệ thống để kỹ sư bổ sung parser cho node đó.
2. **Phát hiện Bảng biểu phức tạp bị lồng nhau (Nested Tables):**
   * OpenXML hạn chế hiển thị bảng lồng nhau trên một số phiên bản Word cũ.
   * Parser tự động làm phẳng (flatten) bảng con thành text có phân cách tab nếu độ sâu lồng > 1.
3. **Ký tự lạ & Emoji không thuộc bảng mã UTF-8 thông dụng:**
   * Tự động lọc bỏ các ký tự điều khiển (Control Characters 0x00 - 0x1F ngoại trừ 0x09 Tab, 0x0A Line Feed, 0x0D Carriage Return) để tránh làm hỏng cấu trúc tệp XML của Word.

---

## 5. CƠ CHẾ BỘ ĐỆM XUẤT TỆP HIỆU NĂNG CAO (DOCUMENT EXPORT CACHING)

Với các tài liệu dài (20 - 50 trang), việc gọi Puppeteer hoặc `python-docx` liên tục sẽ tốn CPU. Hệ thống áp dụng cơ chế **Hash-based Cache**:

1. Trước khi render, Backend tính mã băm SHA-256 từ nội dung:
   $$\text{HashKey} = \text{SHA256}(\text{content\_json} + \text{export\_config} + \text{format})$$
2. Kiểm tra trên Cloudflare R2:
   * Nếu tệp `exports/{HashKey}.docx` đã tồn tại → Lấy trực tiếp tệp stream về cho client (Cache Hit, thời gian phản hồi < 100ms).
   * Nếu chưa có → Kích hoạt render mới, lưu bản sao lên R2, rồi trả về cho người dùng (Cache Miss).
