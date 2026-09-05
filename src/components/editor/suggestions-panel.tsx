"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import {
  GitPullRequest,
  Check,
  X,
  CheckCheck,
  XCircle,
  User as UserIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type DocumentSuggestion,
  acceptSuggestion,
  rejectSuggestion,
  acceptAllSuggestions,
  rejectAllSuggestions,
} from "./extensions/suggestion-mode";

interface SuggestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  suggestions: DocumentSuggestion[];
  onSuggestionChange?: () => void;
}

export function SuggestionsPanel({
  isOpen,
  onClose,
  editor,
  suggestions,
  onSuggestionChange,
}: SuggestionsPanelProps) {
  if (!isOpen) return null;

  const handleAccept = (id: string) => {
    if (!editor) return;
    acceptSuggestion(editor, id);
    onSuggestionChange?.();
  };

  const handleReject = (id: string) => {
    if (!editor) return;
    rejectSuggestion(editor, id);
    onSuggestionChange?.();
  };

  const handleAcceptAll = () => {
    if (!editor) return;
    acceptAllSuggestions(editor);
    onSuggestionChange?.();
  };

  const handleRejectAll = () => {
    if (!editor) return;
    rejectAllSuggestions(editor);
    onSuggestionChange?.();
  };

  const handleScrollToSuggestion = (sug: DocumentSuggestion) => {
    if (!editor) return;
    const targetPos = sug.delFrom ?? sug.insFrom;
    if (targetPos !== undefined) {
      editor.chain().focus().setTextSelection(targetPos).run();
    }
  };

  return (
    <aside className="w-80 sm:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full z-30 shadow-xl font-sans">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <GitPullRequest className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Đề xuất chỉnh sửa
              {suggestions.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {suggestions.length}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Xem xét và phê duyệt các thay đổi
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ACTION BAR: CHẤP NHẬN / TỪ CHỐI TẤT CẢ */}
      {suggestions.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-xs">
          <span className="text-[11px] text-muted-foreground font-medium">
            Thao tác nhanh:
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRejectAll}
              className="h-6 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50 px-2 gap-1"
              title="Từ chối tất cả đề xuất"
            >
              <XCircle className="w-3 h-3" />
              <span>Từ chối hết</span>
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleAcceptAll}
              className="h-6 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 gap-1"
              title="Chấp nhận tất cả đề xuất"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Duyệt tất cả</span>
            </Button>
          </div>
        </div>
      )}

      {/* DANH SÁCH ĐỀ XUẤT */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {suggestions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
              <Sparkles className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Không có đề xuất chỉnh sửa nào
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
              Bôi đen văn bản và chọn &ldquo;Đề xuất&rdquo; hoặc dùng AI Copilot để ghi lại góp ý chỉnh sửa.
            </p>
          </div>
        ) : (
          suggestions.map((sug) => (
            <div
              key={sug.id}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2 text-xs"
            >
              {/* Header của thẻ đề xuất */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      sug.type === "replace"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40"
                        : sug.type === "insert"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/40"
                    }`}
                  >
                    {sug.type === "replace"
                      ? "Thay thế"
                      : sug.type === "insert"
                      ? "Thêm mới"
                      : "Xóa bớt"}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-slate-400" />
                    {sug.author}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleScrollToSuggestion(sug)}
                    className="h-5 px-1 text-[10px] text-muted-foreground hover:text-foreground"
                    title="Đi tới vị trí này trong văn bản"
                  >
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </div>

              {/* Nội dung so sánh Diff */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-2 space-y-1 text-xs border border-slate-100 dark:border-slate-800">
                {sug.deletedText && (
                  <div className="text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded text-[11px] line-through font-times">
                    {sug.deletedText}
                  </div>
                )}
                {sug.insertedText && (
                  <div className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded text-[11px] font-times underline font-medium">
                    {sug.insertedText}
                  </div>
                )}
              </div>

              {/* Hàng nút bấm duyệt/từ chối */}
              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReject(sug.id)}
                  className="h-6 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 gap-1 font-semibold"
                  title="Từ chối đề xuất này"
                >
                  <X className="w-3 h-3" />
                  <span>Từ chối</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAccept(sug.id)}
                  className="h-6 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 px-2 gap-1 font-semibold"
                  title="Chấp nhận đề xuất này"
                >
                  <Check className="w-3 h-3" />
                  <span>Duyệt</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
