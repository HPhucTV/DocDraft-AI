import { NextRequest, NextResponse } from "next/server";
import { getOrganization, updateOrganizationProfile } from "@/lib/organization/org-service";

export const runtime = "nodejs";

/**
 * GET /api/organization
 * Lấy thông tin cơ quan/doanh nghiệp, danh sách phòng ban và nhân sự trực thuộc (TASK-504).
 */
export async function GET() {
  const org = getOrganization();
  return NextResponse.json(org);
}

/**
 * PATCH /api/organization
 * Cập nhật thông tin pháp nhân (Tên cơ quan, cơ quan cấp trên, địa chỉ, MST, liên hệ).
 */
export async function PATCH(req: NextRequest) {
  try {
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
