import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/drafts/[id]/duplicate
 * Nhân bản văn bản dự thảo (TASK-117).
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
    const existing = await prisma.documentDraft.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy văn bản để nhân bản" },
        { status: 404 }
      );
    }

    const cloned = await prisma.documentDraft.create({
      data: {
        userId: session.user.id,
        title: `${existing.title} (Bản sao)`,
        templateId: existing.templateId,
        folderId: existing.folderId,
        rawInputData: existing.rawInputData ?? undefined,
        contentJson: existing.contentJson as object,
        mode: existing.mode,
        status: "DRAFT",
        currentVersion: 1,
        wordCount: existing.wordCount,
      },
      include: {
        template: true,
      },
    });

    return NextResponse.json(cloned, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi nhân bản văn bản:", error);
    return NextResponse.json(
      { error: "Không thể nhân bản văn bản" },
      { status: 500 }
    );
  }
}
