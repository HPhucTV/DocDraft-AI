"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Check,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Info,
  UserPlus,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useNotificationStore,
  NotificationCategory,
  NotificationItem,
} from "@/lib/stores/notification-store";
import { NotificationDetailModal } from "./notification-detail-modal";

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
    return "Gần đây";
  }
}

function getCategoryIcon(cat: NotificationCategory) {
  switch (cat) {
    case "INVITE":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case "APPROVAL":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "COMMENT":
      return <MessageSquare className="h-4 w-4 text-indigo-500" />;
    case "AI":
      return <Sparkles className="h-4 w-4 text-violet-500" />;
    case "SYSTEM":
    default:
      return <Info className="h-4 w-4 text-amber-500" />;
  }
}

export function NotificationBell() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" disabled>
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  const unread = unreadCount();
  const displayedList =
    activeFilter === "UNREAD"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleOpenDetail = (notif: NotificationItem) => {
    if (!notif.isRead) markAsRead(notif.id);
    setSelectedNotif(notif);
    setOpen(false);
    setIsDetailOpen(true);
  };

  const currentNotifIndex = selectedNotif
    ? displayedList.findIndex((n) => n.id === selectedNotif.id)
    : -1;

  const handleNavigateNext = () => {
    if (currentNotifIndex >= 0 && currentNotifIndex < displayedList.length - 1) {
      const nextNotif = displayedList[currentNotifIndex + 1];
      if (!nextNotif.isRead) markAsRead(nextNotif.id);
      setSelectedNotif(nextNotif);
    }
  };

  const handleNavigatePrev = () => {
    if (currentNotifIndex > 0) {
      const prevNotif = displayedList[currentNotifIndex - 1];
      if (!prevNotif.isRead) markAsRead(prevNotif.id);
      setSelectedNotif(prevNotif);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            title="Thông báo hệ thống"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-[380px] p-0 rounded-2xl border-border/80 shadow-2xl overflow-hidden bg-background"
        >
          {/* Header */}
          <div className="p-4 pb-3 border-b border-border/60 bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">Thông báo</span>
              {unread > 0 && (
                <span className="text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                  {unread} mới
                </span>
              )}
            </div>

            {unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex border-b border-border/50 text-xs font-semibold px-4 pt-2 gap-4 bg-muted/10">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`pb-2 transition-colors border-b-2 ${
                activeFilter === "ALL"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter("UNREAD")}
              className={`pb-2 transition-colors border-b-2 ${
                activeFilter === "UNREAD"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Chưa đọc ({unread})
            </button>
          </div>

          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
            {displayedList.length === 0 ? (
              <div className="text-center py-10 px-4 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">Không có thông báo nào</p>
                <p className="text-[11px] opacity-70 mt-0.5">
                  {activeFilter === "UNREAD"
                    ? "Bạn đã đọc hết tất cả thông báo!"
                    : "Mọi hoạt động mới sẽ được hiển thị tại đây."}
                </p>
              </div>
            ) : (
              displayedList.map((notif: NotificationItem) => (
                <div
                  key={notif.id}
                  onClick={() => handleOpenDetail(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-muted/40 transition-colors relative cursor-pointer group ${
                    !notif.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="p-2 rounded-xl bg-background border border-border/70 shadow-2xs shrink-0 mt-0.5">
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs truncate ${
                          !notif.isRead
                            ? "text-foreground font-bold"
                            : "text-foreground/90 font-semibold"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(notif);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                      >
                        <span>Xem chi tiết</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notif.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  {!notif.isRead && (
                    <span className="absolute right-3 top-4 h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 border-t border-border/50 bg-muted/20 flex items-center justify-between text-[11px] px-4">
              <span className="text-muted-foreground">
                {unread} chưa đọc trong tổng số {notifications.length}
              </span>
              <button
                onClick={clearAll}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Modal Popup Chi tiết thông báo */}
      <NotificationDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        notification={selectedNotif}
        onDelete={removeNotification}
        onNavigateNext={handleNavigateNext}
        onNavigatePrev={handleNavigatePrev}
        currentIndex={currentNotifIndex >= 0 ? currentNotifIndex : 0}
        totalCount={displayedList.length}
      />
    </>
  );
}
