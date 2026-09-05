import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AnalyticsService } from "@/lib/admin/analytics-service";

/**
 * GET /api/admin/analytics/stats
 * Lấy số liệu phân tích thống kê văn bản, tỷ lệ duyệt, top mẫu (TASK-411).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    // Allow query if logged in (or internal admin dashboard)
    const { searchParams } = new URL(req.url);
    const timeRangeParam = (searchParams.get("timeRange") || "30d") as
      | "7d"
      | "30d"
      | "90d"
      | "all";

    const data = await AnalyticsService.getDashboardData(timeRangeParam);

    return NextResponse.json({
      success: true,
      data,
      userRole: session?.user?.role || "ADMIN",
    });
  } catch (error) {
    console.error("[GET /api/admin/analytics/stats] Error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tải dữ liệu phân tích" },
      { status: 500 }
    );
  }
}
