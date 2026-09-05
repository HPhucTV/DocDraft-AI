"use client";

import React, { useState, useMemo } from "react";
import {
  computeTextDiff,
  mergeDiffChunks,
} from "@/lib/diff/diff-engine";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GitCompare,
  ArrowRight,
  ShieldAlert,
  Percent,
} from "lucide-react";

export interface SideBySideDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  proposedText: string;
  onApplyMerged: (
    mergedText: string,
    stats: {
      aiAttributionPercentage: number;
      addedWords: number;
      removedWords: number;
    }
  ) => void;
  title?: string;
}

export function SideBySideDiffModal({
  isOpen,
  onClose,
  originalText,
  proposedText,
  onApplyMerged,
  title = "So sánh thay đổi đề xuất (Side-by-side Diff View)",
}: SideBySideDiffModalProps) {
  const [activeChunkIndex, setActiveChunkIndex] = useState<number>(0);
  const [chunkDecisions, setChunkDecisions] = useState<Record<string, "accepted" | "rejected">>({});

  // Tính toán mẩu khác biệt (Diff Chunks) cơ bản
  const baseChunks = useMemo(() => {
    if (!isOpen) return [];
    return computeTextDiff(originalText, proposedText, "words").chunks;
  }, [isOpen, originalText, proposedText]);

  // Áp dụng quyết định của người dùng lên các chunks
  const chunks = useMemo(() => {
    return baseChunks.map((c) => {
      if (chunkDecisions[c.id]) {
        return { ...c, status: chunkDecisions[c.id] };
      }
      return c;
    });
  }, [baseChunks, chunkDecisions]);

  // Các chunk có thay đổi (added hoặc removed)
  const changedChunks = useMemo(
    () => chunks.filter((c) => c.type !== "unchanged"),
    [chunks]
  );

  // Thống kê động dựa trên trạng thái hiện tại
  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    for (const c of chunks) {
      if (c.type === "added") added += c.wordCount;
      else if (c.type === "removed") removed += c.wordCount;
      else unchanged += c.wordCount;
    }

    const total = unchanged + added;
    const aiAttributionPercentage =
      total > 0 ? Math.round((added / total) * 100) : 0;

    const acceptedCount = changedChunks.filter((c) => c.status === "accepted").length;
    const rejectedCount = changedChunks.filter((c) => c.status === "rejected").length;
    const pendingCount = changedChunks.filter((c) => c.status === "pending").length;

    return {
      addedWords: added,
      removedWords: removed,
      aiAttributionPercentage,
      acceptedCount,
      rejectedCount,
      pendingCount,
      totalChanges: changedChunks.length,
    };
  }, [chunks, changedChunks]);

  const currentChunk = changedChunks[activeChunkIndex] || null;

  // Xử lý quyết định cho chunk hiện tại
  const handleChunkDecision = (decision: "accepted" | "rejected") => {
    if (!currentChunk) return;
    setChunkDecisions((prev) => ({
      ...prev,
      [currentChunk.id]: decision,
    }));

    // Tự động chuyển sang chunk tiếp theo nếu còn
    if (activeChunkIndex < changedChunks.length - 1) {
      setActiveChunkIndex((prev) => prev + 1);
    }
  };

  // Chấp nhận tất cả
  const handleAcceptAll = () => {
    const decisions: Record<string, "accepted" | "rejected"> = {};
    for (const c of changedChunks) {
      decisions[c.id] = "accepted";
    }
    setChunkDecisions(decisions);
  };

  // Bác bỏ tất cả
  const handleRejectAll = () => {
    const decisions: Record<string, "accepted" | "rejected"> = {};
    for (const c of changedChunks) {
      decisions[c.id] = "rejected";
    }
    setChunkDecisions(decisions);
  };

  // Áp dụng kết quả đã duyệt vào văn bản
  const handleFinalApply = () => {
    const merged = mergeDiffChunks(chunks, true);
    onApplyMerged(merged, {
      aiAttributionPercentage: stats.aiAttributionPercentage,
      addedWords: stats.addedWords,
      removedWords: stats.removedWords,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in">
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">{title}</h3>
              <p className="text-xs text-muted-foreground">
                Kiểm duyệt chi tiết từng đoạn thay đổi trước khi cập nhật vào văn bản
              </p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              +{stats.addedWords} từ mới
            </span>
            <span className="flex items-center gap-1 rounded-md bg-rose-500/10 px-2.5 py-1 font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
              -{stats.removedWords} từ xóa
            </span>
            <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 font-semibold text-primary border border-primary/20">
              <Percent className="h-3 w-3" />
              {stats.aiAttributionPercentage}% AI đóng góp
            </span>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        {/* Chunk Decision Sub-bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-background/90 px-6 py-2.5 text-xs shadow-xs">
          {changedChunks.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-muted-foreground">Đoạn thay đổi:</span>
                <span className="rounded bg-muted px-2 py-0.5 font-bold">
                  {activeChunkIndex + 1} / {changedChunks.length}
                </span>
              </div>

              {currentChunk && (
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold text-[11px] ${
                      currentChunk.status === "accepted"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : currentChunk.status === "rejected"
                        ? "bg-rose-500/15 text-rose-600"
                        : "bg-amber-500/15 text-amber-600"
                    }`}
                  >
                    {currentChunk.status === "accepted"
                      ? "✓ Đã chấp nhận"
                      : currentChunk.status === "rejected"
                      ? "✕ Đã bác bỏ"
                      : "● Chờ duyệt"}
                  </span>

                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      onClick={() => handleChunkDecision("accepted")}
                    >
                      <Check className="h-3 w-3" />
                      <span>Chấp nhận</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => handleChunkDecision("rejected")}
                    >
                      <X className="h-3 w-3" />
                      <span>Bác bỏ</span>
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 ml-2 border-l pl-3">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={activeChunkIndex === 0}
                  onClick={() => setActiveChunkIndex((prev) => Math.max(0, prev - 1))}
                  title="Đoạn trước"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={activeChunkIndex >= changedChunks.length - 1}
                  onClick={() =>
                    setActiveChunkIndex((prev) => Math.min(changedChunks.length - 1, prev + 1))
                  }
                  title="Đoạn tiếp theo"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span>Hai phiên bản hoàn toàn giống nhau, không có sự khác biệt.</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-muted-foreground"
              onClick={handleRejectAll}
            >
              Bác bỏ tất cả
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-emerald-600 border-emerald-200 dark:border-emerald-900"
              onClick={handleAcceptAll}
            >
              Chấp nhận tất cả
            </Button>
          </div>
        </div>

        {/* Main Body: Side-by-side Dual Panes */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x overflow-hidden">
          {/* Left Pane: Original Version */}
          <div className="flex flex-col h-full overflow-hidden bg-background">
            <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Bản gốc hiện tại (Original)</span>
              <span className="text-[11px] text-rose-500 font-medium">Đỏ = Đoạn bị xóa</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 font-serif text-sm leading-relaxed whitespace-pre-wrap">
              {chunks.map((chunk, idx) => {
                const isSelected = currentChunk?.id === chunk.id;
                if (chunk.type === "added") return null;

                if (chunk.type === "removed") {
                  return (
                    <mark
                      key={idx}
                      onClick={() => {
                        const targetIdx = changedChunks.findIndex((c) => c.id === chunk.id);
                        if (targetIdx !== -1) setActiveChunkIndex(targetIdx);
                      }}
                      className={`cursor-pointer rounded px-1 line-through transition-all ${
                        isSelected
                          ? "bg-rose-500 text-white ring-2 ring-rose-400"
                          : chunk.status === "accepted"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {chunk.value}
                    </mark>
                  );
                }

                return <span key={idx}>{chunk.value}</span>;
              })}
            </div>
          </div>

          {/* Right Pane: Proposed AI Version */}
          <div className="flex flex-col h-full overflow-hidden bg-background">
            <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Bản đề xuất bởi AI (Proposed)</span>
              <span className="text-[11px] text-emerald-600 font-medium">Xanh = Đoạn thêm mới</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 font-serif text-sm leading-relaxed whitespace-pre-wrap">
              {chunks.map((chunk, idx) => {
                const isSelected = currentChunk?.id === chunk.id;
                if (chunk.type === "removed") return null;

                if (chunk.type === "added") {
                  return (
                    <mark
                      key={idx}
                      onClick={() => {
                        const targetIdx = changedChunks.findIndex((c) => c.id === chunk.id);
                        if (targetIdx !== -1) setActiveChunkIndex(targetIdx);
                      }}
                      className={`cursor-pointer rounded px-1 transition-all ${
                        isSelected
                          ? "bg-emerald-600 text-white ring-2 ring-emerald-400 font-medium"
                          : chunk.status === "rejected"
                          ? "bg-muted text-muted-foreground line-through"
                          : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200"
                      }`}
                    >
                      {chunk.value}
                    </mark>
                  );
                }

                return <span key={idx}>{chunk.value}</span>;
              })}
            </div>
          </div>
        </div>

        {/* Bottom Footer Actions */}
        <footer className="flex h-16 shrink-0 items-center justify-between border-t px-6 bg-muted/10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <span>
              Đã duyệt: <strong>{stats.acceptedCount}</strong> chấp nhận &bull;{" "}
              <strong>{stats.rejectedCount}</strong> bác bỏ &bull;{" "}
              <strong>{stats.pendingCount}</strong> còn chờ
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button size="sm" onClick={handleFinalApply} className="gap-2 shadow-xs">
              <Sparkles className="h-4 w-4" />
              <span>Áp dụng vào văn bản</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
