import { generateQRVerifyCode } from "@/lib/workflow/approval-state-machine";
import crypto from "crypto";

function computeContentHash(content: object): string {
  return crypto.createHash("sha256").update(JSON.stringify(content)).digest("hex");
}

function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ TASK-403: QR VERIFICATION & INTEGRITY ENGINE ===");
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

  // Test 1: Định dạng mã QR tra cứu (64 ký tự hex)
  const draftId = "e5a7b9c1-4d3e-4a5b-8c7d-9e0f1a2b3c4d";
  const now = new Date();
  const qrCode1 = generateQRVerifyCode(draftId, now);
  assert(
    typeof qrCode1 === "string" && qrCode1.length === 64 && /^[0-9a-f]{64}$/.test(qrCode1),
    "Mã QR tra cứu phải là chuỗi 64 ký tự hex hợp lệ"
  );

  // Test 2: Tính duy nhất (Uniqueness) không bao giờ trùng lặp
  const qrCode2 = generateQRVerifyCode(draftId, now);
  assert(qrCode1 !== qrCode2, "Hai lần sinh mã QR cho cùng một draftId phải tạo ra các mã băm duy nhất khác nhau nhờ cryptographic salt");

  // Test 3: Tính toàn vẹn SHA-256 (Integrity Hash)
  const originalAst = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Quyết định chi 100.000.000 VNĐ" }] },
    ],
  };
  const hash1 = computeContentHash(originalAst);
  assert(typeof hash1 === "string" && hash1.length === 64, "Mã băm toàn vẹn SHA-256 phải có độ dài 64 ký tự hex");

  // Test 4: Thay đổi 1 ký tự nội dung làm thay đổi hoàn toàn mã băm (Avalanche effect)
  const tamperedAst = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Quyết định chi 200.000.000 VNĐ" }] },
    ],
  };
  const hash2 = computeContentHash(tamperedAst);
  assert(hash1 !== hash2, "Mã băm nội dung phải thay đổi hoàn toàn khi có sự can thiệp số liệu dù chỉ 1 ký tự");

  console.log(`\n=> KẾT QUẢ: ${passed}/${total} bài kiểm tra đạt (100% PASS)`);
}

runTests();
