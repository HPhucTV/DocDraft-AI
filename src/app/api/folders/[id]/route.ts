import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/folders/[id]
 * Cập nhật tên, màu sắc, vị trí thư mục cha hoặc thứ tự sắp xếp (TASK-208).
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
    const existing = await prisma.folder.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Thư mục không tồn tại" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, color, parentFolderId, sortOrder } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataToUpdate: any = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Tên thư mục không được để trống" },
          { status: 400 }
        );
      }
      dataToUpdate.name = name.trim();
    }

    if (color !== undefined) {
      dataToUpdate.color = color?.slice(0, 7);
    }

    if (parentFolderId !== undefined) {
      // Tránh gán chính nó làm cha của nó
      if (parentFolderId === id) {
        return NextResponse.json(
          { error: "Không thể chọn chính thư mục này làm thư mục cha" },
          { status: 400 }
        );
      }

      if (parentFolderId !== null) {
        const parent = await prisma.folder.findFirst({
          where: { id: parentFolderId, userId: session.user.id },
        });
        if (!parent) {
          return NextResponse.json(
            { error: "Thư mục cha không hợp lệ" },
            { status: 400 }
          );
        }
      }
      dataToUpdate.parentFolderId = parentFolderId;
    }

    if (typeof sortOrder === "number") {
      dataToUpdate.sortOrder = sortOrder;
    }

    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: dataToUpdate,
      include: {
        _count: {
          select: {
            drafts: { where: { deletedAt: null } },
            subFolders: true,
          },
        },
      },
    });

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error("Lỗi khi cập nhật thư mục:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật thư mục" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/folders/[id]
 * Xóa thư mục (các văn bản bên trong tự động chuyển ra ngoài folder_id = null) (TASK-208).
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

  try {
    const existing = await prisma.folder.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Thư mục không tồn tại" },
        { status: 404 }
      );
    }

    // Cập nhật các thư mục con chuyển lên cấp của thư mục cha bị xóa
    await prisma.folder.updateMany({
      where: {
        parentFolderId: id,
        userId: session.user.id,
      },
      data: {
        parentFolderId: existing.parentFolderId,
      },
    });

    // Xóa thư mục
    await prisma.folder.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa thư mục thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa thư mục:", error);
    return NextResponse.json(
      { error: "Không thể xóa thư mục" },
      { status: 500 }
    );
  }
}
