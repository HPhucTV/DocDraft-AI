import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/drafts/[id]/comments
 * Lấy danh sách bình luận theo ngữ cảnh của bản nháp (TASK-306).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: draftId } = await params;

  try {
    // 1. Kiểm tra quyền truy cập bản nháp (chủ sở hữu hoặc qua shared links)
    const draft = await prisma.documentDraft.findUnique({
      where: { id: draftId },
      select: { id: true, userId: true },
    });

    if (!draft) {
      return NextResponse.json({ error: "Bản nháp không tồn tại" }, { status: 404 });
    }

    // 2. Lấy danh sách bình luận kèm thông tin tác giả và câu trả lời lồng nhau
    const comments = await prisma.comment.findMany({
      where: {
        draftId,
        parentCommentId: null, // Chỉ lấy root comments trước
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error: unknown) {
    console.error("Lỗi lấy danh sách bình luận:", error);
    return NextResponse.json(
      { error: "Không thể tải danh sách bình luận" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drafts/[id]/comments
 * Thêm bình luận mới hoặc trả lời bình luận có sẵn (TASK-306).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: draftId } = await params;

  try {
    const body = await req.json();
    const {
      content,
      anchorJson,
      parentCommentId,
    } = body as {
      content?: string;
      anchorJson?: { from?: number; to?: number; quote?: string };
      parentCommentId?: string;
    };

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Nội dung bình luận không được để trống" },
        { status: 400 }
      );
    }

    const newComment = await prisma.comment.create({
      data: {
        draftId,
        userId: session.user.id,
        content: content.trim(),
        anchorJson: anchorJson ? (anchorJson as Prisma.InputJsonValue) : undefined,
        parentCommentId: parentCommentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      comment: newComment,
    });
  } catch (error: unknown) {
    console.error("Lỗi tạo bình luận:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: `Không thể tạo bình luận: ${msg}` },
      { status: 500 }
    );
  }
}
