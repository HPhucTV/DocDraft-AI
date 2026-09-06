import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AnalyticsService } from "@/lib/admin/analytics-service";

/**
 * GET /api/admin/analytics/stats
 * Lấy số liệu phân tích thống kê tuân thủ NĐ 30 & năng suất văn thư.
 * Hỗ trợ phân quyền mềm dẻo: Toàn cơ quan cho Lãnh đạo & Năng suất cá nhân cho Cán bộ.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const timeRangeParam = (searchParams.get("timeRange") || "30d") as
      | "7d"
      | "30d"
      | "90d"
      | "all";
    const requestedScope = (searchParams.get("scope") || "agency") as "agency" | "personal";

    // Phân quyền mềm dẻo:
    // Nếu chưa đăng nhập: Trả về Demo Data trực quan chuẩn NĐ 30 thay vì quăng 401 làm treo UI
    if (!session?.user?.id) {
      const demoData = AnalyticsService.getMockDashboardData(requestedScope, timeRangeParam);
      return NextResponse.json({
        success: true,
        data: demoData,
        userRole: "GUEST",
        isDemo: true,
      });
    }

    const userRole = session.user.role || "USER";
    const userId = session.user.id;

    // Lãnh đạo hoặc Admin có thể xem cả toàn cơ quan hoặc cá nhân; Cán bộ thường xem cá nhân
    const effectiveScope = (userRole === "ADMIN" || userRole === "APPROVER")
      ? requestedScope
      : "personal";

    const data = await AnalyticsService.getDashboardData(timeRangeParam, effectiveScope, userId);

    return NextResponse.json({
      success: true,
      data,
      userRole,
      isDemo: !!data.isDemo,
    });
  } catch (error) {
    console.error("[GET /api/admin/analytics/stats] Error:", error);
    // Nếu có lỗi hệ thống, fallback an toàn sang Mock Data thay vì quăng lỗi 500 làm treo UI
    const fallbackData = AnalyticsService.getMockDashboardData("agency", "30d");
    return NextResponse.json({
      success: true,
      data: fallbackData,
      isDemo: true,
    });
  }
}
