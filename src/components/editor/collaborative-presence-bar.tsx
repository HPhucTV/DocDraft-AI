"use client";

import React, { useEffect, useState } from "react";
import { collabManager, type Collaborator } from "@/lib/collaboration/collab-manager";
import { Users, Radio } from "lucide-react";

interface CollaborativePresenceBarProps {
  draftId?: string;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  onShareClick?: () => void;
}

export function CollaborativePresenceBar({
  draftId = "default-draft",
  currentUser,
  onShareClick,
}: CollaborativePresenceBarProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    // Gia nhập phòng soạn thảo
    collabManager.joinRoom(draftId, {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
    });

    // Lắng nghe cập nhật
    const unsubscribe = collabManager.subscribe((users) => {
      setCollaborators(users);
    });

    return () => {
      unsubscribe();
      collabManager.leaveRoom();
    };
  }, [draftId, currentUser]);

  const totalUsers = collaborators.length + (currentUser ? 1 : 0);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "Quản trị viên";
      case "APPROVER":
        return "Lãnh đạo phê duyệt";
      case "USER":
        return "Chuyên viên";
      case "VIEWER":
        return "Khách xem";
      default:
        return "Đồng nghiệp";
    }
  };

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-full shadow-2xs">
      {/* Live Indicator Pill */}
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="hidden sm:inline">
          {totalUsers > 1 ? (
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              {totalUsers} người đang cộng tác
            </span>
          ) : (
            <span className="text-slate-500">Đang trực tuyến</span>
          )}
        </span>
      </div>

      {/* Collaborator Avatars Stack */}
      <div className="flex items-center -space-x-1.5 overflow-hidden">
        {/* Current User Avatar */}
        {currentUser && (
          <div
            title={`Bạn (${currentUser.name}) - ${getRoleLabel(currentUser.role)}`}
            className="relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold ring-2 ring-white dark:ring-slate-900 shadow-xs cursor-default"
          >
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
          </div>
        )}

        {/* Remote Collaborators Avatars */}
        {collaborators.map((user) => (
          <div
            key={user.id}
            title={`${user.name} (${getRoleLabel(user.role)})`}
            style={{ backgroundColor: user.color }}
            className="relative inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-bold ring-2 ring-white dark:ring-slate-900 shadow-xs cursor-default transition-transform hover:scale-110"
          >
            {user.name ? user.name.charAt(0).toUpperCase() : "C"}
          </div>
        ))}
      </div>

      {/* Quick Share Trigger */}
      {onShareClick && (
        <button
          onClick={onShareClick}
          className="ml-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold flex items-center gap-1 hover:underline pl-1 border-l border-slate-200 dark:border-slate-800"
          title="Chia sẻ liên kết cộng tác soạn thảo"
        >
          <Users className="w-3 h-3" />
          <span className="hidden md:inline">Mời</span>
        </button>
      )}
    </div>
  );
}
