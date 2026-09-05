import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/drafts/[id]
 * Lấy chi tiết bản nháp theo ID (TASK-117).
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
      include: {
        template: true,
        folder: true,
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 10,
        },
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Không tìm thấy bản nháp hoặc bạn không có quyền truy cập" },
        { status: 404 }
      );
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Lỗi khi tải chi tiết bản nháp:", error);
    return NextResponse.json(
      { error: "Không thể tải chi tiết bản nháp" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/drafts/[id]
 * Cập nhật bản nháp với cơ chế Khóa lạc quan (Optimistic Locking) (TASK-118).
 * Nếu client gửi `currentVersion` không khớp với `currentVersion` trong DB, trả về 409 Conflict.
 */
export async function PATCH(
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
      title,
      contentJson,
      rawInputData,
      status,
      wordCount,
      currentVersion,
      editSource = "USER_MANUAL",
      changeSummary,
      createSnapshot = false,
    } = body;

    // 1. Kiểm tra sự tồn tại và quyền sở hữu
    const existingDraft = await prisma.documentDraft.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingDraft) {
      return NextResponse.json(
        { error: "Không tìm thấy bản nháp để cập nhật" },
        { status: 404 }
      );
    }

    // 2. Kiểm tra Khóa lạc quan (Optimistic Locking Check)
    if (typeof currentVersion === "number" && currentVersion !== existingDraft.currentVersion) {
      return NextResponse.json(
        {
          error: "Xung đột phiên bản (Optimistic Lock Conflict). Văn bản đã được cập nhật bởi một phiên làm việc khác.",
          serverVersion: existingDraft.currentVersion,
          clientVersion: currentVersion,
        },
        { status: 409 }
      );
    }

    const nextVersion = existingDraft.currentVersion + 1;

    // 3. Thực hiện cập nhật trong transaction để bảo toàn lịch sử phiên bản
    const updatedDraft = await prisma.$transaction(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        currentVersion: nextVersion,
      };

      if (title !== undefined) updateData.title = title;
      if (contentJson !== undefined) updateData.contentJson = contentJson;
      if (rawInputData !== undefined) updateData.rawInputData = rawInputData;
      if (status !== undefined) updateData.status = status;
      if (wordCount !== undefined) updateData.wordCount = wordCount;

      const draft = await tx.documentDraft.update({
        where: { id },
        data: updateData,
        include: {
          template: true,
          folder: true,
        },
      });

      // Tạo snapshot lịch sử phiên bản nếu có cờ hoặc phiên bản lớn
      if (createSnapshot || contentJson) {
        await tx.draftVersion.create({
          data: {
            draftId: id,
            versionNumber: nextVersion,
            contentJson: contentJson || existingDraft.contentJson,
            editSource,
            changeSummary: changeSummary || `Tự động lưu phiên bản ${nextVersion}`,
            createdBy: session.user.id,
          },
        });
      }

      return draft;
    });

    return NextResponse.json(updatedDraft);
  } catch (error) {
    console.error("Lỗi khi cập nhật bản nháp:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật bản nháp" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drafts/[id]
 * Xóa mềm (Soft Delete vào thùng rác) hoặc Xóa vĩnh viễn (Hard Delete) (TASK-117).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const isPermanent = searchParams.get("permanent") === "true";

  try {
    const existingDraft = await prisma.documentDraft.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingDraft) {
      return NextResponse.json(
        { error: "Không tìm thấy bản nháp để xóa" },
        { status: 404 }
      );
    }

    if (isPermanent || existingDraft.deletedAt !== null) {
      // Xóa vĩnh viễn
      await prisma.documentDraft.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: "Đã xóa vĩnh viễn bản nháp" });
    } else {
      // Xóa mềm: đưa vào thùng rác
      const trashed = await prisma.documentDraft.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return NextResponse.json({
        success: true,
        message: "Đã chuyển bản nháp vào thùng rác",
        draft: trashed,
      });
    }
  } catch (error) {
    console.error("Lỗi khi xóa bản nháp:", error);
    return NextResponse.json(
      { error: "Không thể xóa bản nháp" },
      { status: 500 }
    );
  }
}
