import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOrganization, updateOrganizationProfile } from "@/lib/organization/org-service";

export const runtime = "nodejs";

/**
 * GET /api/organization
 * Lấy thông tin cơ quan/doanh nghiệp, danh sách phòng ban và nhân sự trực thuộc (TASK-504).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = getOrganization();
  return NextResponse.json(org);
}

/**
 * PATCH /api/organization
 * Cập nhật thông tin pháp nhân (Tên cơ quan, cơ quan cấp trên, địa chỉ, MST, liên hệ). Yêu cầu ADMIN.
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
    const updated = updateOrganizationProfile(body);
    return NextResponse.json({
      success: true,
      message: "Cập nhật thông tin cơ quan thành công!",
      data: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
