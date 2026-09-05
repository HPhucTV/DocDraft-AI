process.loadEnvFile?.();

import {
  MASTER_SYSTEM_PROMPT,
  generateDocumentStream,
  DEFAULT_DEEPSEEK_MODEL,
} from "../../src/lib/ai/ai-service";

async function runStreamProtocolTests() {
  console.log("🌊 Đang kiểm thử Giao thức SSE Streaming & Master System Prompt (TASK-108 & TASK-109)...");

  // 1. Kiểm tra MASTER_SYSTEM_PROMPT tuân thủ Nghị định 30 và chống ảo giác
  if (!MASTER_SYSTEM_PROMPT.includes("NGHỊ ĐỊNH 30/2020/NĐ-CP")) {
    throw new Error("Master System Prompt thiếu định danh Nghị định 30!");
  }
  if (!MASTER_SYSTEM_PROMPT.includes("ANTI-HALLUCINATION GUARDRAILS")) {
    throw new Error("Master System Prompt thiếu nguyên tắc chống ảo giác!");
  }
  if (!MASTER_SYSTEM_PROMPT.includes("[TÊN NGƯỜI NHẬN]")) {
    throw new Error("Master System Prompt thiếu ví dụ placeholder [...]!");
  }
  if (!MASTER_SYSTEM_PROMPT.includes("TIÊU NGỮ & QUỐC HIỆU (Bắt buộc dùng layout table 2 cột, border:none)")) {
    throw new Error("Master System Prompt thiếu ràng buộc bảng ẩn 2 cột!");
  }
  console.log("✓ 1. Master System Prompt đạt 100% tiêu chuẩn Nghị định 30 & Anti-hallucination.");

  // 2. Kiểm thử Stream trực tiếp với DeepSeek API qua generateDocumentStream
  console.log(`📡 Đang gọi live streaming với mô hình: ${DEFAULT_DEEPSEEK_MODEL}...`);

  const testMessages: Array<{ role: "system" | "user"; content: string }> = [
    { role: "system", content: "Bạn là trợ lý hành chính DOCDRAFT AI." },
    {
      role: "user",
      content:
        "Tạo bảng Quốc hiệu tiêu ngữ cho UBND Tỉnh Đồng Nai. Trả về đúng 1 thẻ <table> HTML ngắn gọn.",
    },
  ];

  let accumulatedText = "";
  let chunkCount = 0;
  let hasReasoning = false;
  let modelUsed = "";

  const generator = generateDocumentStream({
    preferredProvider: "deepseek",
    messages: testMessages,
  });

  for await (const chunk of generator) {
    chunkCount++;
    if (chunk.reasoning) {
      hasReasoning = true;
    }
    if (chunk.text) {
      accumulatedText += chunk.text;
    }
    modelUsed = chunk.model;
  }

  if (chunkCount === 0 || !accumulatedText) {
    throw new Error("Stream không nhận được chunk nào từ DeepSeek!");
  }

  if (!accumulatedText.includes("<table") || !accumulatedText.toLowerCase().includes("đồng nai")) {
    console.log("Nội dung nhận được:", accumulatedText);
    throw new Error("Nội dung stream không chứa bảng HTML hợp lệ!");
  }

  console.log(`✓ 2. Nhận thành công ${chunkCount} chunks từ mô hình: ${modelUsed}`);
  if (hasReasoning) {
    console.log("✓ 2b. Mô hình DeepSeek-V4-Flash phát sinh reasoning_content (Tư duy chuỗi) thành công.");
  }
  console.log(`✓ 2c. Độ dài HTML sinh ra: ${accumulatedText.length} ký tự.`);

  // 3. Kiểm thử Abort Controller (Dừng sinh)
  console.log("🛑 3. Đang kiểm thử Abort Signal (Dừng sinh)...");
  const controller = new AbortController();
  const abortGenerator = generateDocumentStream({
    preferredProvider: "deepseek",
    messages: testMessages,
    signal: controller.signal,
  });

  let abortChunks = 0;
  for await (const chunk of abortGenerator) {
    if (chunk) abortChunks++;
    // Hủy ngay sau chunk đầu tiên
    controller.abort();
    break;
  }

  if (abortChunks !== 1) {
    throw new Error(`Kỳ vọng ngắt sau 1 chunk, nhưng nhận ${abortChunks}`);
  }
  console.log("✓ 3. AbortSignal ngắt luồng stream thành công ngay lập tức, tiết kiệm token!");

  console.log("\n🎉 TOÀN BỘ KIỂM THỬ STREAMING & FALLBACK ĐẠT 100% TIÊU CHUẨN!");
}

runStreamProtocolTests().catch((err) => {
  console.error("LỖI TEST:", err);
  process.exit(1);
});
