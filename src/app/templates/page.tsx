"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Search,
  ArrowLeft,
  FileText,
  Layers,
  ShieldCheck,
  Building2,
  Users,
  DollarSign,
  ClipboardList,
  Briefcase,
  ArrowRight,
  Eye,
  CheckCircle2,
  Tag,
  Clock,
  Check,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { FormSchema } from "@/types/form-schema";
import { SEED_TEMPLATES } from "../../../prisma/data/templates";

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  industryPack: string;
  formSchema?: FormSchema;
  userPromptTemplate?: string;
  isBuiltin?: boolean;
  isCustom?: boolean;
}

const CATEGORIES = [
  { id: "ALL", label: "Tất cả mẫu", icon: FileText, count: 0 },
  { id: "ADMINISTRATIVE", label: "Hành chính công (NĐ 30)", icon: ShieldCheck, count: 0 },
  { id: "PERSONNEL", label: "Nhân sự & Lao động", icon: Users, count: 0 },
  { id: "FINANCE", label: "Tài chính & Kinh phí", icon: DollarSign, count: 0 },
  { id: "MINUTES", label: "Biên bản & Bàn giao", icon: ClipboardList, count: 0 },
  { id: "ENTERPRISE", label: "Doanh nghiệp & Hợp đồng", icon: Briefcase, count: 0 },
];

export default function TemplateLibraryPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTemplates() {
      try {
        const res = await fetch("/api/templates");
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data && data.length > 0) {
            setTemplates(data);
          } else {
            // Fallback sang seed data chuẩn
            setTemplates(
              SEED_TEMPLATES.map((t) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                industryPack: t.industryPack,
                formSchema: t.formSchema,
                userPromptTemplate: t.userPromptTemplate,
                isBuiltin: true,
              }))
            );
          }
        } else if (isMounted) {
          setTemplates(
            SEED_TEMPLATES.map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              industryPack: t.industryPack,
              formSchema: t.formSchema,
              userPromptTemplate: t.userPromptTemplate,
              isBuiltin: true,
            }))
          );
        }
      } catch (err) {
        console.warn("Lỗi khi tải biểu mẫu, chuyển sang dữ liệu mẫu tĩnh:", err);
        if (isMounted) {
          setTemplates(
            SEED_TEMPLATES.map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              industryPack: t.industryPack,
              formSchema: t.formSchema,
              userPromptTemplate: t.userPromptTemplate,
              isBuiltin: true,
            }))
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTemplates();
    return () => {
      isMounted = false;
    };
  }, []);

  // Lọc danh sách mẫu
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchCategory =
        selectedCategory === "ALL" ||
        t.industryPack?.toUpperCase() === selectedCategory ||
        (selectedCategory === "MINUTES" && t.id.toLowerCase().includes("bien-ban"));

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.industryPack?.toLowerCase().includes(q);

      return matchCategory && matchQuery;
    });
  }, [templates, selectedCategory, searchQuery]);

  // Đếm số lượng theo category
  const categoriesWithCount = useMemo(() => {
    return CATEGORIES.map((cat) => {
      if (cat.id === "ALL") {
        return { ...cat, count: templates.length };
      }
      const count = templates.filter(
        (t) =>
          t.industryPack?.toUpperCase() === cat.id ||
          (cat.id === "MINUTES" && t.id.toLowerCase().includes("bien-ban"))
      ).length;
      return { ...cat, count };
    });
  }, [templates]);

  const handleUseTemplate = (templateId: string) => {
    router.push(`/editor?templateId=${encodeURIComponent(templateId)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-20">
      {/* HEADER TOP BAR */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Quay lại Bảng điều khiển"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight leading-tight">
                  Thư viện Mẫu chuẩn DOCDRAFT
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Biểu mẫu Thể thức Nghị định 30/2020/NĐ-CP & Quản trị Doanh nghiệp
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link href="/editor">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-xs">
                <FileText className="w-3.5 h-3.5" />
                <span>Soạn thảo tự do</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO BANNER & SEARCH */}
      <div className="bg-gradient-to-b from-indigo-50/70 via-white to-transparent dark:from-indigo-950/20 dark:via-slate-950 dark:to-transparent border-b border-slate-200/60 dark:border-slate-800/60 py-10 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chuẩn 100% Nghị định 30/2020/NĐ-CP & Pháp chế Việt Nam</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Kho Biểu mẫu Văn bản Hành chính & Doanh nghiệp
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Khởi tạo văn bản chỉ với vài thông tin đầu vào. AI tự động kiểm tra số liệu, đóng gói bảng ẩn 2 cột và xuất Word chuẩn thể thức.
          </p>

          {/* Ô Tìm kiếm Trực tiếp */}
          <div className="pt-3 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm mẫu biểu (Vd: Tờ trình kinh phí, Bổ nhiệm, Biên bản bàn giao, Công văn...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-13 rounded-2xl text-sm bg-white dark:bg-slate-900 shadow-md border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WORKSPACE & CATEGORY FILTER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoriesWithCount.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isSelected
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* THÔNG TIN KẾT QUẢ TÌM KIẾM */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-bold text-slate-900 dark:text-slate-100">{filteredTemplates.length}</span> mẫu văn bản phù hợp
          </div>
          {searchQuery && (
            <div>
              Từ khóa: &quot;<span className="font-bold text-indigo-600">{searchQuery}</span>&quot;
            </div>
          )}
        </div>

        {/* TEMPLATE GRID */}
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const fieldCount = template.formSchema?.fields?.length || 0;
              const isAdministrative =
                template.industryPack === "ADMINISTRATIVE" ||
                template.id.includes("to-trinh") ||
                template.id.includes("cong-van");

              return (
                <div
                  key={template.id}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all group"
                >
                  <div className="space-y-3">
                    {/* Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                        <Tag className="w-3 h-3" />
                        <span>{template.industryPack || "HÀNH CHÍNH"}</span>
                      </span>

                      {isAdministrative && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Chuẩn NĐ 30</span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2">
                      {template.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {template.description || "Biểu mẫu quy chuẩn sẵn sàng điền dữ liệu và kết xuất văn bản chuẩn Nghị định 30."}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                        <span>{fieldCount > 0 ? `${fieldCount} trường thông tin` : "Biểu mẫu thông minh"}</span>
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Tiết kiệm ~45p</span>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                        className="w-full text-xs font-semibold gap-1 rounded-xl h-9 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Xem trước</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleUseTemplate(template.id)}
                        className="w-full text-xs font-bold gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 shadow-xs"
                      >
                        <span>Dùng mẫu này</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Không tìm thấy biểu mẫu nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Không có mẫu văn bản nào khớp với từ khóa &quot;{searchQuery}&quot;. Bạn có thể thử tìm với từ khóa khác hoặc soạn thảo tự do.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
              }}
              className="text-xs"
            >
              Xem tất cả biểu mẫu
            </Button>
          </div>
        )}
      </main>

      {/* DIALOG XEM TRƯỚC BIỂU MẪU */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          {previewTemplate && (
            <div className="space-y-6">
              <DialogHeader className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {previewTemplate.industryPack || "HÀNH CHÍNH NĐ 30"}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Chuẩn Nghị định 30/2020/NĐ-CP
                  </span>
                </div>
                <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {previewTemplate.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                  {previewTemplate.description}
                </DialogDescription>
              </DialogHeader>

              {/* Danh sách trường nhập liệu của biểu mẫu */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                  <span>Các trường thông tin cần điền ({previewTemplate.formSchema?.fields?.length || 0} trường)</span>
                </h4>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 text-xs">
                  {previewTemplate.formSchema?.fields && previewTemplate.formSchema.fields.length > 0 ? (
                    previewTemplate.formSchema.fields.map((field, idx) => (
                      <div key={idx} className="p-3 flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {field.label}
                            </span>
                            {field.required && (
                              <span className="text-[10px] font-black text-rose-500">* Bắt buộc</span>
                            )}
                          </div>
                          {field.placeholder && (
                            <p className="text-[11px] text-slate-500 mt-0.5 italic">
                              Gợi ý: {field.placeholder}
                            </p>
                          )}
                          {field.description && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {field.description}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                          {field.type}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500 italic">
                      Mẫu biểu này sẽ được AI phân tích thông minh dựa trên nội dung bạn cung cấp.
                    </div>
                  )}
                </div>
              </div>

              {/* Lợi ích chuẩn thể thức */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-xs space-y-1.5">
                <p className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Quy chuẩn Thể thức NĐ 30 tự động áp dụng:</span>
                </p>
                <ul className="list-disc pl-5 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                  <li>Bảng ẩn 2 cột Header (Cơ quan ban hành / Quốc hiệu - Tiêu ngữ nét liền).</li>
                  <li>Bảng ẩn 2 cột Chữ ký (Nơi nhận cỡ 11pt, Chức danh & Họ tên căn giữa).</li>
                  <li>Lề trang A4 chuẩn: Trái 30mm, Phải 15mm, Trên 20mm, Dưới 20mm.</li>
                  <li>Xuất file Microsoft Word (.doc/.docx) không bị dãn chữ.</li>
                </ul>
              </div>

              <DialogFooter className="flex items-center justify-between sm:justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(null)}
                  className="rounded-xl text-xs"
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setPreviewTemplate(null);
                    handleUseTemplate(previewTemplate.id);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-xs"
                >
                  <span>Mở soạn thảo với mẫu này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
