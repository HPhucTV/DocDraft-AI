import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkCompliance, extractTextFromAst } from "@/lib/compliance/compliance-engine";
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

/**
 * POST /api/compliance/check
 * Kiểm tra thể thức văn bản theo Nghị định 30/2020/NĐ-CP (TASK-301).
 * Hỗ trợ 2 chế độ:
 * - "fast" (Mặc định): Kiểm tra quy tắc cố định siêu tốc (<30ms).
 * - "ai": Kết hợp AI phân tích sâu ngữ cảnh, văn phong hành chính và tính chặt chẽ pháp lý.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      contentJson,
      htmlContent,
      mode = "fast",
      preferredProvider = "deepseek",
    } = body as {
      contentJson?: unknown;
      htmlContent?: string;
      mode?: "fast" | "ai";
      preferredProvider?: AIProvider;
    };

    const target = contentJson || htmlContent;
    if (!target) {
      return NextResponse.json({ error: "Thiếu nội dung văn bản cần soát lỗi" }, { status: 400 });
    }

    // 1. Tầng 1: Soát lỗi quy tắc cố định (Rule-based Engine)
    const report = checkCompliance(target);

    // Nếu chỉ yêu cầu soát lỗi nhanh, trả kết quả ngay lập tức
    if (mode !== "ai") {
      return NextResponse.json({
        success: true,
        mode: "fast",
        report,
      });
    }

    // 2. Tầng 2: Soát lỗi ngữ cảnh bằng AI (Deep Contextual Audit)
    const rateLimitResult = await checkAiRateLimit(session.user.id);
    if (!rateLimitResult.success) {
      return createRateLimitExceededResponse(rateLimitResult);
    }

    const documentText = contentJson
      ? extractTextFromAst(contentJson)
      : (htmlContent || "").replace(/<[^>]*>/g, " ");

    const keyResolution = await resolveAIKey(session.user.id, preferredProvider);

    const systemPrompt = `BẠN LÀ CHUYÊN GIA KIỂM ĐỊNH VĂN PHONG VÀ THỂ THỨC VĂN BẢN QUẢN LÝ NHÀ NƯỚC THEO NGHỊ ĐỊNH 30/2020/NĐ-CP.
Nhiệm vụ: Đọc toàn bộ văn bản và đưa ra đánh giá ngắn gọn về:
1. Văn phong hành chính - công vụ (có trang trọng, súc tích, khách quan không?).
2. Tính liên kết logic giữa Căn cứ pháp lý, Trích yếu và Các điều khoản quyết nghị.
3. Cảnh báo những từ ngữ khẩu ngữ hoặc câu văn quá dài, tối nghĩa.

ĐỊNH DẠNG TRẢ VỀ DUY NHẤT: Trả về JSON object theo cấu trúc:
{
  "styleScore": number (thang 100),
  "toneAssessment": "string (1-2 câu nhận xét)",
  "semanticSuggestions": [
    {
      "originalSentence": "câu cần sửa",
      "suggestedSentence": "câu đề xuất thay thế",
      "reason": "lý do sửa"
    }
  ]
}
Chỉ trả về JSON thuần, không bọc trong markdown codeblock.`;

    let aiSuggestions: Record<string, unknown> | null = null;

    if (keyResolution.provider === "deepseek") {
      const client = createDeepSeekClient(keyResolution.apiKey);
      const completion = await client.chat.completions.create({
        model: DEFAULT_DEEPSEEK_MODEL,
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `VĂN BẢN CẦN KIỂM ĐỊNH:\n${documentText.slice(0, 4000)}` },
        ],
      });
      const rawText = completion.choices[0]?.message?.content?.trim() || "{}";
      try {
        const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        aiSuggestions = JSON.parse(cleaned) as Record<string, unknown>;
      } catch {
        aiSuggestions = { toneAssessment: rawText, styleScore: 85, semanticSuggestions: [] };
      }
    } else {
      const client = createGeminiClient(keyResolution.apiKey);
      const model = client.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
      const prompt = `${systemPrompt}\n\nVĂN BẢN CẦN KIỂM ĐỊNH:\n${documentText.slice(0, 4000)}`;
      const result = await model.generateContent(prompt);
      const rawText = result.response.text().trim();
      try {
        const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        aiSuggestions = JSON.parse(cleaned) as Record<string, unknown>;
      } catch {
        aiSuggestions = { toneAssessment: rawText, styleScore: 85, semanticSuggestions: [] };
      }
    }

    return NextResponse.json({
      success: true,
      mode: "ai",
      report,
      aiAnalysis: aiSuggestions,
    });
  } catch (error: unknown) {
    console.error("Lỗi kiểm tra thể thức:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Lỗi kiểm định thể thức: ${msg}` },
      { status: 500 }
    );
  }
}
