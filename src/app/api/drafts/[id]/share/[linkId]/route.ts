import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/drafts/[id]/share/[linkId]
 * Thu hồi / xóa liên kết chia sẻ (TASK-305).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: draftId, linkId } = await params;

  try {
    const draft = await prisma.documentDraft.findUnique({
      where: { id: draftId },
      select: { userId: true },
    });

    if (!draft || draft.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.sharedLink.delete({
      where: { id: linkId },
    });

    return NextResponse.json({
      success: true,
      message: "Đã thu hồi liên kết chia sẻ thành công",
    });
  } catch (error: unknown) {
    console.error("Lỗi thu hồi liên kết chia sẻ:", error);
    return NextResponse.json(
      { error: "Không thể thu hồi liên kết chia sẻ" },
      { status: 500 }
    );
  }
}
