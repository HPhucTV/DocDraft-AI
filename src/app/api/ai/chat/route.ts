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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/chat
 * Server-Sent Events (SSE) AI Chat Sidebar giữ toàn bộ ngữ cảnh văn bản (TASK-206).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      messages = [],
      documentTitle = "",
      documentContent = "",
      preferredProvider = "deepseek",
    } = body as {
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
      documentTitle?: string;
      documentContent?: string;
      preferredProvider?: AIProvider;
    };

    const cleanDocText = documentContent
      ? documentContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      : "";

    const systemPrompt = `BẠN LÀ TRỢ LÝ TƯ VẤN SOẠN THẢO VĂN BẢN QUY PHẠM VÀ HÀNH CHÍNH (CONTEXTUAL DOCUMENT ASSISTANT) THEO NGHỊ ĐỊNH 30/2020/NĐ-CP.
Nhiệm vụ: Trả lời các câu hỏi, gợi ý điều khoản, soát lỗi và hỗ trợ người dùng hoàn thiện văn bản đang mở.

NGỮ CẢNH VĂN BẢN HIỆN TẠI CỦA NGƯỜI DÙNG:
- Tiêu đề văn bản: "${documentTitle || "Chưa đặt tên"}"
- Toàn bộ nội dung văn bản hiện tại:
"""
${cleanDocText ? cleanDocText.slice(0, 4000) : "(Văn bản hiện đang trống)"}
"""

QUY TẮC PHẢN HỒI:
1. Khi người dùng yêu cầu soạn thảo một điều khoản, đoạn văn hoặc căn cứ, hãy trả về nội dung chuẩn mực và có thể copy/áp dụng ngay vào bài.
2. Tuân thủ 100% quy chuẩn thể thức của Nghị định 30/2020/NĐ-CP.
3. Luôn giữ thái độ chuyên nghiệp, hành chính, mạch lạc.`;

    const keyInfo = await resolveAIKey(session.user.id, preferredProvider);

    const fullMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        if (keyInfo.provider === "deepseek") {
          const client = createDeepSeekClient(keyInfo.apiKey);
          const stream = await client.chat.completions.create(
            {
              model: DEFAULT_DEEPSEEK_MODEL,
              messages: fullMessages,
              stream: true,
              temperature: 0.3,
            },
            { signal: req.signal }
          );

          for await (const chunk of stream) {
            if (req.signal.aborted) break;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const delta = chunk.choices[0]?.delta as any;
            const content = delta?.content || "";
            const reasoning = delta?.reasoning_content || "";
            if (content || reasoning) {
              await writer.write(
                encoder.encode(
                  `event: content\ndata: ${JSON.stringify({ chunk: content, reasoning })}\n\n`
                )
              );
            }
          }
        } else {
          const genAI = createGeminiClient(keyInfo.apiKey);
          const model = genAI.getGenerativeModel({
            model: DEFAULT_GEMINI_MODEL,
            systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
          });

          const geminiStream = await model.generateContentStream({
            contents: messages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
          });

          for await (const chunk of geminiStream.stream) {
            if (req.signal.aborted) break;
            const text = chunk.text();
            if (text) {
              await writer.write(
                encoder.encode(
                  `event: content\ndata: ${JSON.stringify({ chunk: text })}\n\n`
                )
              );
            }
          }
        }

        await writer.write(
          encoder.encode(
            `event: done\ndata: ${JSON.stringify({
              model_used: keyInfo.provider === "deepseek" ? DEFAULT_DEEPSEEK_MODEL : DEFAULT_GEMINI_MODEL,
            })}\n\n`
          )
        );
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[AI Chat Sidebar Error]:", err);
        try {
          await writer.write(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: errMsg })}\n\n`
            )
          );
        } catch {}
      } finally {
        try {
          await writer.close();
        } catch {}
      }
    })();

    return new Response(responseStream.readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Lỗi khởi tạo AI Chat Sidebar:", error);
    return NextResponse.json(
      { error: "Không thể khởi tạo phiên trò chuyện AI" },
      { status: 500 }
    );
  }
}
