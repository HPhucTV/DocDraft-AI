"use client";

import React from "react";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { WifiOff, Wifi, RefreshCw, HardDrive } from "lucide-react";

interface OfflineStatusPillProps {
  draftId?: string;
  className?: string;
}

export function OfflineStatusPill({ draftId, className = "" }: OfflineStatusPillProps) {
  const { isOnline, isSyncing, unsyncedCount, syncOfflineDrafts } = useOfflineSync(draftId);

  if (isOnline && unsyncedCount === 0 && !isSyncing) {
    return null; // Không hiển thị khi kết nối hoàn toàn bình thường để tiết kiệm không gian
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs transition-all ${className} ${
      !isOnline
        ? "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-800"
        : isSyncing
        ? "bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-800"
        : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800"
    }`}>
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Mất kết nối — Đã lưu cục bộ an toàn</span>
          <HardDrive className="w-3 h-3 text-amber-500 ml-0.5" />
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
          <span>Đang đồng bộ lên máy chủ...</span>
        </>
      ) : (
        <>
          <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Đã kết nối lại</span>
          <button
            onClick={() => syncOfflineDrafts()}
            className="underline hover:text-emerald-700 ml-1"
          >
            Đồng bộ ngay
          </button>
        </>
      )}
    </div>
  );
}
