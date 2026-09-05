"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Send,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
} from "lucide-react";

interface ApproverUser {
  id: string;
  fullName: string;
  email: string;
  jobTitle?: string;
  organization?: string;
  role: string;
}

interface ApproverStepItem {
  stepNumber: number;
  approverId: string;
}

interface SubmitApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  draftId?: string;
  draftTitle?: string;
  placeholderCount?: number;
  onSubmitted?: (chainId: string) => void;
}

export function SubmitApprovalDialog({
  isOpen,
  onClose,
  draftId,
  draftTitle,
  placeholderCount = 0,
  onSubmitted,
}: SubmitApprovalDialogProps) {
  const [availableApprovers, setAvailableApprovers] = useState<ApproverUser[]>([]);
  const [steps, setSteps] = useState<ApproverStepItem[]>([
    { stepNumber: 1, approverId: "" },
  ]);
  const [note, setNote] = useState("");
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tải danh sách người duyệt đủ điều kiện khi mở dialog
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchApprovers() {
      try {
        setLoadingApprovers(true);
        const res = await fetch("/api/users/approvers");
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.approvers)) {
          setAvailableApprovers(json.approvers);
          if (json.approvers.length > 0) {
            setSteps((prev) =>
              prev[0]?.approverId ? prev : [{ stepNumber: 1, approverId: json.approvers[0].id }]
            );
          }
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách người duyệt:", err);
      } finally {
        if (isMounted) {
          setLoadingApprovers(false);
        }
      }
    }

    fetchApprovers();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleAddStep = () => {
    if (steps.length >= 5) return;
    const nextStepNum = steps.length + 1;
    const defaultApprover = availableApprovers[0]?.id || "";
    setSteps([...steps, { stepNumber: nextStepNum, approverId: defaultApprover }]);
  };

  const handleRemoveStep = (indexToRemove: number) => {
    if (steps.length <= 1) return;
    const filtered = steps.filter((_, i) => i !== indexToRemove);
    const reindexed = filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(reindexed);
  };

  const handleApproverChange = (index: number, approverId: string) => {
    const updated = [...steps];
    updated[index].approverId = approverId;
    setSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftId) {
      setErrorMsg("Không tìm thấy mã bản nháp để trình ký");
      return;
    }

    if (placeholderCount > 0) {
      setErrorMsg(
        `Văn bản vẫn còn ${placeholderCount} vị trí placeholder [...] chưa hoàn thiện. Vui lòng điền đủ thông tin trước khi gửi trình ký.`
      );
      return;
    }

    const hasEmpty = steps.some((s) => !s.approverId);
    if (hasEmpty) {
      setErrorMsg("Vui lòng chọn người duyệt cho tất cả các bước");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/approval/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          note: note.trim() || undefined,
          approvers: steps,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error || "Gửi trình ký thất bại");
      } else {
        setSuccessMsg("Gửi trình ký thành công! Đang thông báo tới người duyệt bước 1.");
        setTimeout(() => {
          onSubmitted?.(json.chainId);
          onClose();
        }, 1500);
      }
    } catch {
      setErrorMsg("Không thể kết nối đến máy chủ. Vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] p-6 font-sans">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold">
            <UserCheck className="h-5 w-5" />
            <DialogTitle className="text-lg">Trình Ký & Phê Duyệt Văn Bản</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Khởi tạo quy trình xét duyệt tuần tự theo chuẩn Nghị định 30/2020/NĐ-CP
          </DialogDescription>
        </DialogHeader>

        {draftTitle && (
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
            <span className="text-muted-foreground">Văn bản: </span>
            <span className="font-semibold text-foreground">{draftTitle}</span>
          </div>
        )}

        {placeholderCount > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Văn bản còn <strong>{placeholderCount} vị trí [...]</strong> chưa điền. Cần hoàn thiện hết trước khi lãnh đạo ký duyệt.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Danh sách các bước duyệt tuần tự */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>Các bước phê duyệt ({steps.length})</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddStep}
                disabled={steps.length >= 5 || loadingApprovers}
                className="h-6 text-[11px] text-primary hover:bg-primary/10 gap-1 px-2"
              >
                <Plus className="h-3 w-3" />
                <span>Thêm bước duyệt</span>
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border/70 bg-card"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-bold">
                    {step.stepNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <select
                      value={step.approverId}
                      onChange={(e) => handleApproverChange(idx, e.target.value)}
                      disabled={loadingApprovers}
                      className="w-full text-xs p-1.5 rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {availableApprovers.length === 0 ? (
                        <option value="">Đang tải danh sách...</option>
                      ) : (
                        availableApprovers.map((app) => (
                          <option key={app.id} value={app.id}>
                            {app.fullName} — {app.jobTitle || app.role} ({app.organization || "Cơ quan"})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStep(idx)}
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ghi chú gửi kèm người duyệt */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Ý kiến / Ghi chú gửi kèm (Tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Kính gửi Lãnh đạo xem xét phê duyệt dự toán bổ sung trước ngày 15/09..."
              rows={2}
              className="w-full text-xs p-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <DialogFooter className="pt-2 sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || placeholderCount > 0}
              className="gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Gửi trình ký</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
