"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  Loader2,
  PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface ApprovalBannerProps {
  draftId: string;
  status: string;
  qrVerifyCode?: string | null;
  activeChainId?: string | null;
  currentStep?: number;
  totalSteps?: number;
  isCurrentApprover?: boolean;
  onActionComplete?: () => void;
}

export function ApprovalBanner({
  status,
  qrVerifyCode,
  activeChainId,
  currentStep = 1,
  totalSteps = 2,
  isCurrentApprover = false,
  onActionComplete,
}: ApprovalBannerProps) {
  const [isActing, setIsActing] = useState(false);
  const [applySignature, setApplySignature] = useState(true);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"REJECT" | "REQUEST_CHANGES" | null>(null);
  const [commentText, setCommentText] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (status === "DRAFT") {
    return null;
  }

  // Trường hợp văn bản đã được phê duyệt thành công
  if (status === "APPROVED" || status === "EXPORTED") {
    return (
      <div className="w-full bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-sans">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-emerald-600 text-white shadow-xs">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold uppercase tracking-wide">Văn bản đã được ký duyệt chính thức</span>
            <span className="hidden sm:inline text-muted-foreground ml-2">
              (Nội dung đã khóa toàn vẹn, bảo vệ tính pháp lý)
            </span>
          </div>
        </div>

        {qrVerifyCode && (
          <div className="flex items-center gap-2">
            <Link
              href={`/verify/${qrVerifyCode}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition-colors"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Tra cứu mã QR</span>
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Xử lý gửi hành động phê duyệt
  const handleApprove = async () => {
    if (!activeChainId) return;

    try {
      setIsActing(true);
      const res = await fetch(`/api/approval/${activeChainId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          applySignature,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setFeedbackMsg(json.message || "Phê duyệt thành công!");
        setTimeout(() => {
          onActionComplete?.();
        }, 1200);
      } else {
        alert(json.error || "Thao tác thất bại");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsActing(false);
    }
  };

  const handleOpenComment = (action: "REJECT" | "REQUEST_CHANGES") => {
    setPendingAction(action);
    setCommentText("");
    setCommentModalOpen(true);
  };

  const handleConfirmCommentAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChainId || !pendingAction) return;

    try {
      setIsActing(true);
      const res = await fetch(`/api/approval/${activeChainId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: pendingAction,
          comments: commentText.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setCommentModalOpen(false);
        setFeedbackMsg(json.message || "Thao tác thành công!");
        setTimeout(() => {
          onActionComplete?.();
        }, 1200);
      } else {
        alert(json.error || "Thao tác thất bại");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsActing(false);
    }
  };

  // Trường hợp đang chờ xét duyệt
  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 font-sans">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <span className="font-bold">Đang trong luồng trình ký: </span>
          <span>
            {status === "PENDING_REVIEW"
              ? `Bước ${currentStep}/${totalSteps} — Đang xem xét`
              : `Bước ${currentStep}/${totalSteps} — Chờ ký duyệt`}
          </span>
        </div>
      </div>

      {feedbackMsg ? (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {feedbackMsg}
        </span>
      ) : isCurrentApprover && activeChainId ? (
        <div className="flex items-center gap-2">
          <label className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground mr-1 cursor-pointer">
            <input
              type="checkbox"
              checked={applySignature}
              onChange={(e) => setApplySignature(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span>Chèn ảnh chữ ký</span>
          </label>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenComment("REQUEST_CHANGES")}
            disabled={isActing}
            className="h-7 text-[11px] border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40"
          >
            <PenTool className="h-3 w-3 mr-1" />
            <span>Yêu cầu sửa</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleOpenComment("REJECT")}
            disabled={isActing}
            className="h-7 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <XCircle className="h-3 w-3 mr-1" />
            <span>Từ chối</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleApprove}
            disabled={isActing}
            className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
          >
            {isActing ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            )}
            <span>Phê duyệt</span>
          </Button>
        </div>
      ) : (
        <span className="text-[11px] text-muted-foreground italic">
          (Đang chờ cán bộ thẩm quyền xử lý)
        </span>
      )}

      {/* Modal nhập lý do từ chối hoặc góp ý */}
      {commentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-background rounded-xl p-5 border border-border shadow-2xl space-y-3">
            <h3 className="font-bold text-sm text-foreground">
              {pendingAction === "REJECT"
                ? "Lý do từ chối phê duyệt"
                : "Danh sách điểm yêu cầu tác giả chỉnh sửa"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Ý kiến này sẽ được chuyển trực tiếp tới người soạn thảo văn bản.
            </p>
            <form onSubmit={handleConfirmCommentAction} className="space-y-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Nhập nội dung chỉ dẫn..."
                rows={3}
                required
                className="w-full text-xs p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCommentModalOpen(false)}
                >
                  Đóng
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isActing || !commentText.trim()}
                  className={
                    pendingAction === "REJECT"
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-primary text-primary-foreground"
                  }
                >
                  {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  <span>Xác nhận</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
