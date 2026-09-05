import assert from "node:assert";
import {
  BilingualEngine,
  bilingualGenerateSchema,
  BilingualGenerateInput,
  BilingualClause,
} from "../../src/lib/ai/bilingual-engine";

console.log("=== BẮT ĐẦU KIỂM THỬ TASK-410: BILINGUAL MODE ANH - VIỆT ===");

// 1. Kiểm tra Schema Validation
const sampleInput: BilingualGenerateInput = {
  contractType: "NDA",
  titleVi: "Thỏa thuận bảo mật thông tin",
  titleEn: "Non-Disclosure Agreement",
  partyA: {
    nameVi: "Công ty Cổ phần Công nghệ DocDraft AI",
    nameEn: "DocDraft AI Technology Joint Stock Company",
    addressVi: "Tầng 15, Tòa nhà Keangnam, Cầu Giấy, Hà Nội",
    addressEn: "15th Floor, Keangnam Landmark Tower, Cau Giay, Hanoi",
    representativeVi: "Ông Nguyễn Văn An",
    representativeEn: "Mr. Nguyen Van An",
    positionVi: "Tổng Giám đốc",
    positionEn: "General Director",
    taxCode: "0109988776",
  },
  partyB: {
    nameVi: "Công ty TNHH Giải pháp Đám mây Toàn cầu",
    nameEn: "Global Cloud Solutions Co., Ltd.",
    addressVi: "Quận 1, TP. Hồ Chí Minh",
    addressEn: "District 1, Ho Chi Minh City",
    representativeVi: "Bà Jennifer Smith",
    representativeEn: "Ms. Jennifer Smith",
    positionVi: "Giám đốc Vận hành",
    positionEn: "Chief Operating Officer",
  },
  scopeVi: "Bảo mật toàn bộ thông tin mã nguồn, thuật toán AI và dữ liệu khách hàng.",
  scopeEn: "Protect all source code, AI algorithms, and proprietary customer data.",
  effectiveDate: "2026-09-05",
  durationMonths: 24,
  prevailingLanguage: "VIETNAMESE",
  disputeResolutionVi: "Giải quyết tại VIAC",
  disputeResolutionEn: "Settled at VIAC",
  preferredProvider: "deepseek",
};

const validationResult = bilingualGenerateSchema.safeParse(sampleInput);
assert.strictEqual(validationResult.success, true, "Payload hợp đồng song ngữ phải hợp lệ");
console.log("  ✓ PASS: Schema xác thực dữ liệu hợp đồng song ngữ hợp lệ");

// 2. Kiểm tra bắt lỗi khi thiếu thông tin bên ký
const invalidInput = {
  ...sampleInput,
  partyA: {
    ...sampleInput.partyA,
    representativeVi: "", // để trống
  },
};
const invalidResult = bilingualGenerateSchema.safeParse(invalidInput);
assert.strictEqual(invalidResult.success, false, "Thiếu đại diện bên A phải bị từ chối");
console.log("  ✓ PASS: Dữ liệu thiếu thông tin đại diện bị từ chối chính xác");

// 3. Kiểm tra Build Prompt
const prompt = BilingualEngine.buildPrompt(sampleInput);
assert.ok(prompt.includes("DocDraft AI"), "Prompt phải chứa tên Bên A");
assert.ok(prompt.includes("Jennifer Smith"), "Prompt phải chứa đại diện Bên B");
assert.ok(
  prompt.includes("Ngôn ngữ tiếng Việt được ưu tiên"),
  "Prompt phải chứa quy định ngôn ngữ ưu tiên"
);
console.log("  ✓ PASS: buildPrompt tổng hợp đầy đủ thông tin hai bên và điều khoản ưu tiên");

// 4. Kiểm tra render bảng HTML song ngữ 2 cột
const testClauses: BilingualClause[] = [
  {
    articleNumber: 1,
    titleVi: "Định nghĩa và Giải thích từ ngữ",
    titleEn: "Definitions and Interpretation",
    contentVi: "Thông tin bảo mật bao gồm toàn bộ dữ liệu kỹ thuật, bí mật kinh doanh và thuật toán phần mềm.",
    contentEn: "Confidential Information includes all technical data, trade secrets, and software algorithms.",
  },
  {
    articleNumber: 2,
    titleVi: "Nghĩa vụ bảo mật",
    titleEn: "Confidentiality Obligations",
    contentVi: "Bên Nhận cam kết không tiết lộ thông tin bảo mật cho bất kỳ bên thứ ba nào khi chưa có văn bản đồng ý.",
    contentEn: "The Receiving Party undertakes not to disclose Confidential Information to any third party without prior written consent.",
  },
];

const renderedHtml = BilingualEngine.renderBilingualTable(testClauses);
assert.ok(renderedHtml.includes("<table class=\"bilingual-table\""), "HTML phải chứa bảng song ngữ");
assert.ok(renderedHtml.includes("TIẾNG VIỆT (VIETNAMESE)"), "HTML phải có tiêu đề cột tiếng Việt");
assert.ok(renderedHtml.includes("TIẾNG ANH (ENGLISH)"), "HTML phải có tiêu đề cột tiếng Anh");
assert.ok(renderedHtml.includes("width:50%"), "Cột phải chia tỉ lệ 50/50 chuẩn");
assert.ok(renderedHtml.includes("Điều 1. Định nghĩa và Giải thích từ ngữ"), "Bản tiếng Việt phải có Điều 1");
assert.ok(renderedHtml.includes("Article 1. Definitions and Interpretation"), "Bản tiếng Anh phải có Article 1");
console.log("  ✓ PASS: renderBilingualTable tạo bảng 2 cột đối ứng chuẩn ngữ nghĩa");

// 5. Kiểm tra Tiptap AST Generation từ Clauses
const ast = BilingualEngine.generateTiptapAstFromClauses(
  sampleInput.titleVi,
  sampleInput.titleEn,
  testClauses
);
assert.strictEqual(ast.type, "doc", "Root AST phải có type là doc");
assert.strictEqual(ast.content.length, 2, "AST phải gồm 1 tiêu đề heading và 1 table");
assert.strictEqual(ast.content[1].type, "table", "Node thứ 2 trong AST phải là table");
assert.strictEqual(ast.content[1].attrs.isBilingual, true, "Bảng phải có thuộc tính isBilingual=true");
console.log("  ✓ PASS: generateTiptapAstFromClauses tạo đúng cấu trúc Tiptap AST 2 cột");

console.log("\n=> KẾT QUẢ: 5/5 bài kiểm tra đạt (100% PASS)\n");
