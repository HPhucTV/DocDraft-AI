import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/drafts
 * Danh sách bản nháp của người dùng với bộ lọc trạng thái, tìm kiếm và phân trang (TASK-117).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status")?.trim();
  const folderId = searchParams.get("folderId")?.trim();
  const industryPack = searchParams.get("industryPack")?.trim();
  const isTrash = searchParams.get("trash") === "true";

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      userId: session.user.id,
      deletedAt: isTrash ? { not: null } : null,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (folderId) {
      if (folderId === "UNORGANIZED" || folderId === "none") {
        where.folderId = null;
      } else {
        where.folderId = folderId;
      }
    }

    if (industryPack && industryPack !== "ALL") {
      where.template = {
        industryPack: industryPack,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { template: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    const drafts = await prisma.documentDraft.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            industryPack: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(drafts);
  } catch (error) {
    console.error("Lỗi khi tải danh sách bản nháp:", error);
    return NextResponse.json(
      { error: "Không thể tải danh sách bản nháp" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drafts
 * Khởi tạo bản nháp mới từ mẫu hoặc soạn thảo tự do (TASK-117).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      templateId,
      folderId,
      rawInputData,
      contentJson,
      mode = "FORM",
    } = body;

    const defaultContentJson = contentJson || {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "" }],
        },
      ],
    };

    // Tính số từ sơ bộ nếu có nội dung
    const wordCount = typeof body.wordCount === "number" ? body.wordCount : 0;

    const newDraft = await prisma.documentDraft.create({
      data: {
        userId: session.user.id,
        title: title || "Văn bản dự thảo mới",
        templateId: templateId || null,
        folderId: folderId || null,
        rawInputData: rawInputData || null,
        contentJson: defaultContentJson,
        mode,
        status: "DRAFT",
        currentVersion: 1,
        wordCount,
      },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            industryPack: true,
          },
        },
      },
    });

    // Tạo phiên bản lịch sử v1
    await prisma.draftVersion.create({
      data: {
        draftId: newDraft.id,
        versionNumber: 1,
        contentJson: defaultContentJson,
        editSource: "USER_MANUAL",
        changeSummary: "Khởi tạo bản nháp ban đầu",
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(newDraft, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi tạo bản nháp mới:", error);
    return NextResponse.json(
      { error: "Không thể tạo bản nháp mới" },
      { status: 500 }
    );
  }
}
