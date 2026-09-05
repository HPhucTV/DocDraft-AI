import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/folders
 * Lấy danh sách thư mục của người dùng hiện tại kèm số lượng văn bản và cây phân cấp (TASK-208).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const folders = await prisma.folder.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: {
            drafts: {
              where: {
                deletedAt: null,
              },
            },
            subFolders: true,
          },
        },
      },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("Lỗi khi tải danh sách thư mục:", error);
    return NextResponse.json(
      { error: "Không thể tải danh sách thư mục" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/folders
 * Tạo thư mục mới (hỗ trợ thư mục con lồng nhau và mã màu) (TASK-208).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, color = "#3b82f6", parentFolderId } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Tên thư mục không được để trống" },
        { status: 400 }
      );
    }

    // Nếu có parentFolderId, xác thực quyền sở hữu thư mục cha
    if (parentFolderId) {
      const parent = await prisma.folder.findFirst({
        where: {
          id: parentFolderId,
          userId: session.user.id,
        },
      });

      if (!parent) {
        return NextResponse.json(
          { error: "Thư mục cha không tồn tại hoặc không hợp lệ" },
          { status: 400 }
        );
      }
    }

    const newFolder = await prisma.folder.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        color: color?.slice(0, 7) || "#3b82f6",
        parentFolderId: parentFolderId || null,
      },
      include: {
        _count: {
          select: {
            drafts: true,
            subFolders: true,
          },
        },
      },
    });

    return NextResponse.json(newFolder, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi tạo thư mục:", error);
    return NextResponse.json(
      { error: "Không thể tạo thư mục" },
      { status: 500 }
    );
  }
}
