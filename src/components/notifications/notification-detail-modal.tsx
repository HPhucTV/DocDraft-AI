"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  NotificationCategory,
  NotificationItem,
} from "@/lib/stores/notification-store";
import {
  UserPlus,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Info,
  Calendar,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

interface NotificationDetailModalProps {
  notification: NotificationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

function getCategoryConfig(category: NotificationCategory) {
  switch (category) {
    case "INVITE":
      return {
        label: "Lời mời cộng tác",
        icon: UserPlus,
        badgeClass:
          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
        actionLabel: "Vào phòng soạn thảo",
        actionIcon: ArrowRight,
      };
    case "APPROVAL":
      return {
        label: "Trình ký & Phê duyệt",
        icon: CheckCircle2,
        badgeClass:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        actionLabel: "Xem hồ sơ trình ký",
        actionIcon: ExternalLink,
      };
    case "COMMENT":
      return {
        label: "Ý kiến đóng góp",
        icon: MessageSquare,
        badgeClass:
          "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
        actionLabel: "Xem nội dung góp ý",
        actionIcon: ArrowRight,
      };
    case "AI":
      return {
        label: "Trợ lý Thể thức AI",
        icon: Sparkles,
        badgeClass:
          "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
        actionLabel: "Kiểm tra thể thức NĐ 30",
        actionIcon: Sparkles,
      };
    case "SYSTEM":
    default:
      return {
        label: "Thông báo hệ thống",
        icon: Info,
        badgeClass:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        actionLabel: "Khám phá ngay",
        actionIcon: ArrowRight,
      };
  }
}

function formatFullDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${timeStr}, ${dateStr}`;
  } catch {
    return isoString;
  }
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  } catch {
    return "";
  }
}

export function NotificationDetailModal({
  notification,
  open,
  onOpenChange,
  onDelete,
  onNavigateNext,
  onNavigatePrev,
  currentIndex = 0,
  totalCount = 0,
}: NotificationDetailModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (!notification) return null;

  const config = getCategoryConfig(notification.category);
  const CategoryIcon = config.icon;
  const ActionIcon = config.actionIcon;

  const handlePrimaryAction = () => {
    onOpenChange(false);

    // Xử lý hành động theo từng danh mục
    if (notification.category === "AI") {
      if (pathname.startsWith("/editor")) {
        window.dispatchEvent(new CustomEvent("docdraft:open-compliance"));
      } else {
        router.push("/editor?action=compliance-check");
      }
      return;
    }

    if (notification.link) {
      router.push(notification.link);
      return;
    }

    if (notification.category === "INVITE") {
      router.push("/editor");
    } else {
      router.push("/dashboard");
    }
  };

  const hasPagination = totalCount > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-border/80 shadow-2xl bg-background top-[20%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%]">
        {/* Header với Icon & Badge phân loại */}
        <div className="p-5 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badgeClass}`}
            >
              <CategoryIcon className="h-3.5 w-3.5" />
              <span>{config.label}</span>
            </span>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatRelativeTime(notification.createdAt)}</span>
            </div>
          </div>

          <DialogTitle className="text-base sm:text-lg font-bold text-foreground leading-snug">
            {notification.title}
          </DialogTitle>

          <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span>Thời gian:</span>
            <span className="font-medium text-foreground/80">
              {formatFullDateTime(notification.createdAt)}
            </span>
          </DialogDescription>
        </div>

        {/* Nội dung chi tiết */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Metadata Cards: Người gửi & Văn bản liên quan */}
          {(notification.actorName || notification.documentTitle) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {notification.actorName && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/60">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Người gửi
                    </p>
                    <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                      {notification.actorName}
                    </p>
                  </div>
                </div>
              )}

              {notification.documentTitle && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/60">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Văn bản liên quan
                    </p>
                    <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                      {notification.documentTitle}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hộp nội dung thông điệp chi tiết */}
          <div className="p-4 rounded-xl bg-card border border-border/80 shadow-2xs space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Nội dung thông báo
            </p>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>

          {/* Gợi ý hành động tiếp theo */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Gợi ý thao tác: </span>
              {notification.category === "AI" &&
                "Bạn có thể mở trực tiếp Trình kiểm tra Thể thức NĐ 30/2020 để tự động sửa lỗi căn lề và định dạng bảng ẩn 2 cột."}
              {notification.category === "INVITE" &&
                "Bấm nút bên dưới để mở ngay tài liệu dự thảo và bắt đầu cộng tác thời gian thực với đồng nghiệp."}
              {notification.category === "APPROVAL" &&
                "Văn bản đã được số hóa và ký duyệt thành công. Bạn có thể xem hồ sơ hoặc tải về tệp Word / PDF."}
              {notification.category === "SYSTEM" &&
                "Hệ thống đã sẵn sàng với các tính năng mới nhất để hỗ trợ công việc soạn thảo của bạn."}
              {notification.category === "COMMENT" &&
                "Mở tài liệu để xem chi tiết các ý kiến góp ý tại từng đoạn văn bản cụ thể."}
            </div>
          </div>
        </div>

        {/* Footer: Điều hướng danh sách và Nút hành động */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          {/* Cụm điều hướng trước / sau & Xóa */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            {hasPagination && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={onNavigatePrev}
                  disabled={currentIndex <= 0}
                  title="Thông báo trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-[11px] font-mono text-muted-foreground px-2">
                  {currentIndex + 1} / {totalCount}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={onNavigateNext}
                  disabled={currentIndex >= totalCount - 1}
                  title="Thông báo kế tiếp"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={() => {
                  onDelete(notification.id);
                  onOpenChange(false);
                }}
                title="Xóa thông báo này"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                <span>Xóa</span>
              </Button>
            )}
          </div>

          {/* Cụm nút Đóng & Action chính */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs"
              onClick={() => onOpenChange(false)}
            >
              Đóng
            </Button>

            <Button
              size="sm"
              className="h-9 px-3.5 text-xs font-semibold gap-1.5 shadow-sm"
              onClick={handlePrimaryAction}
            >
              <span>{config.actionLabel}</span>
              <ActionIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
