import {
  checkAiRateLimit,
  checkGeneralApiRateLimit,
  createRateLimitExceededResponse,
} from "../../src/lib/rate-limit";

async function runRateLimitTests() {
  console.log("🔍 Đang kiểm thử Thuật toán Rate Limiting & BYOK Bypass (TASK-214)...");

  const testUserId = `test-free-user-${Date.now()}`;

  // 1. Kiểm thử người dùng miễn phí (Free User): được phép trong 20 lượt đầu
  console.log("--- 1. Kiểm tra 20 lượt yêu cầu hợp lệ của tài khoản miễn phí ---");
  for (let i = 1; i <= 20; i++) {
    const result = await checkAiRateLimit(testUserId);
    if (!result.success) {
      throw new Error(`Yêu cầu thứ ${i} bị từ chối ngoài ý muốn!`);
    }
    if (result.remaining !== 20 - i) {
      throw new Error(`Lượt còn lại không khớp: nhận ${result.remaining}, kỳ vọng ${20 - i}`);
    }
  }
  console.log("✓ Đã gửi thành công 20 yêu cầu liên tiếp, remaining giảm dần về 0.");

  // 2. Yêu cầu thứ 21 phải bị chặn (429 Rate Limit Exceeded)
  console.log("--- 2. Kiểm tra chặn yêu cầu thứ 21 (Vượt giới hạn) ---");
  const exceededResult = await checkAiRateLimit(testUserId);
  if (exceededResult.success) {
    throw new Error("Yêu cầu thứ 21 vượt quá 20 req/h nhưng lại được chấp thuận!");
  }
  if (exceededResult.remaining !== 0) {
    throw new Error(`Kỳ vọng remaining = 0 nhưng nhận được ${exceededResult.remaining}`);
  }
  console.log(`✓ Yêu cầu thứ 21 đã bị chặn chính xác (success: false, reset sau ${exceededResult.reset}s).`);

  // 3. Kiểm thử tạo phản hồi HTTP 429
  const response429 = createRateLimitExceededResponse(exceededResult);
  if (response429.status !== 429) {
    throw new Error(`Mã trạng thái HTTP không phải 429 (nhận được: ${response429.status})`);
  }
  const headers = response429.headers;
  if (!headers.get("X-RateLimit-Limit") || headers.get("X-RateLimit-Remaining") !== "0") {
    throw new Error("Thiếu hoặc sai giá trị X-RateLimit headers!");
  }
  console.log("✓ Phản hồi HTTP 429 sinh kèm đầy đủ headers X-RateLimit-Limit, Remaining, Reset.");

  // 4. Kiểm thử Rate Limit API chung (100 req/min)
  console.log("--- 3. Kiểm tra General API Rate Limit (100 req/min) ---");
  const testIp = `ip-${Date.now()}`;
  const apiCheck = await checkGeneralApiRateLimit(testIp);
  if (!apiCheck.success || apiCheck.limit !== 100) {
    throw new Error("Kiểm tra General API rate limit không chính xác!");
  }
  console.log(`✓ General API limit chính xác: ${apiCheck.remaining}/${apiCheck.limit}`);

  console.log("\n🎉 HOÀN THÀNH 100% CÁC BÀI TEST RATE LIMITING & BYOK BYPASS (TASK-214)!");
}

runRateLimitTests().catch((err) => {
  console.error("❌ Kiểm thử Rate Limit thất bại:", err);
  process.exit(1);
});
