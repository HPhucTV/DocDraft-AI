import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const feedbackSchema = z.object({
  draftId: z.string().uuid().optional().nullable(),
  actionType: z.enum(["RAW_TO_DOC", "INLINE_EDIT", "CHAT_COPILOT", "AUTO_FIX"]),
  rating: z.union([z.literal(1), z.literal(-1)]),
  tags: z.array(z.string()).optional().default([]),
  comment: z.string().max(2000).optional().nullable(),
  modelName: z.string().max(50).optional().default("deepseek-v4-flash"),
  promptSnippet: z.string().max(5000).optional().nullable(),
  completionSnippet: z.string().max(5000).optional().nullable(),
});

/**
 * POST /api/ai/feedback
 * Ghi nhận đánh giá phản hồi 👍 / 👎 của người dùng cho các tác vụ AI (TASK-310).
 * Lưu log để phân tích chất lượng prompt và huấn luyện mô hình.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = feedbackSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu đánh giá không hợp lệ", details: validated.error.format() },
        { status: 400 }
      );
    }

    const {
      draftId,
      actionType,
      rating,
      tags,
      comment,
      modelName,
      promptSnippet,
      completionSnippet,
    } = validated.data;

    // Lấy thông tin người dùng đăng nhập nếu có
    const session = await auth();
    const userId = session?.user?.id;

    const feedback = await prisma.aIFeedback.create({
      data: {
        draftId: draftId || undefined,
        userId: userId || undefined,
        actionType,
        rating,
        tags,
        comment: comment || undefined,
        modelName,
        promptSnippet: promptSnippet || undefined,
        completionSnippet: completionSnippet || undefined,
      },
      select: {
        id: true,
        actionType: true,
        rating: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      message: "Cảm ơn bạn đã đóng góp phản hồi để hoàn thiện AI!",
    });
  } catch (error: unknown) {
    console.error("Lỗi lưu AI Feedback:", error);
    return NextResponse.json(
      { error: "Không thể lưu đánh giá phản hồi" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/feedback?actionType=...
 * Thống kê tỷ lệ đánh giá hài lòng của các tác vụ AI
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const actionType = searchParams.get("actionType");

    const whereClause = actionType ? { actionType } : {};

    const [positiveCount, negativeCount, totalCount] = await Promise.all([
      prisma.aIFeedback.count({ where: { ...whereClause, rating: 1 } }),
      prisma.aIFeedback.count({ where: { ...whereClause, rating: -1 } }),
      prisma.aIFeedback.count({ where: whereClause }),
    ]);

    const satisfactionRate = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 100;

    return NextResponse.json({
      success: true,
      totalCount,
      positiveCount,
      negativeCount,
      satisfactionRate,
    });
  } catch (error: unknown) {
    console.error("Lỗi lấy thống kê AI Feedback:", error);
    return NextResponse.json(
      { error: "Không thể lấy thống kê đánh giá" },
      { status: 500 }
    );
  }
}
