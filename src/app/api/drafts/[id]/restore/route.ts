import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/drafts/[id]/restore
 * Khôi phục bản nháp từ thùng rác về danh sách làm việc (TASK-117).
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
    const existingDraft = await prisma.documentDraft.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingDraft) {
      return NextResponse.json(
        { error: "Không tìm thấy bản nháp để khôi phục" },
        { status: 404 }
      );
    }

    const restored = await prisma.documentDraft.update({
      where: { id },
      data: { deletedAt: null },
    });

    return NextResponse.json({
      success: true,
      message: "Đã khôi phục bản nháp thành công",
      draft: restored,
    });
  } catch (error) {
    console.error("Lỗi khi khôi phục bản nháp:", error);
    return NextResponse.json(
      { error: "Không thể khôi phục bản nháp" },
      { status: 500 }
    );
  }
}
