import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/drafts/[id]/versions
 * Lấy danh sách tối đa 50 snapshot lịch sử của văn bản kèm nhãn edit_source và thông tin người sửa (TASK-209).
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
    // 1. Kiểm tra quyền sở hữu văn bản
    const draft = await prisma.documentDraft.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        currentVersion: true,
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Không tìm thấy văn bản hoặc bạn không có quyền truy cập" },
        { status: 404 }
      );
    }

    // 2. Lấy danh sách 50 version gần nhất
    const versions = await prisma.draftVersion.findMany({
      where: { draftId: id },
      orderBy: { versionNumber: "desc" },
      take: 50,
      include: {
        creator: {
          select: {
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      draftId: draft.id,
      currentVersion: draft.currentVersion,
      versions,
    });
  } catch (error) {
    console.error("Lỗi khi tải lịch sử phiên bản:", error);
    return NextResponse.json(
      { error: "Không thể tải lịch sử phiên bản" },
      { status: 500 }
    );
  }
}
