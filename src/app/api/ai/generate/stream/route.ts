import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AIProvider,
  compilePromptMessages,
  generateDocumentStream,
  MASTER_SYSTEM_PROMPT,
} from "@/lib/ai/ai-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/generate/stream
 * Endpoint Server-Sent Events (SSE) sinh văn bản theo thời gian thực (Typewriter Effect).
 * Hỗ trợ Heartbeat (mỗi 15s), AbortSignal khi người dùng bấm "Dừng sinh",
 * và cơ chế Fallback tự động sang Gemini 3.7 Flash.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const {
      templateId,
      variables = {},
      systemPrompt: customSystemPrompt,
      userPrompt: customUserPrompt,
      preferredProvider = "deepseek",
    } = body as {
      templateId?: string;
      variables?: Record<string, unknown>;
      systemPrompt?: string;
      userPrompt?: string;
      preferredProvider?: AIProvider;
    };

    let compiledMessages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [];

    // 1. Nếu có templateId, lấy từ Database
    if (templateId) {
      const template = await prisma.template.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return NextResponse.json(
          { error: `Không tìm thấy biểu mẫu với ID: ${templateId}` },
          { status: 404 }
        );
      }

      compiledMessages = compilePromptMessages({
        systemPrompt: template.systemPrompt || MASTER_SYSTEM_PROMPT,
        userPromptTemplate: template.userPromptTemplate,
        variables,
        fewShotExamples: (template.fewShotExamples as unknown as Array<{
          input: Record<string, unknown>;
          output_html: string;
        }>) || undefined,
      });
    } else {
      // 2. Tự do hoặc qua Prompt do Client cung cấp
      const sysPrompt = customSystemPrompt || MASTER_SYSTEM_PROMPT;
      const userPrompt = customUserPrompt || "Hãy soạn thảo văn bản hành chính theo dữ liệu đầu vào.";

      compiledMessages = compilePromptMessages({
        systemPrompt: sysPrompt,
        userPromptTemplate: userPrompt,
        variables,
      });
    }

    // Thiết lập SSE Response Stream
    const encoder = new TextEncoder();
    let heartbeatTimer: NodeJS.Timeout | null = null;
    let isStreamClosed = false;

    const readable = new ReadableStream({
      async start(controller) {
        // Gửi Heartbeat (event: ping) mỗi 15 giây để chống timeout qua Cloudflare/Nginx proxy
        heartbeatTimer = setInterval(() => {
          if (isStreamClosed) return;
          try {
            const pingEvent = `event: ping\ndata: ${JSON.stringify({
              timestamp: Date.now(),
            })}\n\n`;
            controller.enqueue(encoder.encode(pingEvent));
          } catch {
            if (heartbeatTimer) clearInterval(heartbeatTimer);
          }
        }, 15000);

        let wordCount = 0;
        let lastModel = "deepseek-v4-flash";

        try {
          const generator = generateDocumentStream({
            userId: session.user?.id,
            preferredProvider,
            messages: compiledMessages,
            signal: req.signal,
          });

          for await (const chunk of generator) {
            if (req.signal.aborted || isStreamClosed) {
              break;
            }

            if (chunk.reasoning) {
              const thinkingEvent = `event: thinking\ndata: ${JSON.stringify({
                text: chunk.reasoning,
              })}\n\n`;
              controller.enqueue(encoder.encode(thinkingEvent));
            }

            if (chunk.text) {
              lastModel = chunk.model;

              // Đếm sơ bộ số từ
              const words = chunk.text.trim().split(/\s+/).filter(Boolean);
              wordCount += words.length;

              const contentEvent = `event: content\ndata: ${JSON.stringify({
                text: chunk.text,
                model: chunk.model,
                provider: chunk.provider,
              })}\n\n`;

              controller.enqueue(encoder.encode(contentEvent));
            }
          }

          if (!req.signal.aborted && !isStreamClosed) {
            // Gửi event: done thông báo kết thúc an toàn
            const durationMs = Date.now() - startTime;
            const doneEvent = `event: done\ndata: ${JSON.stringify({
              success: true,
              word_count: wordCount,
              finish_reason: "STOP",
              model_used: lastModel,
              duration_ms: durationMs,
            })}\n\n`;

            controller.enqueue(encoder.encode(doneEvent));
          }
        } catch (streamError: unknown) {
          if (!req.signal.aborted && !isStreamClosed) {
            const errMsg =
              streamError instanceof Error
                ? streamError.message
                : "Lỗi kết nối trong quá trình streaming";
            const errorEvent = `event: error\ndata: ${JSON.stringify({
              code: "AI_GENERATION_FAILED",
              message: errMsg,
              retryable: true,
              retry_after_ms: 2000,
            })}\n\n`;

            controller.enqueue(encoder.encode(errorEvent));
          }
        } finally {
          isStreamClosed = true;
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          try {
            controller.close();
          } catch {
            // Controller có thể đã đóng khi client abort
          }
        }
      },
      cancel() {
        isStreamClosed = true;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Tắt buffering trên Nginx
      },
    });
  } catch (error: unknown) {
    console.error("Lỗi khởi tạo stream AI:", error);
    const errMsg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
