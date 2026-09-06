"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  Star,
  Layers,
  ShieldCheck,
  Building2,
  UserCheck,
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Award,
  Check,
} from "lucide-react";
import { AnalyticsDashboardData, AnalyticsService } from "@/lib/admin/analytics-service";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [scope, setScope] = useState<"agency" | "personal">("personal");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("USER");

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics/stats?timeRange=${timeRange}&scope=${scope}`);
        if (res.ok && isMounted) {
          const resJson = await res.json();
          if (resJson.userRole) {
            setUserRole(resJson.userRole);
            // Nếu là cán bộ thường (USER), khóa cứng scope là personal
            if (resJson.userRole !== "ADMIN" && resJson.userRole !== "APPROVER") {
              setScope("personal");
            }
          }
          if (resJson.data) {
            setData(resJson.data);
          } else {
            setData(AnalyticsService.getMockDashboardData(scope, timeRange));
          }
        } else if (isMounted) {
          setData(AnalyticsService.getMockDashboardData(scope, timeRange));
        }
      } catch (err) {
        console.warn("Lỗi khi tải dữ liệu năng suất, kích hoạt chế độ xem trước:", err);
        if (isMounted) {
          setData(AnalyticsService.getMockDashboardData(scope, timeRange));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [timeRange, scope]);

  const handleExportCsv = () => {
    window.open(`/api/admin/analytics/export?timeRange=${timeRange}&scope=${scope}`, "_blank");
  };

  const isAdminOrApprover = userRole === "ADMIN" || userRole === "APPROVER";
  const activeData = data || AnalyticsService.getMockDashboardData(scope, timeRange);
  const { kpis, topTemplates, trend, statusDistribution, commonMistakes } = activeData;
  const maxTrendValue = Math.max(...trend.map((t) => t.count), 10);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16">
      {/* TOP NAV BAR */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              {isAdminOrApprover && scope === "agency"
                ? "Giám sát Tuân thủ & Năng suất Toàn cơ quan"
                : "Năng suất Soạn thảo Cá nhân"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {userRole === "ADMIN" && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="text-xs h-8 gap-1 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Hub
                </Button>
              </Link>
            )}
            <Link href="/editor">
              <Button size="sm" className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs">
                Vào Soạn thảo
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* BANNER DEMO / FALLBACK */}
        {activeData.isDemo && (
          <div className="p-3 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-emerald-50/90 dark:from-indigo-950/40 dark:via-sky-950/30 dark:to-emerald-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  Chế độ Xem trước & Dữ liệu Mô phỏng Chuẩn Nghị định 30
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Hệ thống đang hiển thị bộ số liệu trực quan mẫu để bạn đánh giá hiệu quả soạn thảo của DocDraft AI.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-300">
                Dữ liệu mẫu
              </span>
            </div>
          </div>
        )}

        {/* TOP HEADER & CONTROLS */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                {isAdminOrApprover && scope === "agency"
                  ? "Giám sát Tuân thủ Thể thức & Năng suất Toàn cơ quan"
                  : "Năng suất Soạn thảo & Tuân thủ Thể thức Cá nhân"}
              </h1>
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdminOrApprover && scope === "agency"
                ? "Kiểm soát quy chuẩn Nghị định 30/2020/NĐ-CP, tỷ lệ ký duyệt hồ sơ và thời gian tiết kiệm của toàn thể cán bộ"
                : "Báo cáo số giờ AI đã tiết kiệm cho bạn, tỷ lệ văn bản được ký duyệt và chỉ số tuân thủ thể thức của riêng bạn"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* DUAL-SCOPE SWITCHER (CHỈ HIỂN THỊ KHI LÀ ADMIN HOẶC APPROVER) */}
            {isAdminOrApprover ? (
              <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setScope("agency")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    scope === "agency"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Toàn cơ quan</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${scope === "agency" ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                    Lãnh đạo
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setScope("personal")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    scope === "personal"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Năng suất của tôi</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${scope === "personal" ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                    Cán bộ
                  </span>
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Góc nhìn Cá nhân cán bộ</span>
              </div>
            )}

            {/* Time range selector */}
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 text-xs shadow-xs">
              {(["7d", "30d", "90d", "all"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    timeRange === r
                      ? "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {r === "7d" ? "7 ngày" : r === "30d" ? "30 ngày" : r === "90d" ? "3 tháng" : "Tất cả"}
                </button>
              ))}
            </div>

            {/* Export CSV button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleExportCsv}
              className="h-9 gap-1.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600" />
              Xuất CSV
            </Button>
          </div>
        </div>

        {/* 4 CORE KPI CARDS THEO NGHỊ ĐỊNH 30 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1: CHỈ SỐ TUÂN THỦ THỂ THỨC NĐ 30 */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tuân thủ Thể thức NĐ 30
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black tabular-nums tracking-tight text-indigo-600 dark:text-indigo-400">
                  {kpis.complianceScore}%
                </span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Xuất sắc
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" />
              Bảng ẩn 2 cột & tiêu ngữ chuẩn NĐ 30
            </p>
          </div>

          {/* KPI 2: THỜI GIAN TIẾT KIỆM NHỜ AI */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {scope === "agency" ? "Giờ công tiết kiệm (Toàn viện)" : "Thời gian tiết kiệm cho tôi"}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
                  ~{kpis.hoursSaved}h
                </span>
                <span className="text-xs text-slate-500 font-semibold">giờ làm việc</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Tự động hóa căn lề, kẻ bảng ẩn & chuốt thô
            </p>
          </div>

          {/* KPI 3: TỔNG VĂN BẢN ĐÃ SOẠN */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-sky-300 dark:hover:border-sky-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {scope === "agency" ? "Sản lượng Văn bản Cơ quan" : "Văn bản tôi đã soạn"}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/70 dark:text-sky-400">
                  <FileText className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                  {kpis.totalDrafts}
                </span>
                <span className="text-xs text-slate-500 font-medium">văn bản</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-sky-500" />
              {kpis.approvedDrafts} văn bản đã được phê duyệt
            </p>
          </div>

          {/* KPI 4: TỶ LỆ PHÊ DUYỆT & ĐỘ HÀI LÒNG */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tỷ lệ Ký duyệt Thành công
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400">
                  <Award className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black tabular-nums tracking-tight text-amber-600 dark:text-amber-400">
                  {kpis.completionRate}%
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Duyệt ngay lần đầu
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              Độ hài lòng AI Copilot: {kpis.aiSatisfactionRate}%
            </p>
          </div>
        </div>

        {/* BIỂU ĐỒ NĂNG SUẤT & TRẠNG THÁI HỒ SƠ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* CỘT TRÁI (2 CỘT): BIỂU ĐỒ XU HƯỚNG SOẠN THẢO */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Xu hướng Soạn thảo & Xử lý Văn bản</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Số lượng văn bản được khởi tạo và hoàn thiện qua các mốc thời gian
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2.5 py-1 rounded-xl">
                {timeRange === "7d" ? "7 ngày gần nhất" : timeRange === "30d" ? "30 ngày gần nhất" : "Chu kỳ hiện tại"}
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-6 pb-2">
              <div className="flex items-end gap-2 sm:gap-3 h-48 w-full">
                {trend.map((t, idx) => {
                  const heightPercent = Math.max(Math.round((t.count / maxTrendValue) * 100), 8);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                        {t.count}
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[32px] rounded-xl bg-gradient-to-t from-indigo-600 to-sky-400 group-hover:from-indigo-700 group-hover:to-sky-300 transition-all shadow-xs"
                      />
                      <span className="text-[10px] text-slate-500 truncate w-full text-center">
                        {t.period}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (1 CỘT): TRẠNG THÁI HỒ SƠ & TIẾN ĐỘ TRÌNH KÝ */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Tiến độ Hồ sơ & Ký duyệt</span>
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Phân bố trạng thái văn bản trong quy trình xử lý
              </p>

              <div className="space-y-4">
                {statusDistribution.map((item, idx) => {
                  const pct = kpis.totalDrafts > 0 ? Math.round((item.count / kpis.totalDrafts) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                        </span>
                        <span className="tabular-nums font-bold text-slate-900 dark:text-slate-100">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Đang xử lý trong luồng ký:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {kpis.inReviewDrafts} văn bản
              </span>
            </div>
          </div>
        </div>

        {/* BẢNG CHẨN ĐOÁN LỖI THỂ THỨC THƯỜNG GẶP & TOP MẪU SỬ DỤNG */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* BẢNG CHẨN ĐOÁN LỖI THỂ THỨC NĐ 30 ĐÃ ĐƯỢC TỰ ĐỘNG SỬA */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Chẩn đoán Thể thức NĐ 30 Thường gặp</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các lỗi định dạng phổ biến được hệ thống AI phát hiện và tự động khắc phục
                </p>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                AI Auto-Fixed
              </span>
            </div>

            <div className="space-y-3">
              {commonMistakes.map((mistake, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {mistake.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Đã tự động sửa chuẩn hóa
                        </span>
                        <span>&bull;</span>
                        <span>{mistake.count} trường hợp</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 tabular-nums">
                      {mistake.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOP BIỂU MẪU SỬ DỤNG NHIỀU NHẤT */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Top Biểu mẫu Sử dụng Hiệu quả</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {scope === "agency"
                      ? "Các mẫu văn bản hành chính được toàn cơ quan sử dụng nhiều nhất"
                      : "Các biểu mẫu bạn thường xuyên ứng dụng trong công việc"}
                  </p>
                </div>
                <Link href="/templates">
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400 h-8 font-semibold">
                    Xem thư viện
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {topTemplates.map((template, idx) => (
                  <div
                    key={template.id}
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {template.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {template.industryPack || "Hành chính"} &bull; Tiết kiệm ~45 phút/văn bản
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {template.usageCount} lượt dùng
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">Khởi tạo văn bản mới với AI:</span>
              <Link href="/editor">
                <Button size="sm" className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs">
                  Bắt đầu soạn thảo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
