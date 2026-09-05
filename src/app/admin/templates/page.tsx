"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  FileText,
  Building2,
  Sliders,
  Trash2,
  Edit,
  Globe,
  Lock,
  Layers,
  Loader2,
} from "lucide-react";

interface TemplateItem {
  id: string;
  title: string;
  description: string | null;
  industryPack: string | null;
  categoryId: string | null;
  isBuiltin: boolean;
  isPublished: boolean;
  usageCount: number;
  updatedAt: string;
  category?: { name: string } | null;
  creator?: { fullName: string; email: string } | null;
}

interface TemplateStats {
  totalTemplates: number;
  totalCustom: number;
  totalBuiltin: number;
  totalPublished: number;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [stats, setStats] = useState<TemplateStats>({
    totalTemplates: 0,
    totalCustom: 0,
    totalBuiltin: 0,
    totalPublished: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPack, setSelectedPack] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<"ALL" | "CUSTOM" | "BUILTIN">("ALL");

  useEffect(() => {
    let isMounted = true;
    async function fetchTemplates() {
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        if (selectedPack !== "ALL") params.set("industryPack", selectedPack);
        if (filterType === "CUSTOM") params.set("onlyCustom", "true");

        const res = await fetch(`/api/admin/templates?${params.toString()}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setTemplates(data.templates || []);
          if (data.stats) setStats(data.stats);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách mẫu:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchTemplates();
    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedPack, filterType]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mẫu "${title}" không?`)) return;
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Không thể xóa mẫu");
      }
    } catch (err) {
      console.error(err);
      alert("Đã có lỗi xảy ra khi xóa mẫu");
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });
      if (res.ok) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isPublished: !currentStatus } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (filterType === "CUSTOM") return !t.isBuiltin;
    if (filterType === "BUILTIN") return t.isBuiltin;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Quản trị Mẫu văn bản
          </h1>
          <p className="text-sm text-muted-foreground">
            Thiết kế form schema tùy chỉnh, quy chuẩn System Prompt và xuất bản dùng chung
          </p>
        </div>

        <Button asChild className="h-10 gap-2 font-semibold shadow-xs">
          <Link href="/admin/templates/builder">
            <Plus className="h-4 w-4" /> Thiết kế mẫu mới
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">Tổng số mẫu</span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
            {stats.totalTemplates}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sliders className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium">Mẫu tùy chỉnh</span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {stats.totalCustom}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium">Mẫu hệ thống NĐ 30</span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
            {stats.totalBuiltin}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium">Đang xuất bản</span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.totalPublished}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm mẫu theo tiêu đề, mã định danh..."
            className="h-10 pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Filter */}
          <div className="inline-flex rounded-lg border border-border/80 bg-muted/30 p-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                filterType === "ALL"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setFilterType("CUSTOM")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                filterType === "CUSTOM"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tùy chỉnh
            </button>
            <button
              type="button"
              onClick={() => setFilterType("BUILTIN")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                filterType === "BUILTIN"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mặc định
            </button>
          </div>

          {/* Industry Pack dropdown */}
          <select
            value={selectedPack}
            onChange={(e) => setSelectedPack(e.target.value)}
            aria-label="Lọc theo nhóm ngành"
            className="h-10 rounded-md border border-input bg-background px-3 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">Tất cả nhóm ngành</option>
            <option value="ADMIN">Hành chính - Văn phòng</option>
            <option value="LEGAL_CORP">Pháp chế & Doanh nghiệp</option>
            <option value="PMO">Ban QLDA & Xây dựng</option>
            <option value="EDU">Trường học & Giáo dục</option>
            <option value="PROPERTY">BQL Chung cư</option>
            <option value="HEALTHCARE">Y tế & Bệnh viện</option>
          </select>
        </div>
      </div>

      {/* Template Card Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-base font-semibold text-foreground">
            Không tìm thấy mẫu văn bản nào
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Thử thay đổi từ khóa tìm kiếm hoặc bấm nút bên dưới để tạo mẫu mới
          </p>
          <Button asChild className="mt-5 h-9 gap-1 text-xs">
            <Link href="/admin/templates/builder">
              <Plus className="h-3.5 w-3.5" /> Tạo mẫu ngay
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((t) => (
            <div
              key={t.id}
              className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md"
            >
              <div>
                {/* Badges */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      t.isBuiltin
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {t.isBuiltin ? "Mặc định NĐ 30" : "Tùy chỉnh"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleTogglePublish(t.id, t.isPublished)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      t.isPublished
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t.isPublished ? (
                      <>
                        <Globe className="h-3 w-3" /> Công khai
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" /> Bản nháp
                      </>
                    )}
                  </button>
                </div>

                {/* Title and ID */}
                <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                  {t.title}
                </h3>
                <code className="mt-1 block font-mono text-[11px] text-muted-foreground">
                  {t.id}
                </code>

                {/* Description */}
                {t.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {t.description}
                  </p>
                )}
              </div>

              {/* Footer details & actions */}
              <div className="mt-5 border-t border-border/50 pt-3">
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t.category?.name || t.categoryId || "Văn bản"}</span>
                  <span>{t.usageCount} lượt dùng</span>
                </div>

                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs font-medium"
                  >
                    <Link href={`/admin/templates/builder?id=${t.id}`}>
                      <Edit className="mr-1 h-3.5 w-3.5" /> Sửa
                    </Link>
                  </Button>

                  {!t.isBuiltin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(t.id, t.title)}
                      className="h-8 text-xs text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Xóa
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
