# ĐẶC TẢ CẤU TRÚC DỮ LIỆU JSONB (JSONB SCHEMA SPECIFICATIONS)

> **Mã tài liệu:** DATA-003  
> **Phân cấp ưu tiên:** **P2 (Medium — Mở rộng Phase 3–4)**  
> **Trạng thái:** Approved  
> **Áp dụng:** Các cột JSONB trong PostgreSQL: `content_json`, `form_schema`, `few_shot_examples`  
> **Cập nhật lần cuối:** 2026-09-05  

---

## 1. ĐẶC TẢ CỘT `content_json` (TIPTAP PROSEMIRROR AST)

Cột `content_json` trong bảng `document_drafts` và `draft_versions` là **nguồn chân lý duy nhất (Source of Truth)** của nội dung văn bản.

### 1.1. Cấu trúc JSON Schema gốc
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["type", "content"],
  "properties": {
    "type": { "type": "string", "enum": ["doc"] },
    "content": {
      "type": "array",
      "items": { "$ref": "#/definitions/ProseMirrorNode" }
    }
  },
  "definitions": {
    "ProseMirrorNode": {
      "type": "object",
      "required": ["type"],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "paragraph", "heading", "table", "tableRow", "tableCell",
            "bulletList", "orderedList", "listItem", "blockquote", "hardBreak", "text"
          ]
        },
        "attrs": { "type": "object" },
        "content": {
          "type": "array",
          "items": { "$ref": "#/definitions/ProseMirrorNode" }
        },
        "text": { "type": "string" },
        "marks": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["type"],
            "properties": {
              "type": { "type": "string", "enum": ["bold", "italic", "underline", "strike", "highlight", "textColor"] },
              "attrs": { "type": "object" }
            }
          }
        }
      }
    }
  }
}
```

---

## 2. ĐẶC TẢ CỘT `form_schema` (DYNAMIC FORM ENGINE)

Cột `form_schema` trong bảng `templates` định nghĩa cấu trúc giao diện biểu mẫu động cho người dùng nhập liệu, tự động biên dịch sang bộ kiểm thử Zod:

```json
{
  "fields": [
    {
      "name": "ten_co_quan",
      "label": "Tên cơ quan / Đơn vị soạn thảo",
      "type": "text",
      "required": true,
      "placeholder": "Vd: PHÒNG HÀNH CHÍNH - NHÂN SỰ",
      "validation": { "min_length": 3, "max_length": 150 }
    },
    {
      "name": "kinh_phi_du_toan",
      "label": "Dự toán kinh phí (VNĐ)",
      "type": "number",
      "required": true,
      "placeholder": "Vd: 150000000",
      "validation": { "min": 0 }
    },
    {
      "name": "loai_kinh_phi",
      "label": "Nguồn kinh phí",
      "type": "select",
      "required": true,
      "options": [
        { "value": "ngan_sach_cong_ty", "label": "Ngân sách công ty" },
        { "value": "cong_doan", "label": "Quỹ Công đoàn" }
      ]
    },
    {
      "name": "ngay_thuc_hien",
      "label": "Thời gian thực hiện dự kiến",
      "type": "date",
      "required": true
    },
    {
      "name": "ly_do_chi_tiet",
      "label": "Mục đích & Lý do chi tiết",
      "type": "textarea",
      "required": true,
      "placeholder": "Nêu rõ sự cần thiết của việc đề xuất...",
      "validation": { "min_length": 20 }
    }
  ]
}
```

---

## 3. ĐẶC TẢ CỘT `few_shot_examples` (VÍ DỤ MẪU HỌC TẬP)

Cột `few_shot_examples` lưu mảng các cặp ví dụ mẫu được tiêm vào prompt:

```json
[
  {
    "description": "Ví dụ mẫu Tờ trình chuẩn xin kinh phí",
    "input": {
      "ten_co_quan": "UBND QUẬN THỦ ĐỨC",
      "don_vi_soan": "Phòng Giáo dục và Đào tạo",
      "trich_yeu": "Xin kinh phí tổ chức hội thi",
      "kinh_phi_du_toan": "150.000.000 đồng"
    },
    "output_html": "<table style=\"width:100%; border:none;\">...</table><h2>TỜ TRÌNH</h2>..."
  }
]
```
