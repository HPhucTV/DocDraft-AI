import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/drafts/[id]/audit-logs
 * Lấy lịch sử nhật ký kiểm toán AI & con người của văn bản (TASK-204).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const draft = await prisma.documentDraft.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Không tìm thấy văn bản" },
        { status: 404 }
      );
    }

    const logs = await prisma.auditLog.findMany({
      where: { draftId: id },
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Lỗi khi tải nhật ký kiểm toán:", error);
    return NextResponse.json(
      { error: "Không thể tải nhật ký kiểm toán" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drafts/[id]/audit-logs
 * Ghi nhận sự kiện kiểm toán AI (TASK-204).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      actionType = "AI_APPLY",
      source = "AI",
      details = {},
    } = body;

    const draft = await prisma.documentDraft.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Không tìm thấy văn bản để ghi log" },
        { status: 404 }
      );
    }

    const newLog = await prisma.auditLog.create({
      data: {
        draftId: id,
        actorId: session.user.id,
        actionType,
        source,
        details: {
          ...details,
          ai_model: details.ai_model || process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
        },
      },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi ghi nhật ký kiểm toán:", error);
    return NextResponse.json(
      { error: "Không thể ghi nhật ký kiểm toán" },
      { status: 500 }
    );
  }
}
