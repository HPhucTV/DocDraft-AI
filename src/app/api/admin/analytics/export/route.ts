import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AnalyticsService } from "@/lib/admin/analytics-service";

/**
 * GET /api/admin/analytics/export
 * Xuất dữ liệu thống kê tuân thủ NĐ 30 & năng suất ra tệp CSV (UTF-8 BOM cho Excel tiếng Việt).
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

    const userRole = session?.user?.role || "GUEST";
    const userId = session?.user?.id;

    const effectiveScope = (userRole === "ADMIN" || userRole === "APPROVER")
      ? requestedScope
      : (session?.user ? "personal" : requestedScope);

    const data = await AnalyticsService.getDashboardData(timeRangeParam, effectiveScope, userId);
    const csvContent = AnalyticsService.generateCsvReport(data);

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `docdraft-nd30-analytics-${effectiveScope}-${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/analytics/export] Error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi xuất tệp báo cáo CSV" },
      { status: 500 }
    );
  }
}
