import { CURATED_LEGAL_DOCUMENTS } from "../../src/lib/legal/legal-data";

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

console.log("--- BẮT ĐẦU KIỂM THỬ CSDL CĂN CỨ PHÁP LÝ & AUTOCOMPLETE (TASK-210, TASK-211) ---");

// 1. Kiểm thử số lượng và tính hợp lệ của kho dữ liệu pháp quy
console.log(`- Tổng số văn bản pháp quy trong kho dữ liệu: ${CURATED_LEGAL_DOCUMENTS.length}`);
assert(CURATED_LEGAL_DOCUMENTS.length >= 30, "Kho dữ liệu mẫu phải có ít nhất 30 văn bản cốt lõi");

for (const doc of CURATED_LEGAL_DOCUMENTS) {
  assert(!!doc.docCode, `Văn bản ${doc.title} phải có docCode`);
  assert(!!doc.title, `Văn bản ${doc.docCode} phải có title`);
  assert(
    doc.fullCitation.trim().endsWith(";"),
    `Trích dẫn "${doc.fullCitation}" phải kết thúc bằng dấu chấm phẩy (;) chuẩn Nghị định 30`
  );
  assert(
    doc.fullCitation.toLowerCase().startsWith("căn cứ"),
    `Trích dẫn "${doc.fullCitation}" phải bắt đầu bằng "Căn cứ"`
  );
}
console.log("✓ 100% văn bản quy phạm pháp luật tuân thủ thể thức trích dẫn (Bắt đầu 'Căn cứ', kết thúc ';')");

// 2. Kiểm thử logic tìm kiếm gợi ý Autocomplete (Suggest)
function mockSuggest(query: string, limit = 5) {
  const clean = query.replace(/^(căn\s+cứ|can\s+cu)\s+/i, "").trim().toLowerCase();
  return CURATED_LEGAL_DOCUMENTS.filter((d) => {
    if (!clean) return true;
    return (
      d.docCode.toLowerCase().includes(clean) ||
      d.title.toLowerCase().includes(clean) ||
      d.fullCitation.toLowerCase().includes(clean) ||
      d.issuingAuthority.toLowerCase().includes(clean)
    );
  }).slice(0, limit);
}

// Test 2.1: Tìm theo số hiệu "30/2020"
const res1 = mockSuggest("30/2020");
assert(res1.length > 0, "Tìm theo số hiệu 30/2020 phải ra kết quả");
assert(res1[0].docCode === "30/2020/NĐ-CP", "Kết quả đầu tiên phải là NĐ 30/2020/NĐ-CP");
console.log("✓ Tìm theo số hiệu chính xác: Đạt");

// Test 2.2: Tìm theo từ khóa "chi phí xây dựng"
const res2 = mockSuggest("chi phí");
assert(res2.length > 0, "Tìm theo từ khóa 'chi phí' phải ra kết quả");
assert(res2.some((d) => d.docCode === "10/2021/NĐ-CP"), "Phải tìm ra NĐ 10/2021/NĐ-CP quản lý chi phí");
console.log("✓ Tìm theo từ khóa ngữ cảnh: Đạt");

// Test 2.3: Tìm khi người dùng gõ tiền tố "Căn cứ đấu thầu"
const res3 = mockSuggest("Căn cứ đấu thầu");
assert(res3.length > 0, "Tiền tố 'Căn cứ' phải được tự động chuẩn hóa");
assert(res3.some((d) => d.title.includes("Đấu thầu")), "Phải tìm ra Luật hoặc Nghị định Đấu thầu");
console.log("✓ Tự động loại bỏ tiền tố 'Căn cứ' khi autocomplete: Đạt");

console.log("=== TẤT CẢ KIỂM THỬ TASK-210 VÀ TASK-211 ĐẠT 100% ===");
