"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookmarkPlus,
  Sparkles,
  Loader2,
  Check,
  Tag,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  extractPlaceholders,
  generateFormSchemaFromPlaceholders,
} from "@/lib/template-parser";

export interface SaveTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle?: string;
  initialContentHtml: string;
  onSuccess?: (newTemplate: any) => void;
}

const INDUSTRY_OPTIONS = [
  { value: "DOANH NGHIỆP", label: "Doanh nghiệp & Hợp đồng" },
  { value: "HÀNH CHÍNH", label: "Hành chính & Công văn" },
  { value: "NHÂN SỰ", label: "Nhân sự & Lao động" },
  { value: "TÀI CHÍNH", label: "Tài chính & Kế toán" },
  { value: "PHÁP LÝ", label: "Pháp lý & Cam kết (NDA)" },
  { value: "Y TẾ", label: "Y tế & Sức khỏe" },
  { value: "GIÁO DỤC", label: "Giáo dục & Đào tạo" },
  { value: "PMO", label: "Quản lý dự án & Xây dựng" },
];

export function SaveTemplateDialog({
  isOpen,
  onClose,
  defaultTitle = "",
  initialContentHtml,
  onSuccess,
}: SaveTemplateDialogProps) {
  const [title, setTitle] = useState(defaultTitle || "");
  const [description, setDescription] = useState("");
  const [industryPack, setIndustryPack] = useState("DOANH NGHIỆP");
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle || "Mẫu văn bản mới");
      setDescription("");
      setError(null);
      setIsSuccess(false);
      // Tự động trích xuất các biến số [...]
      const detected = extractPlaceholders(initialContentHtml);
      setPlaceholders(detected);
    }
  }, [isOpen, defaultTitle, initialContentHtml]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập tên mẫu văn bản.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const formSchema = generateFormSchemaFromPlaceholders(placeholders);

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || `Mẫu văn bản tùy chỉnh ${title}`,
          industryPack,
          contentHtml: initialContentHtml,
          formSchema,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu mẫu văn bản");
      }

      setIsSuccess(true);
      if (onSuccess) {
        onSuccess(data);
      }

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border bg-background p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BookmarkPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Lưu thành Mẫu mới</h3>
              <p className="text-xs text-muted-foreground">
                Tái sử dụng mẫu văn bản này bất cứ lúc nào trong danh mục cá nhân
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-center animate-in fade-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Check className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-base text-foreground">Đã lưu mẫu thành công!</h4>
            <p className="text-xs text-muted-foreground">
              Mẫu đã được thêm vào danh mục &ldquo;Mẫu của tôi&rdquo; để bạn tái sử dụng bất cứ lúc nào.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Tên mẫu */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Tên mẫu văn bản</span>
                <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Vd: Biên bản bàn giao thiết bị công nghệ..."
                className="w-full rounded-lg border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
                autoFocus
              />
            </div>

            {/* Lĩnh vực / Nhóm ngành */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span>Lĩnh vực / Danh mục</span>
              </label>
              <select
                value={industryPack}
                onChange={(e) => setIndustryPack(e.target.value)}
                className="w-full rounded-lg border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mô tả ngắn */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Mô tả mẫu (Tùy chọn)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú thêm về mục đích hoặc trường hợp sử dụng mẫu này..."
                rows={2}
                className="w-full rounded-lg border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Danh sách biến số [...] được nhận diện tự động */}
            <div className="space-y-2 rounded-xl border bg-muted/30 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Biến số nhận diện tự động ({placeholders.length})</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Định dạng: [BIẾN_SỐ]
                </span>
              </div>

              {placeholders.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {placeholders.map((ph, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-0.5 text-[11px] font-mono font-medium border text-primary"
                    >
                      <span>[{ph}]</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Không tìm thấy khối [BIẾN SỐ] nào trong nội dung. Người dùng khi chọn mẫu sẽ nhận nguyên văn bản này.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSaving}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                size="sm"
                className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4 w-4" />
                    <span>Lưu mẫu ngay</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
