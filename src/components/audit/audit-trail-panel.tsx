"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Sparkles,
  User,
  Clock,
  Plus,
  Minus,
  X,
  ShieldCheck,
  Percent,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AuditLogItem {
  id: string;
  draftId: string;
  actorId?: string | null;
  actionType: string;
  source: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
  createdAt: string;
  actor?: {
    id: string;
    fullName?: string;
    name?: string;
    email: string;
    role: string;
  } | null;
}

export interface AuditTrailPanelProps {
  draftId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE: { label: "Khởi tạo", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  AI_GENERATE: { label: "AI Sinh toàn văn", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  AI_APPLY: { label: "Áp dụng đề xuất AI", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  AI_INLINE_EDIT: { label: "AI Inline Copilot", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  MANUAL_EDIT: { label: "Chỉnh sửa thủ công", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  RESTORE_VERSION: { label: "Khôi phục phiên bản", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
};

export function AuditTrailPanel({ draftId, isOpen, onClose }: AuditTrailPanelProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleManualRefresh = async () => {
    if (!draftId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}/audit-logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Lỗi khi làm mới nhật ký kiểm toán:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    if (isOpen && draftId) {
      fetch(`/api/drafts/${draftId}/audit-logs`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (!ignore) {
            setLogs(Array.isArray(data) ? data : []);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Lỗi khi tải nhật ký kiểm toán:", err);
          if (!ignore) setLoading(false);
        });
    }
    return () => {
      ignore = true;
    };
  }, [isOpen, draftId]);

  // Tính tỷ lệ trung bình AI Attribution
  const aiStats = React.useMemo(() => {
    if (logs.length === 0) return { aiPct: 0, humanPct: 100, aiModel: "DocDraft AI Core" };

    let totalAiWords = 0;
    let totalHumanWords = 0;
    let detectedModel = "DocDraft AI Core";

    for (const log of logs) {
      if (log.details?.ai_model) {
        detectedModel = "DocDraft AI Core";
      }

      if (log.source === "AI") {
        totalAiWords += log.details?.words_added || 100;
      } else {
        totalHumanWords += log.details?.words_added || 50;
      }
    }

    const total = totalAiWords + totalHumanWords;
    const aiPct = total > 0 ? Math.round((totalAiWords / total) * 100) : 0;
    const humanPct = 100 - aiPct;

    return { aiPct, humanPct, aiModel: detectedModel };
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l bg-background shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-5 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight">
              Nhật ký kiểm toán AI (Audit Trail)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Minh bạch 100% nguồn gốc câu từ & can thiệp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={handleManualRefresh}
            disabled={loading}
            title="Làm mới"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* AI Attribution Meter */}
      <div className="border-b bg-background/50 p-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Percent className="h-3.5 w-3.5 text-primary" />
            <span>Tỷ lệ đóng góp nội dung</span>
          </span>
          <span className="text-muted-foreground text-[11px]">
            Hệ thống: <strong className="text-foreground">{aiStats.aiModel}</strong>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted flex">
          <div
            className="bg-primary transition-all duration-500"
            style={{ width: `${aiStats.aiPct}%` }}
            title={`AI đóng góp ${aiStats.aiPct}%`}
          />
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${aiStats.humanPct}%` }}
            title={`Con người soạn thảo ${aiStats.humanPct}%`}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1.5 text-primary font-medium">
            <Sparkles className="h-3 w-3" />
            <span>{aiStats.aiPct}% AI đề xuất</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <User className="h-3 w-3" />
            <span>{aiStats.humanPct}% Con người soạn</span>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground space-y-2">
            <ShieldCheck className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-xs">Chưa có bản ghi kiểm toán nào cho văn bản này.</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Các thao tác sinh văn bản từ AI hoặc duyệt chỉnh sửa sẽ được tự động ghi lại tại đây.
            </p>
          </div>
        ) : (
          <div className="relative border-l border-border/80 ml-3 space-y-6">
            {logs.map((log) => {
              const action = ACTION_LABELS[log.actionType] || {
                label: log.actionType,
                color: "bg-muted text-muted-foreground",
              };
              const isAi = log.source === "AI";

              return (
                <div key={log.id} className="relative pl-6 space-y-1.5">
                  {/* Timeline Node */}
                  <div
                    className={`absolute -left-2 top-1 h-4 w-4 rounded-full border-2 border-background ${
                      isAi ? "bg-primary" : "bg-emerald-500"
                    }`}
                  />

                  {/* Header: Action badge & Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${action.color}`}
                    >
                      {action.label}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Actor info */}
                  <div className="text-xs text-foreground font-medium flex items-center gap-1.5">
                    {isAi ? (
                      <>
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span>Trợ lý DocDraft AI</span>
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3 text-emerald-600" />
                        <span>{log.actor?.fullName || log.actor?.name || "Người dùng"}</span>
                      </>
                    )}
                  </div>

                  {/* Words delta */}
                  {(log.details?.words_added || log.details?.words_removed) && (
                    <div className="flex items-center gap-2 text-[11px] pt-0.5">
                      {log.details.words_added > 0 && (
                        <span className="flex items-center text-emerald-600 font-medium">
                          <Plus className="h-3 w-3" />
                          {log.details.words_added} từ
                        </span>
                      )}
                      {log.details.words_removed > 0 && (
                        <span className="flex items-center text-rose-600 font-medium">
                          <Minus className="h-3 w-3" />
                          {log.details.words_removed} từ
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
