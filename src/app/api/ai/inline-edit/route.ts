import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  resolveAIKey,
  createDeepSeekClient,
  createGeminiClient,
  DEFAULT_DEEPSEEK_MODEL,
  DEFAULT_GEMINI_MODEL,
  AIProvider,
} from "@/lib/ai/ai-service";
import { checkAiRateLimit, createRateLimitExceededResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const INLINE_SYSTEM_PROMPT = `BẠN LÀ TRỢ LÝ SOẠN THẢO VĂN BẢN HÀNH CHÍNH (AI INLINE COPILOT) THEO NGHỊ ĐỊNH 30/2020/NĐ-CP.
Nhiệm vụ: Chỉnh sửa đoạn văn bản được người dùng bôi đen theo đúng mệnh lệnh được yêu cầu.

CÁC MỆNH LỆNH HỖ TRỢ:
1. "formalize" (Hành chính hóa): Chuyển đổi ngôn từ thông thường hoặc văn nói sang phong cách hành chính - công vụ chuẩn mực, trang trọng, súc tích.
2. "shorten" (Rút gọn): Cô đọng đoạn văn, giữ lại 100% số liệu và ý chính cốt lõi, loại bỏ từ ngữ rườm rà.
3. "expand" (Viết chi tiết): Bổ sung diễn giải hành chính chặt chẽ, mở rộng căn cứ và lập luận một cách trang trọng, logic.
4. "fix_spelling" (Sửa chính tả & Thể thức): Sửa lỗi gõ tiếng Việt, chuẩn hóa dấu câu (chấm phẩy căn cứ), chuẩn chính tả từ vựng hành chính.

QUY TẮC CỐT LÕI:
- BẢO TỒN NGUYÊN VẸN 100% tất cả các số tiền, ngày tháng, tên riêng hoặc số liệu thực tế trong văn bản gốc.
- CHỈ TRẢ VỀ ĐOẠN VĂN BẢN ĐÃ ĐƯỢC CHỈNH SỬA HOÀN THIỆN.
- KHÔNG thêm lời chào, không giải thích, không đặt trong dấu ngoặc kép hay markdown block (\`\`\`).`;

/**
 * POST /api/ai/inline-edit
 * Xử lý lệnh Copilot nhanh trên đoạn văn bản được bôi đen (TASK-205).
 * Tích hợp Rate Limiting & BYOK bypass (TASK-214).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const apiKeyHeader =
    req.headers.get("X-API-Key") ||
    req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");

  const userId = session?.user?.id || (apiKeyHeader ? "addon-user" : null);

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized: Vui lòng đăng nhập hoặc cung cấp API Key để sử dụng tính năng này" },
      { status: 401 }
    );
  }

  // Rate limit check (TASK-214)
  if (session?.user?.id) {
    const rateLimitResult = await checkAiRateLimit(session.user.id);
    if (!rateLimitResult.success) {
      return createRateLimitExceededResponse(rateLimitResult);
    }
  }

  try {
    const body = await req.json();
    const {
      selectedText,
      command,
      surroundingContext = "",
      preferredProvider = "deepseek",
    } = body as {
      selectedText?: string;
      command?: "formalize" | "shorten" | "expand" | "fix_spelling";
      surroundingContext?: string;
      preferredProvider?: AIProvider;
    };

    if (!selectedText || !selectedText.trim()) {
      return NextResponse.json(
        { error: "Đoạn văn bản được chọn không được để trống" },
        { status: 400 }
      );
    }

    const commandLabels: Record<string, string> = {
      formalize: "Hành chính hóa sang phong cách công vụ Nghị định 30",
      shorten: "Rút gọn súc tích nhưng giữ nguyên mọi số liệu thực tế",
      expand: "Viết chi tiết, bổ sung diễn giải hành chính trang trọng",
      fix_spelling: "Sửa lỗi chính tả tiếng Việt và chuẩn hóa dấu câu thể thức",
    };

    const userPrompt = `MỆNH LỆNH CẦN THỰC HIỆN: ${commandLabels[command || "formalize"] || command}
${surroundingContext ? `\nNGỮ CẢNH XUNG QUANH:\n"${surroundingContext}"\n` : ""}
ĐOẠN VĂN BẢN CẦN CHỈNH SỬA:
"""
${selectedText}
"""

HÃY TRẢ VỀ ĐOẠN ĐÃ SỬA:`;

    const keyInfo = await resolveAIKey(session?.user?.id || userId, preferredProvider);

    let resultText = "";

    if (keyInfo.provider === "deepseek") {
      const client = createDeepSeekClient(keyInfo.apiKey);
      const res = await client.chat.completions.create({
        model: DEFAULT_DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: INLINE_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      });
      resultText = res.choices[0]?.message?.content || "";
    } else {
      const genAI = createGeminiClient(keyInfo.apiKey);
      const model = genAI.getGenerativeModel({
        model: DEFAULT_GEMINI_MODEL,
        systemInstruction: {
          role: "system",
          parts: [{ text: INLINE_SYSTEM_PROMPT }],
        },
      });
      const res = await model.generateContent(userPrompt);
      resultText = res.response.text();
    }

    resultText = resultText.replace(/^"|"$/g, "").trim();

    const origWords = selectedText.trim().split(/\s+/).filter(Boolean).length;
    const resWords = resultText.trim().split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      success: true,
      command,
      originalText: selectedText,
      resultText,
      wordsOriginal: origWords,
      wordsResult: resWords,
      modelUsed: keyInfo.provider === "deepseek" ? DEFAULT_DEEPSEEK_MODEL : DEFAULT_GEMINI_MODEL,
    });
  } catch (error) {
    console.error("Lỗi khi xử lý AI Inline Edit:", error);
    return NextResponse.json(
      { error: "Không thể xử lý lệnh chỉnh sửa đoạn văn" },
      { status: 500 }
    );
  }
}
