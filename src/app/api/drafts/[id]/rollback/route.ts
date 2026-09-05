import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/drafts/[id]/rollback
 * Khôi phục nội dung văn bản về một snapshot phiên bản cụ thể (TASK-209).
 * Tạo một phiên bản mới nối tiếp (Next Version) với nhãn 'ROLLBACK' để bảo toàn toàn bộ lịch sử.
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
    const { targetVersion } = body;

    if (typeof targetVersion !== "number") {
      return NextResponse.json(
        { error: "targetVersion phải là một số nguyên hợp lệ" },
        { status: 400 }
      );
    }

    // 1. Kiểm tra văn bản hiện tại
    const currentDraft = await prisma.documentDraft.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!currentDraft) {
      return NextResponse.json(
        { error: "Không tìm thấy văn bản để khôi phục" },
        { status: 404 }
      );
    }

    // 2. Tìm snapshot phiên bản đích
    const targetVersionRecord = await prisma.draftVersion.findUnique({
      where: {
        draftId_versionNumber: {
          draftId: id,
          versionNumber: targetVersion,
        },
      },
    });

    if (!targetVersionRecord) {
      return NextResponse.json(
        { error: `Không tìm thấy phiên bản v${targetVersion} để khôi phục` },
        { status: 404 }
      );
    }

    const nextVersion = currentDraft.currentVersion + 1;

    // 3. Thực hiện rollback trong transaction an toàn
    const result = await prisma.$transaction(async (tx) => {
      // Cập nhật DocumentDraft với nội dung của targetVersion
      const updatedDraft = await tx.documentDraft.update({
        where: { id },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          contentJson: targetVersionRecord.contentJson as any,
          currentVersion: nextVersion,
        },
      });

      // Tạo snapshot mới đánh dấu việc Rollback
      const newVersionSnapshot = await tx.draftVersion.create({
        data: {
          draftId: id,
          versionNumber: nextVersion,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          contentJson: targetVersionRecord.contentJson as any,
          editSource: "USER_MANUAL",
          changeSummary: `Khôi phục về phiên bản v${targetVersion}`,
          createdBy: session.user.id,
        },
      });

      // Ghi nhận vào Audit Trail
      await tx.auditLog.create({
        data: {
          draftId: id,
          actorId: session.user.id,
          actionType: "ROLLBACK",
          source: "HUMAN",
          details: {
            rolledBackToVersion: targetVersion,
            newVersion: nextVersion,
          },
        },
      });

      return {
        updatedDraft,
        newVersionSnapshot,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Đã khôi phục thành công văn bản về phiên bản v${targetVersion}`,
      version: nextVersion,
      contentJson: result.newVersionSnapshot.contentJson,
    });
  } catch (error) {
    console.error("Lỗi khi rollback phiên bản:", error);
    return NextResponse.json(
      { error: "Không thể khôi phục phiên bản" },
      { status: 500 }
    );
  }
}
