"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  BarChart3,
  Layers,
  FileText,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Users,
  Settings,
  FolderTree,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function AdminHubPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight">DocDraft Admin Hub</h1>
              <p className="text-xs text-slate-500">Trung tâm Quản trị Cấp cao & Đa tổ chức</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Về Dashboard
              </Button>
            </Link>
            <Link href="/editor">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-xs">
                <FileText className="w-3.5 h-3.5" />
                Vào Soạn thảo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Hệ sinh thái Doanh nghiệp & Cơ quan Nhà nước
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            Quản trị Toàn diện DOCDRAFT AI
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl">
            Chọn phân hệ quản trị để cấu hình đơn vị, theo dõi chỉ số sử dụng AI, thiết kế mẫu văn bản nội bộ hoặc quản lý nhân sự theo phòng ban.
          </p>
        </div>

        {/* 3 CORE ADMIN TILES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TILE 1: MULTI-TENANT ORGANIZATION */}
          <Link
            href="/admin/organization"
            className="group p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Đa Tổ chức & Phòng ban
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Mới (Phase 5)
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Cấu hình pháp nhân cơ quan, sơ đồ phòng ban, phân quyền cán bộ RBAC, và kho mẫu lưu hành nội bộ riêng của đơn vị.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <span>Mở quản trị tổ chức</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* TILE 2: ANALYTICS DASHBOARD */}
          <Link
            href="/admin/analytics"
            className="group p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Thống kê & Phân tích
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Theo dõi tần suất gọi AI, top mẫu được sử dụng nhiều nhất, tỷ lệ hoàn thành luồng trình ký và xuất báo cáo CSV.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
              <span>Xem biểu đồ phân tích</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* TILE 3: CUSTOM TEMPLATE BUILDER */}
          <Link
            href="/admin/templates"
            className="group p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Trình Thiết kế Mẫu tùy chỉnh
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Thiết kế form schema nhập liệu, soạn thảo System Prompt chuyên biệt và xuất bản mẫu văn bản hành chính mới cho đơn vị.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
              <span>Tạo & quản lý mẫu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
