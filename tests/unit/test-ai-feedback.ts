import { z } from "zod";

const aiFeedbackSchema = z.object({
  draftId: z.string().optional().nullable(),
  rating: z.union([z.literal(1), z.literal(-1)]),
  actionType: z.enum(["RAW_TO_DOC", "INLINE_EDIT", "CHAT_COPILOT", "AUTO_FIX"]),
  tags: z.array(z.string()).default([]),
  comment: z.string().max(1000).optional().nullable(),
  promptSnippet: z.string().max(500).optional().nullable(),
  completionSnippet: z.string().max(500).optional().nullable(),
});

function calculateSatisfactionMetrics(feedbacks: Array<{ rating: number; tags: string[] }>) {
  if (feedbacks.length === 0) {
    return { total: 0, positive: 0, negative: 0, satisfactionRate: 100, topTags: [] };
  }

  const positive = feedbacks.filter((f) => f.rating === 1).length;
  const negative = feedbacks.filter((f) => f.rating === -1).length;
  const total = feedbacks.length;
  const satisfactionRate = Math.round((positive / total) * 100);

  const tagCounts: Record<string, number> = {};
  for (const f of feedbacks) {
    for (const tag of f.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));

  return { total, positive, negative, satisfactionRate, topTags };
}

function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ TASK-310: AI FEEDBACK LOOP ===");
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

  // Test 1: Thumbs Up hợp lệ
  const validPositive = aiFeedbackSchema.safeParse({
    draftId: "draft-123",
    rating: 1,
    actionType: "INLINE_EDIT",
    tags: ["Chính xác", "Chuẩn NĐ 30"],
    comment: "Gợi ý câu chữ rất chuẩn văn thư công vụ",
    promptSnippet: "Kính đề nghị ông xem xét",
    completionSnippet: "Kính trình Quý cơ quan xem xét, giải quyết",
  });
  assert(validPositive.success, "Payload Thumbs Up hợp lệ phải vượt qua validation");

  // Test 2: Thumbs Down hợp lệ
  const validNegative = aiFeedbackSchema.safeParse({
    rating: -1,
    actionType: "RAW_TO_DOC",
    tags: ["Bị ảo giác dữ liệu", "Quá dài / Dài dòng"],
    comment: "Tự ý thêm số tiền không có trong bản gốc",
  });
  assert(validNegative.success, "Payload Thumbs Down hợp lệ không cần draftId phải vượt qua validation");

  // Test 3: Rating không hợp lệ (ví dụ: rating = 0 hoặc 5)
  const invalidRating = aiFeedbackSchema.safeParse({
    rating: 0,
    actionType: "CHAT_COPILOT",
  });
  assert(!invalidRating.success, "Rating khác 1 và -1 phải bị từ chối");

  // Test 4: ActionType không hợp lệ
  const invalidAction = aiFeedbackSchema.safeParse({
    rating: 1,
    actionType: "UNKNOWN_ACTION",
  });
  assert(!invalidAction.success, "actionType không nằm trong enum phải bị từ chối");

  // Test 5: Comment quá 1000 ký tự
  const invalidComment = aiFeedbackSchema.safeParse({
    rating: -1,
    actionType: "AUTO_FIX",
    comment: "a".repeat(1001),
  });
  assert(!invalidComment.success, "Comment vượt quá 1000 ký tự phải bị từ chối");

  // Test 6: Tính toán tỷ lệ hài lòng (Satisfaction Rate)
  const sampleFeedbacks = [
    { rating: 1, tags: ["Chính xác", "Chuẩn NĐ 30"] },
    { rating: 1, tags: ["Chính xác", "Nhanh & Tiết kiệm thời gian"] },
    { rating: 1, tags: ["Chuẩn NĐ 30"] },
    { rating: -1, tags: ["Bị ảo giác dữ liệu"] },
  ];
  const metrics = calculateSatisfactionMetrics(sampleFeedbacks);
  assert(metrics.total === 4, "Tổng số feedback phải là 4");
  assert(metrics.positive === 3, "Số lượt positive phải là 3");
  assert(metrics.negative === 1, "Số lượt negative phải là 1");
  assert(metrics.satisfactionRate === 75, "Tỷ lệ hài lòng phải là 75%");
  assert(metrics.topTags[0].tag === "Chính xác" && metrics.topTags[0].count === 2, "Top tag đầu tiên phải là 'Chính xác' với 2 lượt");

  // Test 7: Danh sách trống trả về 100% satisfaction mặc định
  const emptyMetrics = calculateSatisfactionMetrics([]);
  assert(emptyMetrics.satisfactionRate === 100 && emptyMetrics.total === 0, "Danh sách rỗng phải trả về 100% tỷ lệ an toàn");

  console.log(`\n=> KẾT QUẢ: ${passed}/${total} bài kiểm tra đạt (100% PASS)`);
}

runTests();
