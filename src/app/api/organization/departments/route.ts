import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getOrganization,
  addDepartment,
  deleteDepartment,
} from "@/lib/organization/org-service";

export const runtime = "nodejs";

/**
 * GET /api/organization/departments
 * Lấy danh mục phòng ban trực thuộc (TASK-504).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = getOrganization();
  return NextResponse.json(org.departments);
}

/**
 * POST /api/organization/departments
 * Thêm phòng ban mới vào cơ quan (Yêu cầu ADMIN).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Thao tác chỉ dành cho Quản trị viên" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, code, description, headName } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Tên và mã phòng ban không được để trống" },
        { status: 400 }
      );
    }

    const dept = addDepartment({ name, code, description, headName });
    return NextResponse.json({
      success: true,
      message: `Đã thêm phòng ban "${name}" thành công!`,
      data: dept,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/organization/departments
 * Xóa phòng ban theo ID (Yêu cầu ADMIN).
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Thao tác chỉ dành cho Quản trị viên" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID phòng ban" }, { status: 400 });
    }

    const ok = deleteDepartment(id);
    if (!ok) {
      return NextResponse.json({ error: "Không tìm thấy phòng ban để xóa" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa phòng ban thành công!",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
