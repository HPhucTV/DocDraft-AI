import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AnalyticsService } from "@/lib/admin/analytics-service";

/**
 * GET /api/admin/analytics/export
 * Xuất dữ liệu thống kê quản trị ra tệp CSV (UTF-8 BOM cho Excel tiếng Việt).
 */
export async function GET(req: NextRequest) {
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
    const timeRangeParam = (searchParams.get("timeRange") || "30d") as
      | "7d"
      | "30d"
      | "90d"
      | "all";

    const data = await AnalyticsService.getDashboardData(timeRangeParam);
    const csvContent = AnalyticsService.generateCsvReport(data);

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `docdraft-analytics-${dateStr}.csv`;

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
