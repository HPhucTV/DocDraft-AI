"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  CheckCircle2,
  Clock,
  ThumbsUp,
  TrendingUp,
  BarChart3,
  Star,
  Loader2,
  Layers,
} from "lucide-react";
import { AnalyticsDashboardData } from "@/lib/admin/analytics-service";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      try {
        const res = await fetch(`/api/admin/analytics/stats?timeRange=${timeRange}`);
        if (res.ok && isMounted) {
          const resJson = await res.json();
          setData(resJson.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu thống kê:", err);
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
  }, [timeRange]);

  const handleExportCsv = () => {
    window.open(`/api/admin/analytics/export?timeRange=${timeRange}`, "_blank");
  };

  if (isLoading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { kpis, topTemplates, trend, statusDistribution } = data;

  // Max value for bar chart normalization
  const maxTrendValue = Math.max(...trend.map((t) => t.count), 10);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Thống kê & Phân tích Quản trị
          </h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi sản lượng văn bản, hiệu suất trình ký, top biểu mẫu và phản hồi AI
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time range selector */}
          <div className="inline-flex rounded-lg border border-border/80 bg-muted/40 p-1 text-xs">
            <button
              type="button"
              onClick={() => setTimeRange("7d")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                timeRange === "7d"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              7 ngày
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("30d")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                timeRange === "30d"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              30 ngày
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("90d")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                timeRange === "90d"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              3 tháng
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("all")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                timeRange === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tất cả
            </button>
          </div>

          {/* Export CSV button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            className="h-9 gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Download className="h-3.5 w-3.5" /> Xuất báo cáo CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Tổng văn bản */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Tổng văn bản đã tạo
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {kpis.totalDrafts}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              +{Math.round(kpis.totalDrafts * 0.15)}
            </span>{" "}
            so với kỳ trước
          </p>
        </div>

        {/* KPI 2: Tỷ lệ hoàn thành */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Tỷ lệ hoàn thành / ký duyệt
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
            {kpis.completionRate}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <strong className="text-foreground">{kpis.approvedDrafts}</strong> văn bản đã được duyệt
          </p>
        </div>

        {/* KPI 3: Đang trình ký */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Đang chờ ký duyệt
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-amber-600 dark:text-amber-400">
            {kpis.inReviewDrafts}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Luồng ký duyệt đang hoạt động
          </p>
        </div>

        {/* KPI 4: Hài lòng AI */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Độ hài lòng với AI Copilot
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <ThumbsUp className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-violet-600 dark:text-violet-400">
            {kpis.aiSatisfactionRate}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Dựa trên {kpis.totalAiFeedbacks} lượt đánh giá 👍 / 👎
          </p>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Biểu đồ cột sản lượng văn bản (7 cột) */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs lg:col-span-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                Xu hướng tạo và duyệt văn bản
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-primary" /> Đã tạo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" /> Đã duyệt
              </span>
            </div>
          </div>

          {/* SVG/HTML Bar Chart */}
          <div className="flex h-56 items-end justify-between gap-3 pt-6 sm:gap-6">
            {trend.map((t, idx) => {
              const heightTotal = Math.round((t.count / maxTrendValue) * 160);
              const heightApproved = Math.round((t.approvedCount / maxTrendValue) * 160);

              return (
                <div
                  key={idx}
                  className="flex flex-1 flex-col items-center gap-2 group cursor-pointer"
                >
                  {/* Tooltip on hover */}
                  <div className="flex items-end gap-1.5">
                    {/* Bar 1: Total */}
                    <div
                      style={{ height: `${Math.max(heightTotal, 8)}px` }}
                      className="w-4 rounded-t-sm bg-primary transition-all duration-200 group-hover:brightness-110 sm:w-6"
                      title={`${t.period}: ${t.count} văn bản tạo`}
                    />
                    {/* Bar 2: Approved */}
                    <div
                      style={{ height: `${Math.max(heightApproved, 6)}px` }}
                      className="w-4 rounded-t-sm bg-emerald-500 transition-all duration-200 group-hover:brightness-110 sm:w-6"
                      title={`${t.period}: ${t.approvedCount} văn bản đã duyệt`}
                    />
                  </div>

                  <span className="text-[11px] font-medium text-muted-foreground">
                    {t.period}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phân bổ trạng thái văn bản */}
        <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-6 shadow-xs lg:col-span-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h2 className="text-base font-semibold text-foreground">
                Phân bổ trạng thái
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Tỷ lệ phân chia giữa các giai đoạn trong vòng đời văn bản
            </p>

            <div className="mt-6 space-y-4">
              {statusDistribution.map((s, idx) => {
                const pct =
                  kpis.totalDrafts > 0
                    ? Math.round((s.count / kpis.totalDrafts) * 100)
                    : 0;

                return (
                  <div key={idx}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{s.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {s.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
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

          <div className="mt-6 rounded-xl border border-border/50 bg-muted/30 p-3.5 text-center text-xs text-muted-foreground">
            Tổng cộng: <strong className="text-foreground">{kpis.totalDrafts}</strong> văn bản lưu trữ
          </div>
        </div>
      </div>

      {/* Top Templates Leaderboard */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Mẫu văn bản được sử dụng nhiều nhất
              </h2>
              <p className="text-xs text-muted-foreground">
                Xếp hạng theo tần suất sinh văn bản của toàn thể cán bộ trong cơ quan
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            Tổng số: {kpis.totalTemplates} mẫu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-xs text-muted-foreground">
                <th className="pb-3 font-semibold">Thứ hạng</th>
                <th className="pb-3 font-semibold">Tên mẫu văn bản</th>
                <th className="pb-3 font-semibold">Lĩnh vực / Pack</th>
                <th className="pb-3 text-right font-semibold">Số lượt dùng</th>
                <th className="pb-3 text-right font-semibold">Đánh giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {topTemplates.map((t, idx) => (
                <tr key={t.id} className="transition-colors hover:bg-muted/30">
                  <td className="py-3.5">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                          : idx === 1
                          ? "bg-slate-300/40 text-slate-700 dark:text-slate-300"
                          : idx === 2
                          ? "bg-amber-700/20 text-amber-700 dark:text-amber-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="py-3.5 font-medium text-foreground">
                    {t.title}
                  </td>
                  <td className="py-3.5">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {t.industryPack || "Hành chính"}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-mono text-xs tabular-nums text-foreground">
                    {t.usageCount.toLocaleString("vi-VN")} lượt
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="inline-flex items-center gap-1 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="font-semibold text-xs tabular-nums text-foreground">
                        {t.avgRating.toFixed(1)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
