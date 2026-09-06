"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap,
  Building2,
  Calendar,
  Sparkles,
  HelpCircle,
  Check,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileCheck,
} from "lucide-react";

export interface PlaceholderReplacement {
  placeholder: string;
  value: string;
  source?: "ORGANIZATION" | "SYSTEM_DATE" | "AI_INFERRED" | "DEFAULT";
}

interface SmartFillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editorContent: string;
  onApplyReplacements: (replacements: PlaceholderReplacement[]) => void;
}

export function SmartFillDialog({
  open,
  onOpenChange,
  editorContent,
  onApplyReplacements,
}: SmartFillDialogProps) {
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  const [sources, setSources] = useState<Record<string, "ORGANIZATION" | "SYSTEM_DATE" | "AI_INFERRED" | "DEFAULT">>({});
  const [isLoading, setIsLoading] = useState(false);
  const [appliedPlaceholders, setAppliedPlaceholders] = useState<Set<string>>(new Set());

  // Trích xuất danh sách placeholder từ HTML nội dung văn bản
  const scanPlaceholders = useCallback(() => {
    if (!editorContent) return [];
    // Loại bỏ thẻ HTML trước khi quét regex
    const tempDiv = typeof document !== "undefined" ? document.createElement("div") : null;
    const textOnly = tempDiv
      ? (tempDiv.innerHTML = editorContent, tempDiv.textContent || "")
      : editorContent.replace(/<[^>]*>/g, "");

    const regex = /\[([^\]]+)\]/g;
    const found: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(textOnly)) !== null) {
      const full = match[0].trim();
      // Bỏ qua nếu là số trang hoặc định dạng đặc biệt không phải placeholder
      if (full.length > 2 && !found.includes(full)) {
        found.push(full);
      }
    }

    return found;
  }, [editorContent]);

  // Nạp dữ liệu gợi ý từ API khi mở Dialog
  const fetchSmartSuggestions = useCallback(async (plList: string[]) => {
    if (plList.length === 0) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/smart-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentContent: editorContent,
          placeholders: plList,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newReplacements: Record<string, string> = {};
        const newSources: Record<string, "ORGANIZATION" | "SYSTEM_DATE" | "AI_INFERRED" | "DEFAULT"> = {};

        data.suggestions?.forEach((s: { placeholder: string; suggestedValue: string; source: "ORGANIZATION" | "SYSTEM_DATE" | "AI_INFERRED" | "DEFAULT" }) => {
          newReplacements[s.placeholder] = s.suggestedValue;
          newSources[s.placeholder] = s.source;
        });

        setReplacements(newReplacements);
        setSources(newSources);
      }
    } catch (err) {
      console.error("Lỗi khi tải gợi ý Smart Fill:", err);
    } finally {
      setIsLoading(false);
    }
  }, [editorContent]);

  useEffect(() => {
    if (open) {
      const plList = scanPlaceholders();
      setPlaceholders(plList);
      setAppliedPlaceholders(new Set());
      if (plList.length > 0) {
        fetchSmartSuggestions(plList);
      }
    }
  }, [open, scanPlaceholders, fetchSmartSuggestions]);

  // Cập nhật giá trị ô input
  const handleValueChange = (pl: string, val: string) => {
    setReplacements((prev) => ({
      ...prev,
      [pl]: val,
    }));
  };

  // Áp dụng từng ô
  const handleApplySingle = (pl: string) => {
    const val = replacements[pl];
    if (!val) return;
    onApplyReplacements([{ placeholder: pl, value: val, source: sources[pl] }]);
    setAppliedPlaceholders((prev) => new Set(prev).add(pl));
  };

  // Áp dụng tất cả các ô
  const handleApplyAll = () => {
    const listToApply: PlaceholderReplacement[] = placeholders
      .map((pl) => ({
        placeholder: pl,
        value: replacements[pl] || "",
        source: sources[pl],
      }))
      .filter((item) => item.value.trim().length > 0);

    onApplyReplacements(listToApply);
    onOpenChange(false);
  };

  const getSourceBadge = (source?: "ORGANIZATION" | "SYSTEM_DATE" | "AI_INFERRED" | "DEFAULT") => {
    switch (source) {
      case "ORGANIZATION":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Building2 className="h-2.5 w-2.5" />
            Hồ sơ cơ quan
          </span>
        );
      case "SYSTEM_DATE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Calendar className="h-2.5 w-2.5" />
            Thời gian NĐ 30
          </span>
        );
      case "AI_INFERRED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <Sparkles className="h-2.5 w-2.5" />
            AI suy luận
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <HelpCircle className="h-2.5 w-2.5" />
            Nhập bổ sung
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border-border/80 shadow-2xl bg-background">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                  <span>Smart Fill: Tự Động Điền Placeholder [...]</span>
                  {placeholders.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      {placeholders.length} ô phát hiện
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  AI quét hồ sơ cơ quan và ngữ cảnh văn bản để tự động điền các trường còn thiếu mà không gây ảo giác.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const plList = scanPlaceholders();
                setPlaceholders(plList);
                fetchSmartSuggestions(plList);
              }}
              disabled={isLoading}
              className="h-8 text-xs gap-1 rounded-xl"
              title="Quét lại văn bản"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Quét lại</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="py-14 text-center space-y-3">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-amber-500" />
              <p className="text-xs font-medium text-foreground">
                Đang tra cứu hồ sơ cơ quan &amp; suy luận giá trị thích hợp...
              </p>
              <p className="text-[11px] text-muted-foreground">
                Tự động chuẩn hóa địa danh, ngày tháng theo Nghị định 30/2020/NĐ-CP
              </p>
            </div>
          ) : placeholders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                Văn bản đã hoàn chỉnh!
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Không tìm thấy placeholder dạng <code className="bg-muted px-1.5 py-0.5 rounded font-mono">[...]</code> nào cần điền trong văn bản này.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>
                  Bạn có thể chỉnh sửa trực tiếp giá trị trong từng ô bên dưới trước khi bấm <strong>Áp dụng</strong> vào văn bản.
                </span>
              </div>

              <div className="divide-y divide-border/60 border border-border/80 rounded-xl overflow-hidden bg-card">
                {placeholders.map((pl) => {
                  const val = replacements[pl] || "";
                  const isApplied = appliedPlaceholders.has(pl);

                  return (
                    <div
                      key={pl}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                        isApplied ? "bg-emerald-500/5" : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="min-w-0 sm:w-2/5 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <code className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {pl}
                          </code>
                          {getSourceBadge(sources[pl])}
                        </div>
                      </div>

                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={val}
                          onChange={(e) => handleValueChange(pl, e.target.value)}
                          placeholder="Nhập giá trị điền..."
                          className="h-8 text-xs rounded-lg bg-background border-border/80 focus-visible:ring-amber-500"
                        />

                        <Button
                          size="sm"
                          variant={isApplied ? "ghost" : "outline"}
                          disabled={!val.trim() || isApplied}
                          onClick={() => handleApplySingle(pl)}
                          className={`h-8 px-2.5 text-xs shrink-0 rounded-lg ${
                            isApplied
                              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                              : "hover:bg-amber-500/10 hover:text-amber-600"
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              <span>Đã điền</span>
                            </>
                          ) : (
                            <span>Điền ô này</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-5 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground"
          >
            Đóng
          </Button>

          {placeholders.length > 0 && (
            <Button
              size="sm"
              onClick={handleApplyAll}
              disabled={isLoading || placeholders.length === 0}
              className="text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Áp dụng tất cả vào văn bản</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
