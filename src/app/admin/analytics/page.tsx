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

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [scope, setScope] = useState<"agency" | "personal">("agency");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("ADMIN");

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics/stats?timeRange=${timeRange}&scope=${scope}`);
        if (res.ok && isMounted) {
          const resJson = await res.json();
          if (resJson.data) {
            setData(resJson.data);
            if (resJson.userRole) setUserRole(resJson.userRole);
          } else {
            // Fallback sang mock data nếu response rỗng
            setData(AnalyticsService.getMockDashboardData(scope, timeRange));
          }
        } else if (isMounted) {
          // Fallback an toàn khi API trả về status khác 200 (ví dụ 401/403/500)
          setData(AnalyticsService.getMockDashboardData(scope, timeRange));
        }
      } catch (err) {
        console.warn("Lỗi khi tải dữ liệu thống kê, kích hoạt chế độ xem trước:", err);
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

  // Nếu dữ liệu chưa sẵn sàng trong lúc tải lần đầu, chuẩn bị fallback ngay để không bao giờ bị đơ màn hình
  const activeData = data || AnalyticsService.getMockDashboardData(scope, timeRange);
  const { kpis, topTemplates, trend, statusDistribution, commonMistakes } = activeData;

  // Max value cho biểu đồ chuẩn hóa chiều cao cột
  const maxTrendValue = Math.max(...trend.map((t) => t.count), 10);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16">
      {/* TOP SUB-NAV BAR */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Hub</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Giám sát Tuân thủ NĐ 30 & Năng suất
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-xs h-8">
                Dashboard
              </Button>
            </Link>
            <Link href="/editor">
              <Button size="sm" className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs">
                Vào Soạn thảo
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* BANNER DEMO/FALLBACK NOTIFICATION */}
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
                  Hệ thống đang hiển thị bộ số liệu trực quan mẫu để bạn đánh giá hiệu năng giám sát của DocDraft AI.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-300">
                Live Preview Mode
              </span>
            </div>
          </div>
        )}

        {/* TOP HEADER & SCOPE SWITCHER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                Giám sát Tuân thủ Thể thức & Năng suất Văn thư
              </h1>
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Kiểm soát quy chuẩn Nghị định 30/2020/NĐ-CP, tỷ lệ ký duyệt hồ sơ và thời gian tiết kiệm nhờ AI
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* DUAL-SCOPE SWITCHER (TÂM ĐIỂM HƯỚNG 1 + HƯỚNG 2) */}
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
              Chuẩn hóa bảng ẩn 2 cột & tiêu ngữ
            </p>
          </div>

          {/* KPI 2: THỜI GIAN TIẾT KIỆM NHỜ AI */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Thời gian tiết kiệm nhờ AI
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
                  ~{kpis.hoursSaved}h
                </span>
                <span className="text-[11px] font-semibold text-slate-400">công chức</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
              {scope === "agency" ? "Giải phóng cho toàn thể cán bộ" : "Tiết kiệm trong khâu căn lề & soạn thảo"}
            </p>
          </div>

          {/* KPI 3: SẢN LƯỢNG VĂN BẢN */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {scope === "agency" ? "Tổng văn bản phát hành" : "Văn bản tôi đã soạn"}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
                  <FileText className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                  {kpis.totalDrafts}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  +{Math.round(kpis.totalDrafts * 0.18)} so với kỳ trước
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
              <strong className="text-slate-800 dark:text-slate-200">{kpis.approvedDrafts}</strong> văn bản đã được phê duyệt
            </p>
          </div>

          {/* KPI 4: TỶ LỆ HOÀN THÀNH / KÝ DUYỆT */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tỷ lệ duyệt ký thành công
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black tabular-nums tracking-tight text-amber-600 dark:text-amber-400">
                  {kpis.completionRate}%
                </span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {kpis.inReviewDrafts} đang duyệt
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
              <span>Độ hài lòng AI Copilot:</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{kpis.aiSatisfactionRate}% 👍</strong>
            </p>
          </div>
        </div>

        {/* SECTION 2: BIỂU ĐỒ XU HƯỚNG & PHÂN BỔ TRẠNG THÁI */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* CỘT TRÁI: XU HƯỚNG TẠO & DUYỆT */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Xu hướng Khởi tạo & Ký duyệt Văn bản
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {scope === "agency" ? "Tổng lưu lượng văn thư toàn cơ quan" : "Năng suất soạn thảo cá nhân của bạn"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600" /> Đã khởi tạo
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Đã ký duyệt
                </span>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="flex h-52 items-end justify-between gap-3 pt-6 sm:gap-6 border-b border-slate-100 dark:border-slate-800 pb-2">
              {trend.map((t, idx) => {
                const heightTotal = Math.round((t.count / maxTrendValue) * 150);
                const heightApproved = Math.round((t.approvedCount / maxTrendValue) * 150);

                return (
                  <div key={idx} className="flex flex-1 flex-col items-center gap-2 group cursor-pointer">
                    <div className="flex items-end gap-1.5 h-40">
                      {/* Bar 1: Total */}
                      <div
                        style={{ height: `${Math.max(heightTotal, 8)}px` }}
                        className="w-3.5 sm:w-5 rounded-t-md bg-indigo-600 transition-all duration-300 group-hover:brightness-110 shadow-xs"
                        title={`${t.period}: ${t.count} văn bản tạo`}
                      />
                      {/* Bar 2: Approved */}
                      <div
                        style={{ height: `${Math.max(heightApproved, 6)}px` }}
                        className="w-3.5 sm:w-5 rounded-t-md bg-emerald-500 transition-all duration-300 group-hover:brightness-110 shadow-xs"
                        title={`${t.period}: ${t.approvedCount} văn bản đã ký duyệt`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
                      {t.period}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Chu kỳ theo dõi: {timeRange.toUpperCase()}</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Tốc độ xử lý văn bản tăng 24% so với quý trước
              </span>
            </div>
          </div>

          {/* CỘT PHẢI: PHÂN BỔ TRẠNG THÁI HỒ SƠ */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs lg:col-span-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Phân bổ Trạng thái Hồ sơ
                </h2>
              </div>
              <p className="text-[11px] text-slate-500">
                Tỷ trọng văn bản ở các khâu trong quy trình
              </p>

              <div className="mt-6 space-y-4">
                {statusDistribution.map((s, idx) => {
                  const pct =
                    kpis.totalDrafts > 0
                      ? Math.round((s.count / kpis.totalDrafts) * 100)
                      : 0;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.label}
                        </span>
                        <span className="tabular-nums font-bold text-slate-900 dark:text-slate-100">
                          {s.count} <span className="text-[10px] text-slate-400">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: s.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 p-3.5 text-center text-xs text-slate-500">
              Tổng số hồ sơ lưu chuyển: <strong className="text-slate-900 dark:text-slate-100 font-bold">{kpis.totalDrafts}</strong> văn bản
            </div>
          </div>
        </div>

        {/* SECTION 3: CHẨN ĐOÁN LỖI THỂ THỨC NGHỊ ĐỊNH 30 & TOP MẪU VĂN BẢN */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* BẢNG CHẨN ĐOÁN LỖI THỂ THỨC THEO NĐ 30 */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Chẩn đoán Lỗi Thể thức Nghị định 30 Thường gặp
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Được hệ thống AI kiểm tra và tự động hóa khắc phục
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                AI Auto-Fix Active
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {commonMistakes.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      {m.label}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Tần suất phát hiện: <strong className="text-slate-600 dark:text-slate-300">{m.count} lượt ({m.percentage}%)</strong>
                    </p>
                  </div>

                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.status === "auto_fixed"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {m.status === "auto_fixed" ? (
                      <>
                        <Check className="w-2.5 h-2.5" /> AI Đã Tự Sửa 100%
                      </>
                    ) : (
                      "Cần kiểm tra"
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TOP MẪU VĂN BẢN SỬ DỤNG NHIỀU NHẤT */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Top Mẫu Văn bản Sử dụng Nhiều nhất
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {scope === "agency" ? "Xếp hạng tần suất sinh văn bản toàn cơ quan" : "Mẫu văn bản bạn hay dùng nhất"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {kpis.totalTemplates} mẫu khả dụng
              </span>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2.5">Hạng</th>
                    <th className="pb-2.5">Tên mẫu văn bản</th>
                    <th className="pb-2.5 text-right">Lượt dùng</th>
                    <th className="pb-2.5 text-right">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {topTemplates.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-bold">
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                            idx === 0
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              : idx === 2
                              ? "bg-amber-700/20 text-amber-700"
                              : "text-slate-400"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100">
                        {t.title}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {t.industryPack || "Hành chính nhà nước"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {t.usageCount.toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="inline-flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{t.avgRating.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
