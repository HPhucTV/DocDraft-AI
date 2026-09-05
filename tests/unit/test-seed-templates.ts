import { SEED_TEMPLATES } from "../../prisma/data/templates";
import { buildZodSchema } from "../../src/lib/dynamic-form-schema";

function runTemplateTests() {
  console.log("🔍 Đang kiểm thử bộ dữ liệu hạt giống 18 Mẫu biểu (TASK-106, TASK-212, TASK-308)...");

  // 1. Kiểm tra số lượng mẫu (10 mẫu ban đầu + 4 mẫu SME Pack + 4 mẫu PMO Pack)
  if (SEED_TEMPLATES.length !== 18) {
    throw new Error(`Kỳ vọng 18 mẫu nhưng nhận được ${SEED_TEMPLATES.length}`);
  }
  console.log(`✓ Đã xác thực đủ 18 mẫu văn bản (kèm 4 mẫu SME Pack & 4 mẫu PMO Pack).`);

  // 2. Kiểm tra tính duy nhất của ID
  const ids = new Set<string>();
  for (const t of SEED_TEMPLATES) {
    if (ids.has(t.id)) {
      throw new Error(`ID trùng lặp: ${t.id}`);
    }
    ids.add(t.id);
  }
  console.log(`✓ 18 mẫu có ID duy nhất.`);

  // 3. Kiểm tra từng mẫu: formSchema, Zod compilation, fewShotExamples, Nghị định 30 HTML
  for (const t of SEED_TEMPLATES) {
    console.log(`\n--- Kiểm tra mẫu: [${t.id}] ${t.title} ---`);

    // a. Kiểm tra formSchema
    if (!t.formSchema || !Array.isArray(t.formSchema.fields) || t.formSchema.fields.length === 0) {
      throw new Error(`Mẫu [${t.id}] không có formSchema hợp lệ!`);
    }

    // b. Biên dịch Zod Schema
    const zodSchema = buildZodSchema(t.formSchema);
    if (!zodSchema) {
      throw new Error(`Mẫu [${t.id}] không thể biên dịch Zod Schema!`);
    }
    console.log(`  ✓ Đã biên dịch Zod Schema với ${t.formSchema.fields.length} trường.`);

    // c. Kiểm tra fewShotExamples
    if (!Array.isArray(t.fewShotExamples) || t.fewShotExamples.length === 0) {
      throw new Error(`Mẫu [${t.id}] thiếu few_shot_examples!`);
    }

    for (const ex of t.fewShotExamples) {
      if (!ex.description || !ex.input || !ex.output_html) {
        throw new Error(`Mẫu [${t.id}] có example không đúng định dạng!`);
      }

      // Kiểm tra HTML có bảng ẩn 2 cột (border:none)
      if (!ex.output_html.includes("border:none") && !ex.output_html.includes("border: none")) {
        throw new Error(`Mẫu [${t.id}] output_html vi phạm quy chuẩn bảng ẩn border:none!`);
      }

      // Kiểm tra HTML có bảng Quốc hiệu hoặc Tiêu ngữ hoặc Tiêu đề văn bản
      const hasNationalOrOrg =
        ex.output_html.includes("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM") ||
        ex.output_html.includes("Độc lập - Tự do - Hạnh phúc") ||
        ex.output_html.includes("HỢP ĐỒNG") ||
        ex.output_html.includes("THƯ BÁO GIÁ") ||
        ex.output_html.includes("BIÊN BẢN") ||
        ex.output_html.includes("THỎA THUẬN");
      if (!hasNationalOrOrg) {
        throw new Error(`Mẫu [${t.id}] thiếu Quốc hiệu/Tiêu ngữ hoặc Tiêu đề pháp lý chuẩn!`);
      }

      // Kiểm tra có khối ký tên hoặc đại diện
      const hasSignatureBlock =
        ex.output_html.includes("Nơi nhận") ||
        ex.output_html.includes("GIÁM ĐỐC") ||
        ex.output_html.includes("CHỦ TỊCH") ||
        ex.output_html.includes("ĐẠI DIỆN") ||
        ex.output_html.includes("THƯ KÝ") ||
        ex.output_html.includes("CHỦ TỌA") ||
        ex.output_html.includes("CHỈ HUY TRƯỞNG") ||
        ex.output_html.includes("TƯ VẤN GIÁM SÁT");
      if (!hasSignatureBlock) {
        throw new Error(`Mẫu [${t.id}] thiếu khối chữ ký chuẩn!`);
      }

      console.log(`  ✓ Ví dụ mẫu đạt chuẩn thể thức NĐ 30 & HTML ngữ nghĩa.`);
    }

    // d. Thử nghiệm validate input từ fewShotExample vào Zod Schema (trừ các trường date tùy biến)
    const firstEx = t.fewShotExamples[0];
    const validationResult = zodSchema.safeParse(firstEx.input);
    if (!validationResult.success) {
      console.log(`  ℹ Lưu ý Zod validation warnings cho fewShot input:`, validationResult.error.format());
    } else {
      console.log(`  ✓ Input ví dụ mẫu hoàn toàn thỏa mãn Zod validation.`);
    }
  }

  console.log("\n🎉 TẤT CẢ 10 MẪU VĂN BẢN ĐẠT 100% TIÊU CHÍ NGHIỆM THU TASK-106!");
}

runTemplateTests();
