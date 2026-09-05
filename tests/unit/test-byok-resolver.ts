import { compilePromptMessages } from "../../src/lib/ai/ai-service";
import { maskApiKey } from "../../src/lib/encryption";

function runByokAndPromptTests() {
  console.log("🤖 Đang kiểm thử Prompt Compiler & In-Context Learning (TASK-107)...");

  // 1. Kiểm thử biên dịch prompt với biến số
  const systemPrompt = "Bạn là trợ lý pháp lý hành chính nhà nước DOCDRAFT AI.";
  const userPromptTemplate = "Kính gửi {{co_quan_chu_quan}}, báo cáo về {{noi_dung_bao_cao}} ngày {{ngay_thang}}.";
  const variables = {
    co_quan_chu_quan: "Ủy ban nhân dân Tỉnh",
    noi_dung_bao_cao: "Tiến độ giải ngân vốn đầu tư công",
    // Biến ngày tháng để trống xem có tự động điền placeholder chuẩn không
  };

  const fewShotExamples = [
    {
      input: { co_quan: "Bộ Tài chính", noi_dung: "Đề xuất ngân sách" },
      output_html: "<table><tr><td>Bộ Tài chính</td></tr></table>",
    },
  ];

  const messages = compilePromptMessages({
    systemPrompt,
    userPromptTemplate,
    variables,
    fewShotExamples,
  });

  // Kiểm tra cấu trúc messages: 1 system, 2 few-shot (user + assistant), 1 user prompt
  if (messages.length !== 4) {
    throw new Error(`Kỳ vọng 4 messages nhưng nhận được ${messages.length}`);
  }

  if (messages[0].role !== "system" || messages[0].content !== systemPrompt) {
    throw new Error("System prompt không khớp!");
  }

  if (messages[1].role !== "user" || !messages[1].content.includes("Bộ Tài chính")) {
    throw new Error("Few-shot example user message không khớp!");
  }

  if (messages[2].role !== "assistant" || !messages[2].content.includes("<table>")) {
    throw new Error("Few-shot example assistant message không khớp!");
  }

  const finalUserMsg = messages[3].content;
  if (!finalUserMsg.includes("Ủy ban nhân dân Tỉnh") || !finalUserMsg.includes("Tiến độ giải ngân vốn đầu tư công")) {
    throw new Error("Biến số không được thay thế đúng cách!");
  }

  if (!finalUserMsg.includes("[NGAY_THANG]")) {
    throw new Error("Thiếu biến số rỗng không tự sinh placeholder [NGAY_THANG]!");
  }

  console.log("✓ Biên dịch Prompt và tiêm Few-shot in-context learning thành công 100%.");

  // 2. Kiểm thử mask key cho cả DeepSeek và Gemini
  const dsKey = "sk-deepseek-abcdef1234567890";
  const geminiKey = "AIzaSyDa-example1234567890";

  const maskedDs = maskApiKey(dsKey);
  const maskedGemini = maskApiKey(geminiKey);

  if (!maskedDs.startsWith("sk-") || !maskedDs.endsWith("7890")) {
    throw new Error(`Mask DeepSeek key không chuẩn: ${maskedDs}`);
  }

  if (!maskedGemini.startsWith("AI") || !maskedGemini.endsWith("7890")) {
    throw new Error(`Mask Gemini key không chuẩn: ${maskedGemini}`);
  }

  console.log(`✓ Mask DeepSeek: ${maskedDs}`);
  console.log(`✓ Mask Gemini: ${maskedGemini}`);

  console.log("\n🎉 KIỂM THỬ BYOK & PROMPT COMPILER ĐẠT 100% TIÊU CHUẨN!");
}

runByokAndPromptTests();
