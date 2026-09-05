import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  BilingualEngine,
  bilingualGenerateSchema,
} from "@/lib/ai/bilingual-engine";
import { checkAiRateLimit, createRateLimitExceededResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/bilingual/generate
 * Sinh văn bản song ngữ Anh - Việt dạng bảng 2 cột đối ứng (TASK-410).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    if (userId) {
      const rateLimitResult = await checkAiRateLimit(userId);
      if (!rateLimitResult.success) {
        return createRateLimitExceededResponse(rateLimitResult);
      }
    }

    const body = await req.json();
    const validation = bilingualGenerateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu hợp đồng song ngữ không hợp lệ",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const result = await BilingualEngine.generateBilingual(
      userId,
      validation.data
    );

    return NextResponse.json({
      success: true,
      html: result.html,
      ast: result.ast,
      provider: result.provider,
    });
  } catch (error: unknown) {
    console.error("[POST /api/ai/bilingual/generate] Error:", error);
    const message =
      error instanceof Error ? error.message : "Lỗi khi sinh văn bản song ngữ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
