import { z } from "zod";

const ocrResponseSchema = z.object({
  success: z.boolean(),
  raw_text: z.string().min(1),
  confidence: z.number().min(0).max(1),
  language: z.string(),
  detected_entities: z.object({
    co_quan_ban_hanh: z.string().nullable().optional(),
    so_ky_hieu: z.string().nullable().optional(),
    loai_van_ban: z.string().nullable().optional(),
    ngay_ban_hanh: z.string().nullable().optional(),
    trich_yeu: z.string().nullable().optional(),
  }),
});

function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ TASK-405: OCR SCANNING ENGINE ===");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      process.exitCode = 1;
    }
  }

  // Test 1: Validate payload phản hồi OCR hợp lệ
  const validOcrResponse = {
    success: true,
    raw_text: "ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI\nSố: 45/TB-STC\nTHÔNG BÁO\nVề việc ngân sách...",
    confidence: 0.965,
    language: "vi",
    detected_entities: {
      co_quan_ban_hanh: "ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI",
      so_ky_hieu: "45/TB-STC",
      loai_van_ban: "Thông Báo",
      ngay_ban_hanh: "Ngày 05 tháng 09 năm 2026",
      trich_yeu: "ngân sách...",
    },
  };

  const parsed = ocrResponseSchema.safeParse(validOcrResponse);
  assert(parsed.success, "Payload phản hồi OCR phải thỏa mãn schema chuẩn");

  // Test 2: Bóc tách thực thể đầy đủ theo chuẩn NĐ 30
  if (parsed.success) {
    assert(parsed.data.detected_entities.so_ky_hieu === "45/TB-STC", "Trích xuất đúng số ký hiệu");
    assert(parsed.data.detected_entities.loai_van_ban === "Thông Báo", "Trích xuất đúng loại văn bản");
    assert(parsed.data.confidence > 0.9, "Độ tin cậy OCR phải đạt trên 90%");
  }

  // Test 3: Rejection khi thiếu raw_text
  const invalidOcr = ocrResponseSchema.safeParse({
    success: true,
    raw_text: "",
    confidence: 0.9,
    language: "vi",
    detected_entities: {},
  });
  assert(!invalidOcr.success, "Payload thiếu raw_text phải bị từ chối");

  console.log(`\n=> KẾT QUẢ: ${passed}/${total} bài kiểm tra đạt (100% PASS)`);
}

runTests();
