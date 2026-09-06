import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getOrganization,
  addMember,
  updateMember,
  removeMember,
} from "@/lib/organization/org-service";

export const runtime = "nodejs";

/**
 * GET /api/organization/members
 * Danh sách thành viên tổ chức kèm phân quyền RBAC (TASK-504).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = getOrganization();
  return NextResponse.json(org.members);
}

/**
 * POST /api/organization/members
 * Mời hoặc gán cán bộ mới vào phòng ban (Yêu cầu ADMIN).
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
    const { fullName, email, role = "USER", departmentId, jobTitle } = body;

    if (!fullName || !email || !departmentId) {
      return NextResponse.json(
        { error: "Họ tên, email và phòng ban là bắt buộc" },
        { status: 400 }
      );
    }

    const member = addMember({
      fullName,
      email,
      role,
      departmentId,
      jobTitle,
    });

    return NextResponse.json({
      success: true,
      message: `Đã thêm cán bộ "${fullName}" vào hệ thống!`,
      data: member,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/organization/members
 * Cập nhật vai trò RBAC hoặc chuyển phòng ban cho cán bộ (Yêu cầu ADMIN).
 */
export async function PATCH(req: NextRequest) {
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
    const { memberId, role, departmentId, jobTitle, status } = body;

    if (!memberId) {
      return NextResponse.json({ error: "Thiếu ID cán bộ" }, { status: 400 });
    }

    const updated = updateMember(memberId, {
      role,
      departmentId,
      jobTitle,
      status,
    });

    if (!updated) {
      return NextResponse.json({ error: "Không tìm thấy cán bộ" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật thông tin cán bộ thành công!",
      data: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/organization/members
 * Xóa hoặc thu hồi quyền truy cập của cán bộ (Yêu cầu ADMIN).
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
      return NextResponse.json({ error: "Thiếu ID cán bộ" }, { status: 400 });
    }

    const ok = removeMember(id);
    if (!ok) {
      return NextResponse.json({ error: "Không tìm thấy cán bộ để xóa" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa cán bộ khỏi tổ chức thành công!",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
