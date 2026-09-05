"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  History,
  RotateCcw,
  Clock,
  User,
  Sparkles,
  Bot,
  FileEdit,
  Eye,
  X,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DraftVersionItem {
  id: string;
  versionNumber: number;
  contentJson: object;
  editSource: string;
  changeSummary?: string | null;
  createdAt: string;
  creator?: {
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
}

interface VersionHistoryPanelProps {
  draftId: string | null;
  currentVersion: number;
  isOpen: boolean;
  onClose: () => void;
  onRollbackSuccess: (newVersion: number, contentJson: object) => void;
}

const SOURCE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  AI_GENERATE: {
    label: "AI sinh mẫu",
    icon: Sparkles,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  AI_INLINE_EDIT: {
    label: "AI In-line",
    icon: Bot,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  AI_CHAT_APPLY: {
    label: "AI Copilot",
    icon: Bot,
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  ROLLBACK: {
    label: "Khôi phục",
    icon: RotateCcw,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  USER_MANUAL: {
    label: "Người dùng sửa",
    icon: FileEdit,
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
};

/**
 * Trích xuất text đơn giản từ Tiptap ProseMirror JSON AST để xem trước nhanh
 */
function extractTextFromJson(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { text?: string; content?: unknown[] };
  if (n.text) return n.text;
  if (Array.isArray(n.content)) {
    return n.content.map(extractTextFromJson).join(" ");
  }
  return "";
}

export function VersionHistoryPanel({
  draftId,
  currentVersion,
  isOpen,
  onClose,
  onRollbackSuccess,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<DraftVersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<DraftVersionItem | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackSuccessMsg, setRollbackSuccessMsg] = useState<string | null>(null);

  const refreshVersions = useCallback(async () => {
    if (!draftId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải lịch sử phiên bản:", err);
    } finally {
      setLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    if (!isOpen || !draftId) return;

    let ignore = false;
    fetch(`/api/drafts/${draftId}/versions`)
      .then((res) => (res.ok ? res.json() : { versions: [] }))
      .then((data) => {
        if (!ignore) {
          setVersions(data.versions || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải lịch sử phiên bản:", err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, draftId]);

  // Thực hiện Rollback 1-Click
  const handleRollback = async (version: DraftVersionItem) => {
    if (!draftId || isRollingBack) return;

    const confirmed = confirm(
      `Khôi phục văn bản về phiên bản v${version.versionNumber}? Một phiên bản mới tiếp theo sẽ được tạo ra để lưu trữ trạng thái này.`
    );
    if (!confirmed) return;

    setIsRollingBack(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetVersion: version.versionNumber }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Không thể khôi phục phiên bản");
      }

      const data = await res.json();
      setRollbackSuccessMsg(`Đã khôi phục thành công về phiên bản v${version.versionNumber}`);
      setTimeout(() => setRollbackSuccessMsg(null), 3500);

      onRollbackSuccess(data.version, data.contentJson);
      await refreshVersions();
      setPreviewVersion(null);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Lỗi rollback:", err);
      alert(`Lỗi khôi phục: ${errMsg}`);
    } finally {
      setIsRollingBack(false);
    }
  };

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
              Lịch sử phiên bản
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Phiên bản hiện tại: <strong>v{currentVersion}</strong> ({versions.length} bản lưu)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={refreshVersions}
            disabled={loading}
            title="Tải lại danh sách"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Thông báo thành công */}
      {rollbackSuccessMsg && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-xs text-emerald-600 font-medium">
          <Check className="h-3.5 w-3.5 shrink-0" />
          <span>{rollbackSuccessMsg}</span>
        </div>
      )}

      {/* Danh sách các phiên bản */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {loading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Đang tải các mốc thời gian...</span>
          </div>
        ) : versions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground">
            Chưa có snapshot phiên bản nào được ghi nhận.
          </div>
        ) : (
          versions.map((ver) => {
            const isCurrent = ver.versionNumber === currentVersion;
            const srcConfig = SOURCE_CONFIG[ver.editSource] || SOURCE_CONFIG.USER_MANUAL;
            const Icon = srcConfig.icon;

            return (
              <div
                key={ver.id}
                className={`group relative rounded-xl border p-3.5 transition-all space-y-2.5 ${
                  isCurrent
                    ? "border-primary/40 bg-primary/5 shadow-xs"
                    : "bg-card hover:border-border/80 hover:shadow-xs"
                }`}
              >
                {/* Phiên bản & Thẻ nguồn */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-muted px-2 py-0.5 rounded-md text-foreground">
                      v{ver.versionNumber}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Hiện hành
                      </span>
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${srcConfig.color}`}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    <span>{srcConfig.label}</span>
                  </span>
                </div>

                {/* Tóm tắt thay đổi */}
                <p className="text-xs text-foreground font-medium leading-relaxed">
                  {ver.changeSummary || `Phiên bản lưu số ${ver.versionNumber}`}
                </p>

                {/* Thời gian & Tác giả */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(ver.createdAt).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">
                      {ver.creator?.fullName || "Người dùng"}
                    </span>
                  </div>
                </div>

                {/* Nút Xem trước & Rollback */}
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewVersion(ver)}
                    className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                    title="Xem nhanh văn bản ở phiên bản này"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Xem trước</span>
                  </Button>

                  {!isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRollback(ver)}
                      disabled={isRollingBack}
                      className="h-7 px-2.5 text-[11px] gap-1 text-primary border-primary/30 hover:bg-primary/10"
                      title="Khôi phục toàn bộ văn bản về trạng thái này"
                    >
                      {isRollingBack ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3 w-3" />
                      )}
                      <span>Khôi phục</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Xem trước Snapshot */}
      {previewVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border bg-card shadow-2xl overflow-hidden">
            <header className="flex h-14 items-center justify-between border-b px-5 bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  Xem trước phiên bản v{previewVersion.versionNumber}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({new Date(previewVersion.createdAt).toLocaleString("vi-VN")})
                </span>
              </div>
              <button
                onClick={() => setPreviewVersion(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Đóng
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/10 font-times text-[13pt] leading-relaxed select-text">
              <div className="rounded-xl border bg-background p-6 shadow-xs whitespace-pre-wrap">
                {extractTextFromJson(previewVersion.contentJson) || (
                  <span className="text-muted-foreground italic text-xs">
                    (Văn bản rỗng hoặc không có dữ liệu văn bản thuần)
                  </span>
                )}
              </div>
            </div>

            <footer className="flex items-center justify-between border-t px-5 py-3 bg-muted/20">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Đây là chế độ xem trước lịch sử.</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewVersion(null)}
                  className="text-xs h-8"
                >
                  Đóng
                </Button>
                {previewVersion.versionNumber !== currentVersion && (
                  <Button
                    size="sm"
                    onClick={() => handleRollback(previewVersion)}
                    disabled={isRollingBack}
                    className="text-xs h-8 gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Khôi phục phiên bản này</span>
                  </Button>
                )}
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
