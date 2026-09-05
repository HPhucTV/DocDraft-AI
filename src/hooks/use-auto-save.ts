"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface AutoSaveOptions {
  draftId?: string | null;
  initialVersion?: number;
  intervalMs?: number; // Mặc định 30,000ms (30 giây) theo NĐ 30 / ADR
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
 * Tự động gửi dữ liệu lên server sau một khoảng thời gian trì hoãn (debounce / interval)
 * và xử lý xung đột phiên bản (409 Conflict) khi có nhiều phiên làm việc cùng lúc.
 */
export function useAutoSave(
  currentData: SavePayload,
  options: AutoSaveOptions = {}
) {
  const {
    draftId,
    initialVersion = 1,
    intervalMs = 30000,
    onSaveSuccess,
    onConflict,
    onError,
  } = options;

  const [version, setVersion] = useState<number>(initialVersion);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasConflict, setHasConflict] = useState(false);

  // Tham chiếu dữ liệu đã lưu gần nhất để so sánh dirty
  const lastSavedDataRef = useRef<string>("");
  const currentDataRef = useRef<SavePayload>(currentData);

  useEffect(() => {
    currentDataRef.current = currentData;
  }, [currentData]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Hàm thực hiện lưu ngay lập tức
  const saveNow = useCallback(
    async (manualPayload?: SavePayload) => {
      if (!draftId) return;

      const payloadToSave = manualPayload || currentDataRef.current;
      const serialized = JSON.stringify(payloadToSave);

      // Nếu không có gì thay đổi so với bản đã lưu, bỏ qua
      if (serialized === lastSavedDataRef.current) {
        setIsDirty(false);
        return;
      }

      setIsSaving(true);
      try {
        const res = await fetch(`/api/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payloadToSave,
            currentVersion: version,
            createSnapshot: false,
          }),
        });

        if (res.status === 409) {
          const conflictData = await res.json();
          setHasConflict(true);
          onConflict?.({
            serverVersion: conflictData.serverVersion,
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

  // Theo dõi sự thay đổi dữ liệu để đánh dấu dirty và kích hoạt timer
  useEffect(() => {
    if (!draftId) return;

    const serialized = JSON.stringify(currentData);
    if (serialized !== lastSavedDataRef.current) {
      setIsDirty(true);

      // Thiết lập timer debounced tự động lưu
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        saveNow();
      }, intervalMs);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentData, draftId, intervalMs, saveNow]);

  return {
    version,
    isSaving,
    isDirty,
    lastSavedAt,
    hasConflict,
    saveNow,
  };
}
