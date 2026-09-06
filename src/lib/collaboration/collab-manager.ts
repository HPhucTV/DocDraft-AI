/**
 * ==============================================================================
 * MODULE QUẢN LÝ CỘNG TÁC THỜI GIAN THỰC (TASK-503)
 * Real-time Collaborative Editing Presence & Room Coordination
 * Tham chiếu kiến trúc: docs/adr/ADR-002-tiptap-prosemirror-ast.md
 * ==============================================================================
 */

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
  avatarUrl?: string;
  lastActive: number;
  cursor?: {
    from: number;
    to: number;
  } | null;
}

// Bảng màu con trỏ ngẫu nhiên đẹp mắt cho các cộng tác viên
const COLLAB_COLORS = [
  "#4F46E5", // Indigo
  "#059669", // Emerald
  "#D97706", // Amber
  "#DC2626", // Rose
  "#7C3AED", // Purple
  "#0284C7", // Sky
  "#DB2777", // Pink
  "#0D9488", // Teal
];

export function getRandomCollabColor(seed?: string): string {
  if (!seed) {
    return COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)];
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLLAB_COLORS.length;
  return COLLAB_COLORS[index];
}

type CollaboratorsListener = (collaborators: Collaborator[]) => void;

class CollaborationManager {
  private channel: BroadcastChannel | null = null;
  private currentRoomId: string | null = null;
  private currentUser: Collaborator | null = null;
  private activeCollaborators: Map<string, Collaborator> = new Map();
  private listeners: Set<CollaboratorsListener> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Tham gia vào phòng soạn thảo tài liệu (Room)
   */
  public joinRoom(
    roomId: string,
    user: { id: string; name: string; email: string; role?: string; avatarUrl?: string }
  ) {
    if (typeof window === "undefined") return;

    // Rời phòng cũ nếu có
    this.leaveRoom();

    this.currentRoomId = roomId;
    const userColor = getRandomCollabColor(user.id || user.email);

    this.currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "USER",
      color: userColor,
      avatarUrl: user.avatarUrl,
      lastActive: Date.now(),
      cursor: null,
    };

    // Khởi tạo BroadcastChannel cho phòng này
    try {
      this.channel = new BroadcastChannel(`docdraft_collab_${roomId}`);
      this.channel.onmessage = (event) => this.handleChannelMessage(event);

      // Phát thông báo gia nhập phòng
      this.broadcast({
        type: "USER_JOINED",
        user: this.currentUser,
      });

      // Bắt đầu heartbeat gửi sự hiện diện mỗi 4 giây
      this.heartbeatInterval = setInterval(() => {
        if (this.currentUser) {
          this.currentUser.lastActive = Date.now();
          this.broadcast({
            type: "HEARTBEAT",
            user: this.currentUser,
          });
          this.pruneInactiveUsers();
        }
      }, 4000);
    } catch {
      // BroadcastChannel không khả dụng trên trình duyệt rất cũ
    }
  }

  /**
   * Rời khỏi phòng soạn thảo
   */
  public leaveRoom() {
    if (this.channel && this.currentUser) {
      this.broadcast({
        type: "USER_LEFT",
        userId: this.currentUser.id,
      });
      this.channel.close();
      this.channel = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.currentRoomId = null;
    this.currentUser = null;
    this.activeCollaborators.clear();
    this.notifyListeners();
  }

  /**
   * Cập nhật vị trí con trỏ của người dùng hiện tại
   */
  public updateCursor(from: number, to: number) {
    if (!this.currentUser) return;
    this.currentUser.cursor = { from, to };
    this.currentUser.lastActive = Date.now();

    this.broadcast({
      type: "CURSOR_MOVE",
      userId: this.currentUser.id,
      cursor: this.currentUser.cursor,
    });
  }

  /**
   * Đăng ký lắng nghe sự thay đổi danh sách cộng tác viên
   */
  public subscribe(listener: CollaboratorsListener): () => void {
    this.listeners.add(listener);
    listener(this.getCollaborators());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Lấy danh sách cộng tác viên (trừ người dùng hiện tại)
   */
  public getCollaborators(): Collaborator[] {
    return Array.from(this.activeCollaborators.values());
  }

  /**
   * Lấy thông tin người dùng hiện tại
   */
  public getCurrentUser(): Collaborator | null {
    return this.currentUser;
  }

  private broadcast(payload: unknown) {
    if (this.channel) {
      this.channel.postMessage(payload);
    }
  }

  private handleChannelMessage(event: MessageEvent) {
    const data = event.data;
    if (!data || !data.type) return;

    if (data.type === "USER_JOINED" && data.user) {
      if (data.user.id !== this.currentUser?.id) {
        this.activeCollaborators.set(data.user.id, data.user);
        // Gửi lại danh tính của mình để người mới biết
        if (this.currentUser) {
          this.broadcast({
            type: "USER_ACK",
            user: this.currentUser,
          });
        }
        this.notifyListeners();
      }
    } else if (data.type === "USER_ACK" && data.user) {
      if (data.user.id !== this.currentUser?.id) {
        this.activeCollaborators.set(data.user.id, data.user);
        this.notifyListeners();
      }
    } else if (data.type === "HEARTBEAT" && data.user) {
      if (data.user.id !== this.currentUser?.id) {
        this.activeCollaborators.set(data.user.id, {
          ...data.user,
          lastActive: Date.now(),
        });
        this.notifyListeners();
      }
    } else if (data.type === "CURSOR_MOVE" && data.userId) {
      const existing = this.activeCollaborators.get(data.userId);
      if (existing) {
        existing.cursor = data.cursor;
        existing.lastActive = Date.now();
        this.notifyListeners();
      }
    } else if (data.type === "USER_LEFT" && data.userId) {
      this.activeCollaborators.delete(data.userId);
      this.notifyListeners();
    }
  }

  private pruneInactiveUsers() {
    const now = Date.now();
    let hasChanges = false;
    for (const [id, user] of this.activeCollaborators.entries()) {
      // Nếu quá 12 giây không có heartbeat, coi như đã đóng tab
      if (now - user.lastActive > 12000) {
        this.activeCollaborators.delete(id);
        hasChanges = true;
      }
    }
    if (hasChanges) {
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    const collabs = this.getCollaborators();
    this.listeners.forEach((listener) => listener(collabs));
  }
}

// Singleton Instance
export const collabManager = new CollaborationManager();
