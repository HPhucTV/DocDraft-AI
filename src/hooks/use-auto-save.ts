"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface AutoSaveOptions {
  draftId?: string | null;
  initialVersion?: number;
  intervalMs?: number; // Mặc định 60,000ms (1 phút), chỉ lưu khi có thay đổi
  onSaveSuccess?: (savedData: { version: number; updatedAt: string }) => void;
  onConflict?: (conflictInfo: { serverVersion: number; clientVersion: number }) => void;
  onError?: (error: Error) => void;
}

export interface SavePayload {
  title?: string;
  contentJson?: object;
  wordCount?: number;
}

/**
 * Hook tự động lưu văn bản (Auto-save) kèm Kiểm soát khóa lạc quan (Optimistic Locking) (TASK-118).
 * Tự động gửi dữ liệu lên server sau 1 phút kể từ khi có thay đổi (chỉ lưu khi có sửa đổi thực tế).
 * Tránh hoàn toàn việc lưu dư thừa khi người dùng treo máy hoặc không chỉnh sửa.
 */
export function useAutoSave(
  currentData: SavePayload,
  options: AutoSaveOptions = {}
) {
  const {
    draftId,
    initialVersion = 1,
    intervalMs = 60000, // Chu kỳ 1 phút (60 giây), chỉ lưu khi có thay đổi thực tế
    onSaveSuccess,
    onConflict,
    onError,
  } = options;

  const [version, setVersion] = useState<number>(initialVersion);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasConflict, setHasConflict] = useState(false);

  // Đồng bộ lại version khi initialVersion từ bên ngoài thay đổi (ví dụ: sau khi Rollback phiên bản mới)
  useEffect(() => {
    setVersion(initialVersion);
    setHasConflict(false);
  }, [initialVersion]);

  // Tham chiếu dữ liệu đã lưu gần nhất để so sánh dirty
  const lastSavedDataRef = useRef<string>("");
  const currentDataRef = useRef<SavePayload>(currentData);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const firstChangeTimeRef = useRef<number | null>(null);
  const draftIdRef = useRef<string | null | undefined>(draftId);

  useEffect(() => {
    currentDataRef.current = currentData;
  }, [currentData]);

  // Giải tỏa trạng thái xung đột 409 khi người dùng đồng ý nạp phiên bản mới
  const resolveConflict = useCallback((newServerVersion?: number) => {
    setHasConflict(false);
    if (typeof newServerVersion === "number") {
      setVersion(newServerVersion);
    }
  }, []);

  // Hàm thực hiện lưu ngay lập tức
  const saveNow = useCallback(
    async (manualPayload?: SavePayload) => {
      if (!draftId) return;

      const payloadToSave = manualPayload || currentDataRef.current;
      const serialized = JSON.stringify(payloadToSave);

      // Nếu không có gì thay đổi so với bản đã lưu, bỏ qua hoàn toàn
      if (serialized === lastSavedDataRef.current) {
        setIsDirty(false);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        firstChangeTimeRef.current = null;
        return;
      }

      // Xóa timer đang chờ nếu có
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      firstChangeTimeRef.current = null;

      setIsSaving(true);
      try {
        const res = await fetch(`/api/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payloadToSave,
            currentVersion: version,
            createSnapshot: true,
            changeSummary: `Tự động lưu phiên bản ${version + 1}`,
          }),
        });

        if (res.status === 409) {
          const conflictData = await res.json().catch(() => ({}));
          setHasConflict(true);
          // Tự động nâng version để không bị kẹt 409 ở các lần lưu tiếp theo
          if (typeof conflictData.serverVersion === "number") {
            setVersion(conflictData.serverVersion);
          }
          onConflict?.({
            serverVersion: conflictData.serverVersion || version + 1,
            clientVersion: version,
          });
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Lỗi tự động lưu văn bản");
        }

        const updatedDraft = await res.json();
        setVersion(updatedDraft.currentVersion);
        lastSavedDataRef.current = serialized;
        setIsDirty(false);
        setHasConflict(false);
        const now = new Date();
        setLastSavedAt(now);

        onSaveSuccess?.({
          version: updatedDraft.currentVersion,
          updatedAt: updatedDraft.updatedAt,
        });
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[Auto-save Error]:", error);
        onError?.(error);
      } finally {
        setIsSaving(false);
      }
    },
    [draftId, version, onConflict, onError, onSaveSuccess]
  );

  // Khi draftId thay đổi (chuyển đổi văn bản), thiết lập lại baseline
  useEffect(() => {
    if (draftId !== draftIdRef.current) {
      draftIdRef.current = draftId;
      if (currentData && (currentData.contentJson || currentData.title)) {
        lastSavedDataRef.current = JSON.stringify(currentData);
      } else {
        lastSavedDataRef.current = "";
      }
      setIsDirty(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      firstChangeTimeRef.current = null;
    }
  }, [draftId, currentData]);

  // Khởi tạo baseline ở lần đầu nạp dữ liệu thành công từ server
  useEffect(() => {
    if (!lastSavedDataRef.current && currentData && (currentData.contentJson || currentData.title)) {
      lastSavedDataRef.current = JSON.stringify(currentData);
    }
  }, [currentData]);

  // Theo dõi sự thay đổi dữ liệu: CHỈ KÍCH HOẠT KHI THỰC SỰ CÓ SỰ THAY ĐỔI
  useEffect(() => {
    if (!draftId) return;

    const serialized = JSON.stringify(currentData);

    // Nếu chưa có baseline, khởi tạo và không đánh dấu dirty
    if (!lastSavedDataRef.current) {
      lastSavedDataRef.current = serialized;
      return;
    }

    // So sánh dữ liệu hiện tại với dữ liệu đã lưu
    if (serialized !== lastSavedDataRef.current) {
      setIsDirty(true);

      // Nếu chưa có timer đang đếm (bắt đầu chu kỳ 1 phút kể từ thay đổi đầu tiên)
      if (!timerRef.current) {
        firstChangeTimeRef.current = Date.now();
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          firstChangeTimeRef.current = null;
          saveNow();
        }, intervalMs);
      }
    } else {
      // Nếu người dùng hoàn tác (Undo) về đúng trạng thái đã lưu, hủy cờ dirty & timer
      setIsDirty(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        firstChangeTimeRef.current = null;
      }
    }
  }, [currentData, draftId, intervalMs, saveNow]);

  // Dọn dẹp timer khi component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return {
    version,
    isSaving,
    isDirty,
    lastSavedAt,
    hasConflict,
    saveNow,
    resolveConflict,
  };
}
