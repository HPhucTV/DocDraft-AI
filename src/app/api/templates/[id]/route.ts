import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/templates/[id]
 * Xóa mẫu văn bản do người dùng hiện tại tạo
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID mẫu không hợp lệ" }, { status: 400 });
  }

  try {
    const existing = await prisma.template.findUnique({
      where: { id },
      select: { id: true, isBuiltin: true, createdBy: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy mẫu văn bản" }, { status: 404 });
    }

    if (existing.isBuiltin) {
      return NextResponse.json(
        { error: "Không được phép xóa mẫu văn bản quy chuẩn của hệ thống" },
        { status: 403 }
      );
    }

    if (existing.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: "Bạn không có quyền xóa mẫu văn bản của người khác" },
        { status: 403 }
      );
    }

    await prisma.template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Đã xóa mẫu văn bản thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa template:", error);
    return NextResponse.json(
      { error: "Không thể xóa mẫu văn bản" },
      { status: 500 }
    );
  }
}
