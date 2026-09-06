/**
 * ==============================================================================
 * BỘ LƯU TRỮ VĂN BẢN NGOẠI TUYẾN (OFFLINE DRAFT STORAGE)
 * TASK-505 — Hỗ trợ lưu trữ cục bộ khi mất kết nối Internet
 * ==============================================================================
 */

export interface OfflineDraft {
  draftId: string;
  title: string;
  html: string;
  json?: object;
  updatedAt: number;
  synced: boolean;
}

const OFFLINE_STORAGE_PREFIX = "docdraft_offline_";

/**
 * Lưu bản nháp vào bộ nhớ cục bộ trình duyệt
 */
export function saveOfflineDraft(
  draftId: string,
  data: { title: string; html: string; json?: object }
): void {
  if (typeof window === "undefined") return;

  try {
    const draft: OfflineDraft = {
      draftId,
      title: data.title,
      html: data.html,
      json: data.json,
      updatedAt: Date.now(),
      synced: false,
    };
    localStorage.setItem(
      `${OFFLINE_STORAGE_PREFIX}${draftId}`,
      JSON.stringify(draft)
    );
  } catch {
    // LocalStorage đầy hoặc bị chặn bởi chính sách bảo mật
  }
}

/**
 * Lấy bản nháp ngoại tuyến theo draftId
 */
export function getOfflineDraft(draftId: string): OfflineDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const item = localStorage.getItem(`${OFFLINE_STORAGE_PREFIX}${draftId}`);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

/**
 * Lấy toàn bộ danh sách bản nháp lưu ngoại tuyến
 */
export function listOfflineDrafts(): OfflineDraft[] {
  if (typeof window === "undefined") return [];

  const drafts: OfflineDraft[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(OFFLINE_STORAGE_PREFIX)) {
        const item = localStorage.getItem(key);
        if (item) {
          drafts.push(JSON.parse(item));
        }
      }
    }
  } catch {}

  return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Đánh dấu bản nháp đã được đồng bộ lên máy chủ thành công
 */
export function markDraftSynced(draftId: string): void {
  if (typeof window === "undefined") return;

  try {
    const draft = getOfflineDraft(draftId);
    if (draft) {
      draft.synced = true;
      localStorage.setItem(
        `${OFFLINE_STORAGE_PREFIX}${draftId}`,
        JSON.stringify(draft)
      );
    }
  } catch {}
}

/**
 * Xóa bản nháp ngoại tuyến
 */
export function removeOfflineDraft(draftId: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(`${OFFLINE_STORAGE_PREFIX}${draftId}`);
  } catch {}
}
