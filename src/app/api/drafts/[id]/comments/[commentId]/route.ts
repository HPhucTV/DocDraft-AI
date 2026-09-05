import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/drafts/[id]/comments/[commentId]
 * Cập nhật trạng thái giải quyết (isResolved) hoặc chỉnh sửa nội dung bình luận (TASK-306).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: draftId, commentId } = await params;

  try {
    const body = await req.json();
    const { isResolved, content } = body as {
      isResolved?: boolean;
      content?: string;
    };

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { draft: { select: { userId: true } } },
    });

    if (!comment || comment.draftId !== draftId) {
      return NextResponse.json({ error: "Bình luận không tồn tại" }, { status: 404 });
    }

    // Cho phép sửa nội dung nếu là tác giả, hoặc đổi trạng thái giải quyết nếu là tác giả hoặc chủ bản nháp
    const isAuthor = comment.userId === session.user.id;
    const isDraftOwner = comment.draft.userId === session.user.id;

    if (!isAuthor && !isDraftOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        ...(typeof isResolved === "boolean" ? { isResolved } : {}),
        ...(content && isAuthor ? { content: content.trim() } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      comment: updated,
    });
  } catch (error: unknown) {
    console.error("Lỗi cập nhật bình luận:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật bình luận" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drafts/[id]/comments/[commentId]
 * Xóa bình luận (TASK-306).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: draftId, commentId } = await params;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { draft: { select: { userId: true } } },
    });

    if (!comment || comment.draftId !== draftId) {
      return NextResponse.json({ error: "Bình luận không tồn tại" }, { status: 404 });
    }

    const isAuthor = comment.userId === session.user.id;
    const isDraftOwner = comment.draft.userId === session.user.id;

    if (!isAuthor && !isDraftOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Xóa các reply con trước (nếu có) rồi xóa root comment
    await prisma.comment.deleteMany({
      where: { parentCommentId: commentId },
    });

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa bình luận thành công",
    });
  } catch (error: unknown) {
    console.error("Lỗi xóa bình luận:", error);
    return NextResponse.json(
      { error: "Không thể xóa bình luận" },
      { status: 500 }
    );
  }
}
