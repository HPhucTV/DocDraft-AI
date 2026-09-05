"use client";

import React, { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface AIFeedbackWidgetProps {
  draftId?: string;
  actionType: "RAW_TO_DOC" | "INLINE_EDIT" | "CHAT_COPILOT" | "AUTO_FIX";
  promptSnippet?: string;
  completionSnippet?: string;
  size?: "sm" | "default";
  className?: string;
}

const POSITIVE_TAGS = [
  "Chính xác",
  "Chuẩn NĐ 30",
  "Văn phong công vụ",
  "Nhanh & Tiết kiệm thời gian",
];

const NEGATIVE_TAGS = [
  "Bị ảo giác dữ liệu",
  "Sai thể thức NĐ 30",
  "Quá dài / Dài dòng",
  "Diễn đạt chưa tự nhiên",
];

export function AIFeedbackWidget({
  draftId,
  actionType,
  promptSnippet,
  completionSnippet,
  size = "default",
  className = "",
}: AIFeedbackWidgetProps) {
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Gửi đánh giá nhanh khi người dùng nhấn Like hoặc Dislike
  const handleRate = async (newRating: 1 | -1) => {
    setRating(newRating);
    setIsPopoverOpen(true);
    setSelectedTags([]);

    // Tự động lưu đánh giá mức cơ bản ngay lập tức
    try {
      await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draftId && draftId !== "draft-temp" ? draftId : undefined,
          actionType,
          rating: newRating,
          promptSnippet: promptSnippet?.slice(0, 1000),
          completionSnippet: completionSnippet?.slice(0, 1000),
          modelName: "docdraft-ai-core",
        }),
      });
    } catch (err) {
      console.error("Lỗi gửi đánh giá nhanh:", err);
    }
  };

  // Gửi chi tiết bổ sung (Tags + Comment)
  const handleDetailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draftId && draftId !== "draft-temp" ? draftId : undefined,
          actionType,
          rating,
          tags: selectedTags,
          comment: comment.trim() || undefined,
          promptSnippet: promptSnippet?.slice(0, 1000),
          completionSnippet: completionSnippet?.slice(0, 1000),
          modelName: "docdraft-ai-core",
        }),
      });

      setHasSubmitted(true);
      setTimeout(() => {
        setIsPopoverOpen(false);
      }, 1200);
    } catch (err) {
      console.error("Lỗi gửi chi tiết đánh giá:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const buttonSizeClass = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const iconSizeClass = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-border/50 bg-background/80 p-0.5 shadow-xs backdrop-blur">
          {/* Nút Thumbs Up (Hài lòng) */}
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRate(1)}
              aria-label="Đánh giá kết quả AI tốt"
              title="Hài lòng với kết quả AI sinh"
              className={`${buttonSizeClass} rounded transition-all active:scale-90 ${
                rating === 1
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/30"
                  : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
              }`}
            >
              <ThumbsUp className={iconSizeClass} />
            </Button>
          </PopoverTrigger>

          {/* Nút Thumbs Down (Chưa hài lòng) */}
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRate(-1)}
              aria-label="Đánh giá kết quả AI cần cải thiện"
              title="Chưa hài lòng hoặc có sai sót"
              className={`${buttonSizeClass} rounded transition-all active:scale-90 ${
                rating === -1
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-500/30"
                  : "text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
              }`}
            >
              <ThumbsDown className={iconSizeClass} />
            </Button>
          </PopoverTrigger>
        </div>

        <PopoverContent
          side="top"
          align="end"
          className="w-72 p-3 font-sans shadow-xl border-border/80 bg-background/95 backdrop-blur animate-in fade-in zoom-in-95"
        >
          {hasSubmitted ? (
            <div className="flex flex-col items-center justify-center p-3 text-center space-y-1 text-xs">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mb-1">
                <Check className="h-4 w-4" />
              </div>
              <p className="font-semibold text-foreground">Cảm ơn bạn đã đóng góp!</p>
              <p className="text-[11px] text-muted-foreground">
                Phản hồi giúp hệ thống DocDraft AI hoàn thiện văn phong chuẩn xác hơn.
              </p>
            </div>
          ) : (
            <form onSubmit={handleDetailedSubmit} className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-border/50">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  {rating === 1 ? (
                    <>
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Bạn hài lòng về điều gì?</span>
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="h-3.5 w-3.5 text-rose-600" />
                      <span>Cần cải thiện điểm nào?</span>
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPopoverOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Tag Chips chọn nhanh */}
              <div className="flex flex-wrap gap-1">
                {(rating === 1 ? POSITIVE_TAGS : NEGATIVE_TAGS).map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                        isSelected
                          ? rating === 1
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-rose-600 text-white shadow-xs"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Ghi chú phản hồi tự do */}
              <div className="space-y-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Góp ý chi tiết thêm (không bắt buộc)..."
                  rows={2}
                  className="w-full text-xs p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPopoverOpen(false)}
                  className="h-6 px-2 text-[11px] text-muted-foreground"
                >
                  Đóng
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="h-6 px-2.5 text-[11px] bg-primary text-primary-foreground font-semibold shadow-xs"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  <span>Gửi góp ý</span>
                </Button>
              </div>
            </form>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
