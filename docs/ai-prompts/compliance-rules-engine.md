# BỘ LUẬT KIỂM TRA THỂ THỨC VĂN BẢN THEO NGHỊ ĐỊNH 30/2020/NĐ-CP (COMPLIANCE RULES ENGINE)

> **Mã tài liệu:** AI-002  
> **Phân cấp ưu tiên:** **P1 (High — Hoàn thiện Core Engines Phase 1–2)**  
> **Trạng thái:** Approved  
> **Áp dụng:** Tính năng "Kiểm tra thể thức" & "Tự động sửa lỗi (Auto-fix)"  
> **Cập nhật lần cuối:** 2026-09-05  

---

## 1. KIẾN TRÚC ĐỘNG CƠ KIỂM TOÁN THỂ THỨC (TWO-TIER VALIDATOR)

Hệ thống soát lỗi của DOCDRAFT AI áp dụng mô hình **Kiểm định 2 tầng (Two-Tier Validation)** để tối ưu giữa tốc độ, độ chính xác và chi phí:

```
Văn bản (Tiptap JSON AST)
          │
          ▼
┌────────────────────────────────────────────────────────┐
│ TẦNG 1: BỘ SOÁT LỖI QUY TẮC CỐ ĐỊNH (RULE-BASED ENGINE)│
│  - Tốc độ: < 50ms, Chạy trực tiếp tại Client / API     │
│  - Duyệt cây AST + Biểu thức chính quy (Regex)         │
│  - Soát: Quốc hiệu, Tiêu ngữ, Căn cứ (;), Dấu gạch     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ TẦNG 2: BỘ SOÁT LỖI NGỮ CẢNH BẰNG AI (AI VALIDATOR)    │
│  - Gọi LLM phân tích văn phong công vụ, logic pháp lý  │
│  - Đánh giá sự tương thích giữa Trích yếu và Nội dung  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
              BÁO CÁO THỂ THỨC & AUTO-FIX
```

---

## 2. BẢNG 7 TIÊU CHÍ KIỂM TRA THỂ THỨC CHUẨN NĐ 30/2020

| Mã luật | Hạng mục kiểm tra | Chi tiết kiểm tra & Thuật toán | Mức độ | Khả năng Auto-fix |
|---|---|---|---|---|
| **RULE_01** | **Quốc hiệu & Tiêu ngữ** | Phải có cụm `"CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"` (in hoa đậm) và `"Độc lập - Tự do - Hạnh phúc"` (chữ hoa đầu, đậm). Có đường gạch ngang liền dưới. | ❌ Error | ✅ 1-Click Fix (Thay bằng block chuẩn) |
| **RULE_02** | **Tên cơ quan & Số ký hiệu** | Phải có tên cơ quan ban hành (in hoa) và định dạng số: `Số: [0-9]+/([A-ZĐ]+)-([A-Z0-9]+)`. | ❌ Error | ⚠️ Cảnh báo điền số |
| **RULE_03** | **Trích yếu nội dung** | Nằm dưới tên loại văn bản, in nghiêng, căn giữa. Không dài quá 5 dòng. | ⚠️ Warning | ✅ 1-Click Fix (Căn giữa + In nghiêng) |
| **RULE_04** | **Cú pháp Căn cứ pháp lý** | Mọi dòng căn cứ bắt đầu bằng `"Căn cứ"`, các dòng trên kết thúc bằng dấu chấm phẩy `;`, dòng cuối cùng kết thúc bằng dấu phẩy `,`. | ⚠️ Warning | ✅ 1-Click Fix (Tự động đổi dấu câu) |
| **RULE_05** | **Khối Nơi nhận & Chữ ký** | Góc trái: `"Nơi nhận:"` (in nghiêng, đậm), có các gạch đầu dòng, dòng cuối là `"- Lưu: VT..."`. Góc phải: có chức danh và họ tên. | ❌ Error | ✅ 1-Click Fix (Chuẩn hóa khối nơi nhận) |
| **RULE_06** | **Placeholder tồn đọng** | Quét Regex `\[[A-ZÀ-Ỹ0-9\s_]+\]`. Phát hiện còn thông tin chưa điền (vd: `[SỐ TIỀN CỤ THỂ]`). | ❌ Error | ❌ Bắt buộc người dùng nhập |
| **RULE_07** | **Quy chuẩn Font & Căn lề** | Toàn bộ văn bản phải dùng font Times New Roman; cỡ chữ nội dung 13-14pt; căn đều 2 bên (justify). | ℹ️ Info | ✅ 1-Click Fix (Format lại AST) |

---

## 3. CÔNG THỨC CHẤM ĐIỂM TUÂN THỦ (COMPLIANCE SCORE)

Điểm tuân thủ tính trên thang điểm 100 theo công thức trừ lùi:
$$\text{Score} = 100 - (\text{Số lỗi Error} \times 20) - (\text{Số lỗi Warning} \times 10) - (\text{Số lỗi Info} \times 5)$$

* **90 – 100 điểm:** Thể thức Xuất sắc (Đủ điều kiện ban hành / trình ký).
* **70 – 89 điểm:** Thể thức Khá (Cần xem xét các điểm Warning).
* **< 70 điểm:** Không đạt (Bắt buộc sửa các lỗi Error trước khi xuất bản hoặc nộp trình ký).

---

## 4. THUẬT TOÁN TỰ ĐỘNG SỬA LỖI (AUTO-FIX ALGORITHM)

Khi người dùng bấm nút **"Sửa tự động tất cả"**, hệ thống duyệt cây Tiptap JSON AST và áp dụng các biến đổi:

```typescript
export function autoFixComplianceAST(contentJson: any): { fixedAst: any; fixesApplied: string[] } {
  const fixes: string[] = [];
  const clonedAst = JSON.parse(JSON.stringify(contentJson));

  // 1. Tự động sửa dấu câu của các dòng "Căn cứ..."
  const legalNodes = findParagraphsStartingWith(clonedAst, 'Căn cứ');
  legalNodes.forEach((node, index) => {
    const isLast = index === legalNodes.length - 1;
    const text = getNodeText(node).trim();
    const cleanText = text.replace(/[;,.]$/, '');
    
    if (isLast && !text.endsWith(',')) {
      setNodeText(node, cleanText + ',');
      fixes.push('Đã đổi dấu kết thúc dòng căn cứ cuối thành dấu phẩy (,)');
    } else if (!isLast && !text.endsWith(';')) {
      setNodeText(node, cleanText + ';');
      fixes.push('Đã đổi dấu kết thúc dòng căn cứ thành dấu chấm phẩy (;)');
    }
  });

  // 2. Tự động căn giữa và in nghiêng trích yếu văn bản
  const trichYeuNode = findTrichYeuParagraph(clonedAst);
  if (trichYeuNode) {
    trichYeuNode.attrs = { ...trichYeuNode.attrs, textAlign: 'center' };
    addMarkToNode(trichYeuNode, { type: 'italic' });
    fixes.push('Đã căn giữa và in nghiêng phần trích yếu nội dung');
  }

  // 3. Tự động bổ sung dòng lưu trữ "- Lưu: VT..." nếu thiếu
  const noiNhanNode = findNoiNhanNode(clonedAst);
  if (noiNhanNode && !hasLuuVanThu(noiNhanNode)) {
    appendLuuVanThu(noiNhanNode);
    fixes.push('Đã bổ sung dòng "- Lưu: VT." vào mục Nơi nhận');
  }

  return { fixedAst: clonedAst, fixesApplied: fixes };
}
```
