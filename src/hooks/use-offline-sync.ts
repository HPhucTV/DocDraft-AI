"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listOfflineDrafts,
  markDraftSynced,
} from "@/lib/offline/offline-storage";

export function useOfflineSync(_currentDraftId?: string) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  // Đếm số lượng bản nháp chưa đồng bộ
  const refreshUnsyncedCount = useCallback(() => {
    const drafts = listOfflineDrafts();
    const unsynced = drafts.filter((d) => !d.synced);
    setUnsyncedCount(unsynced.length);
  }, []);

  // Đồng bộ toàn bộ bản nháp offline lên server
  const syncOfflineDrafts = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    const drafts = listOfflineDrafts().filter((d) => !d.synced);
    if (drafts.length === 0) return;

    setIsSyncing(true);

    for (const draft of drafts) {
      try {
        const res = await fetch(`/api/drafts/${draft.draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: draft.title,
            contentJson: draft.json,
            htmlContent: draft.html,
          }),
        });

        if (res.ok) {
          markDraftSynced(draft.draftId);
        }
      } catch {
        // Tiếp tục thử lần sau
      }
    }

    setIsSyncing(false);
    setLastSyncedAt(Date.now());
    refreshUnsyncedCount();
  }, [isSyncing, refreshUnsyncedCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    refreshUnsyncedCount();

    const handleOnline = () => {
      setIsOnline(true);
      // Khi có mạng trở lại, tự động kích hoạt đồng bộ
      syncOfflineDrafts();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncOfflineDrafts, refreshUnsyncedCount]);

  return {
    isOnline,
    isSyncing,
    unsyncedCount,
    lastSyncedAt,
    syncOfflineDrafts,
  };
}
