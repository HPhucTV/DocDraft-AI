import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationCategory = "INVITE" | "COMMENT" | "APPROVAL" | "AI" | "SYSTEM";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  createdAt: string;
  isRead: boolean;
  link?: string;
  actorName?: string;
  documentTitle?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: () => number;
  addNotification: (item: Omit<NotificationItem, "id" | "createdAt" | "isRead">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const INITIAL_SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Lời mời cộng tác văn bản",
    message: "Đồng chí Nguyễn Văn An đã mời bạn tham gia chỉnh sửa dự thảo Tờ trình bổ sung kinh phí Q3/2026.",
    category: "INVITE",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 phút trước
    isRead: false,
    actorName: "Nguyễn Văn An",
    documentTitle: "Tờ trình bổ sung kinh phí",
    link: "/editor",
  },
  {
    id: "notif-2",
    title: "Văn bản đã được phê duyệt",
    message: "Hồ sơ trình ký 'Công văn giải trình kiểm toán năm 2025' đã được Lãnh đạo phê duyệt và ký số.",
    category: "APPROVAL",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 giờ trước
    isRead: false,
    actorName: "Trưởng phòng Kế hoạch",
    documentTitle: "Công văn giải trình kiểm toán",
    link: "/dashboard",
  },
  {
    id: "notif-3",
    title: "Kiểm tra tuân thủ NĐ 30/2020",
    message: "Trợ lý AI phát hiện 2 điểm cần căn chỉnh lề và bố cục bảng ẩn 2 cột trong văn bản vừa tạo.",
    category: "AI",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 giờ trước
    isRead: true,
    documentTitle: "Quyết định ban hành quy chế",
    link: "/editor",
  },
  {
    id: "notif-4",
    title: "Cập nhật hệ thống DOCDRAFT AI",
    message: "Đã kích hoạt tính năng Command Palette (Ctrl+K) và Smart Fill Agent điền tự động placeholder [...].",
    category: "SYSTEM",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 ngày trước
    isRead: true,
    link: "/dashboard",
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: INITIAL_SAMPLE_NOTIFICATIONS,

      unreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length;
      },

      addNotification: (item) => {
        const newNotif: NotificationItem = {
          ...item,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }));
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: "docdraft_notifications_v1",
    }
  )
);
