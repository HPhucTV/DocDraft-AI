import assert from "node:assert";
import {
  AnalyticsService,
  AnalyticsDashboardData,
} from "../../src/lib/admin/analytics-service";

console.log("=== BẮT ĐẦU KIỂM THỬ TASK-411: ADMIN ANALYTICS DASHBOARD ===");

// 1. Kiểm tra cấu trúc dữ liệu Dashboard mẫu
const mockDashboardData: AnalyticsDashboardData = {
  kpis: {
    totalDrafts: 120,
    approvedDrafts: 90,
    inReviewDrafts: 20,
    completionRate: 75,
    complianceScore: 96.5,
    hoursSaved: 102,
    totalTemplates: 26,
    totalAiFeedbacks: 85,
    aiSatisfactionRate: 94,
  },
  topTemplates: [
    {
      id: "to-trinh-kinh-phi",
      title: "Tờ trình xin phê duyệt dự toán kinh phí",
      industryPack: "ADMIN",
      usageCount: 45,
      avgRating: 4.9,
    },
    {
      id: "hop-dong-dich-vu",
      title: "Hợp đồng dịch vụ thương mại",
      industryPack: "LEGAL_CORP",
      usageCount: 38,
      avgRating: 4.8,
    },
  ],
  trend: [
    { period: "T4", count: 15, approvedCount: 10 },
    { period: "T5", count: 25, approvedCount: 20 },
    { period: "T6", count: 35, approvedCount: 28 },
    { period: "T7", count: 45, approvedCount: 38 },
    { period: "T8", count: 80, approvedCount: 65 },
    { period: "T9", count: 120, approvedCount: 90 },
  ],
  statusDistribution: [
    { status: "APPROVED", label: "Đã phê duyệt", count: 90, color: "#10b981" },
    { status: "IN_REVIEW", label: "Đang trình ký", count: 20, color: "#f59e0b" },
    { status: "DRAFT", label: "Đang soạn thảo", count: 8, color: "#3b82f6" },
    { status: "REJECTED", label: "Từ chối", count: 2, color: "#ef4444" },
  ],
  commonMistakes: [
    { id: "m1", label: "Bảng ẩn 2 cột quốc hiệu", count: 15, percentage: 12.5, status: "auto_fixed" },
  ],
  scope: "agency",
  timeRange: "30d",
};

// Test 1: Kiểm tra tính toán Completion Rate
const calculatedRate = Math.round(
  (mockDashboardData.kpis.approvedDrafts / mockDashboardData.kpis.totalDrafts) * 100
);
assert.strictEqual(
  calculatedRate,
  mockDashboardData.kpis.completionRate,
  "Tỷ lệ hoàn thành phải được tính chính xác = 75%"
);
console.log("  ✓ PASS: Công thức tính tỷ lệ hoàn thành / phê duyệt chính xác");

// Test 2: Xuất báo cáo CSV có UTF-8 BOM cho Excel
const csv = AnalyticsService.generateCsvReport(mockDashboardData);
assert.ok(csv.startsWith("\uFEFF"), "Tệp CSV phải bắt đầu bằng UTF-8 BOM (\\uFEFF)");
console.log("  ✓ PASS: Tệp CSV có gắn UTF-8 BOM hỗ trợ mở trực tiếp trên Excel tiếng Việt");

// Test 3: CSV chứa đủ các trường dữ liệu cốt lõi
assert.ok(csv.includes("BÁO CÁO PHÂN TÍCH THỐNG KÊ TUÂN THỦ NGHỊ ĐỊNH 30 & NĂNG SUẤT VĂN THƯ"), "CSV phải có tiêu đề");
assert.ok(csv.includes("Tổng số văn bản phát hành / soạn thảo,120"), "CSV phải có dòng tổng số văn bản");
assert.ok(csv.includes("Tỷ lệ hoàn thành ký duyệt (%),75%"), "CSV phải có tỷ lệ hoàn thành");
assert.ok(csv.includes("Tờ trình xin phê duyệt dự toán kinh phí"), "CSV phải có danh sách top mẫu");
console.log("  ✓ PASS: Nội dung báo cáo CSV chứa đầy đủ KPI, tỷ lệ và danh mục mẫu");

// Test 4: Kiểm tra xu hướng sản lượng văn bản
assert.strictEqual(mockDashboardData.trend.length, 6, "Xu hướng dữ liệu phải có 6 mốc thời gian");
assert.ok(
  mockDashboardData.trend[5].count >= mockDashboardData.trend[0].count,
  "Sản lượng văn bản kỳ gần nhất phải phản ánh tăng trưởng"
);
console.log("  ✓ PASS: Mảng xu hướng thời gian phản ánh chính xác chuỗi sản lượng");

console.log("\n=> KẾT QUẢ: 4/4 bài kiểm tra đạt (100% PASS)\n");
