import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { TemplateService } from "@/lib/templates/template-service";

/**
 * GET /api/admin/templates/[id]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await TemplateService.getTemplateById(id);

    if (!template) {
      return NextResponse.json(
        { error: "Không tìm thấy mẫu văn bản" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("[GET /api/admin/templates/[id]] Error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tải mẫu văn bản" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/templates/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để thực hiện thao tác này" },
        { status: 401 }
      );
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Thao tác chỉ dành cho Quản trị viên." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await TemplateService.deleteCustomTemplate(id);

    return NextResponse.json({
      success: true,
      message: "Đã xóa mẫu văn bản thành công",
    });
  } catch (error: unknown) {
    console.error("[DELETE /api/admin/templates/[id]] Error:", error);
    const message =
      error instanceof Error ? error.message : "Lỗi khi xóa mẫu văn bản";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * PATCH /api/admin/templates/[id]
 * Bật/tắt trạng thái xuất bản
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để thực hiện thao tác này" },
        { status: 401 }
      );
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Thao tác chỉ dành cho Quản trị viên." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    if (typeof body.isPublished !== "boolean") {
      return NextResponse.json(
        { error: "isPublished phải là giá trị boolean" },
        { status: 400 }
      );
    }

    const updated = await TemplateService.togglePublish(id, body.isPublished);

    return NextResponse.json({
      success: true,
      template: updated,
      message: body.isPublished ? "Đã xuất bản mẫu" : "Đã chuyển mẫu về bản nháp",
    });
  } catch (error: unknown) {
    console.error("[PATCH /api/admin/templates/[id]] Error:", error);
    const message =
      error instanceof Error ? error.message : "Lỗi khi cập nhật trạng thái";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
