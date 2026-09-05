import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { streamRestructuredDocument } from "@/lib/ai/raw-to-doc-service";
import { AIProvider } from "@/lib/ai/ai-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/raw-to-doc/stream
 * Endpoint Server-Sent Events (SSE) chuẩn hóa nháp thô sang thể thức Nghị định 30 (TASK-201).
 * Áp dụng Prompt Chaining 2 bước: Bóc tách thực thể (Facts) → Tái cấu trúc văn bản.
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
      rawText,
      targetDocType = "Công văn",
      preferredProvider = "deepseek",
    } = body as {
      rawText?: string;
      targetDocType?: string;
      preferredProvider?: AIProvider;
    };

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { error: "Nội dung nháp thô không được để trống" },
        { status: 400 }
      );
    }

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    // Heartbeat định kỳ 15 giây
    const heartbeatTimer = setInterval(async () => {
      try {
        await writer.write(encoder.encode(": ping - keepalive\n\n"));
      } catch {
        clearInterval(heartbeatTimer);
      }
    }, 15000);

    // Xử lý stream trong background
    (async () => {
      let accumulatedContent = "";
      try {
        const generator = streamRestructuredDocument({
          userId: session.user.id,
          rawText: rawText.trim(),
          targetDocType,
          preferredProvider,
          signal: req.signal,
        });

        for await (const chunk of generator) {
          if (req.signal.aborted) break;

          // 1. Gửi sự kiện Facts nếu có
          if (chunk.facts) {
            await writer.write(
              encoder.encode(
                `event: facts\ndata: ${JSON.stringify(chunk.facts)}\n\n`
              )
            );
          }

          // 2. Gửi sự kiện Reasoning tokens
          if (chunk.reasoning) {
            await writer.write(
              encoder.encode(
                `event: thinking\ndata: ${JSON.stringify({ token: chunk.reasoning })}\n\n`
              )
            );
          }

          // 3. Gửi sự kiện HTML Content
          if (chunk.text) {
            accumulatedContent += chunk.text;
            await writer.write(
              encoder.encode(
                `event: content\ndata: ${JSON.stringify({ chunk: chunk.text })}\n\n`
              )
            );
          }
        }

        // Hoàn tất stream
        const durationMs = Date.now() - startTime;
        const rawTextOnly = accumulatedContent.replace(/<[^>]*>/g, "");
        const wordCount = rawTextOnly.trim().split(/\s+/).filter(Boolean).length;

        await writer.write(
          encoder.encode(
            `event: done\ndata: ${JSON.stringify({
              duration_ms: durationMs,
              word_count: wordCount,
              model_used: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
            })}\n\n`
          )
        );
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[Raw-to-Doc SSE Stream Error]:", err);
        try {
          await writer.write(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: errMsg })}\n\n`
            )
          );
        } catch {}
      } finally {
        clearInterval(heartbeatTimer);
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
    console.error("Lỗi khởi tạo Raw-to-Doc SSE:", error);
    return NextResponse.json(
      { error: "Không thể khởi tạo tiến trình chuẩn hóa nháp thô" },
      { status: 500 }
    );
  }
}
