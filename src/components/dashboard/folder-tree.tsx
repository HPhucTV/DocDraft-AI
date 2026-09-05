"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Edit2,
  Trash2,
  Check,
  Plus,
  Files,
  Inbox,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FolderData {
  id: string;
  name: string;
  color?: string | null;
  parentFolderId?: string | null;
  sortOrder: number;
  _count?: {
    drafts: number;
    subFolders: number;
  };
}

interface FolderTreeProps {
  selectedFolderId: string | null; // null: All, "UNORGANIZED": Unorganized, or folder UUID
  onSelectFolder: (folderId: string | null) => void;
  onDraftDropped?: (draftId: string, targetFolderId: string | null) => void;
}

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#64748b", // Slate
];

export function FolderTree({
  selectedFolderId,
  onSelectFolder,
  onDraftDropped,
}: FolderTreeProps) {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | "UNORGANIZED">(null);

  // Dialog state: Tạo thư mục mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(PRESET_COLORS[0]);
  const [newParentFolderId, setNewParentFolderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Menu action state
  const [activeMenuFolderId, setActiveMenuFolderId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<FolderData | null>(null);
  const [editName, setEditName] = useState("");

  const refreshFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/folders");
      if (res.ok) {
        const data: FolderData[] = await res.json();
        setFolders(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách thư mục:", err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/folders")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: FolderData[]) => {
        if (!ignore) {
          setFolders(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải danh sách thư mục:", err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Tạo thư mục mới
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          color: newFolderColor,
          parentFolderId: newParentFolderId,
        }),
      });

      if (res.ok) {
        setNewFolderName("");
        setNewParentFolderId(null);
        setIsCreateModalOpen(false);
        await refreshFolders();
      }
    } catch (err) {
      console.error("Lỗi tạo thư mục:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đổi tên thư mục
  const handleUpdateFolder = async (folderId: string) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        setEditingFolder(null);
        await refreshFolders();
      }
    } catch (err) {
      console.error("Lỗi đổi tên thư mục:", err);
    }
  };

  // Xóa thư mục
  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    const confirmDelete = confirm(`Xóa thư mục "${folderName}"? Các văn bản trong thư mục sẽ chuyển sang mục Chưa phân loại.`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedFolderId === folderId) {
          onSelectFolder(null);
        }
        await refreshFolders();
      }
    } catch (err) {
      console.error("Lỗi xóa thư mục:", err);
    }
  };

  // Xử lý kéo thả tài liệu vào thư mục
  const handleDragOver = (e: React.DragEvent, folderId: string | null | "UNORGANIZED") => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const draftId = e.dataTransfer.getData("text/draft-id");
    if (!draftId) return;

    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: targetFolderId,
        }),
      });

      if (res.ok) {
        await refreshFolders();
        onDraftDropped?.(draftId, targetFolderId);
      }
    } catch (err) {
      console.error("Lỗi di chuyển văn bản vào thư mục:", err);
    }
  };

  // Tổ chức thư mục phân cấp cha - con
  const rootFolders = folders.filter((f) => !f.parentFolderId);
  const getSubFolders = (parentId: string) => folders.filter((f) => f.parentFolderId === parentId);

  const renderFolderItem = (folder: FolderData, depth: number = 0) => {
    const subFolders = getSubFolders(folder.id);
    const hasChildren = subFolders.length > 0;
    const isExpanded = !!expandedFolders[folder.id];
    const isSelected = selectedFolderId === folder.id;
    const isDragOver = dragOverFolderId === folder.id;

    return (
      <div key={folder.id} className="space-y-0.5">
        <div
          onClick={() => onSelectFolder(folder.id)}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
            isSelected
              ? "bg-primary/10 text-primary border-primary/30 font-semibold"
              : isDragOver
              ? "bg-primary/20 border-primary border-dashed shadow-xs"
              : "border-transparent text-foreground/80 hover:bg-muted/70 hover:text-foreground"
          }`}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(folder.id, e)}
                className="p-0.5 hover:bg-background/80 rounded text-muted-foreground"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            ) : (
              <span className="w-4.5" />
            )}

            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: folder.color || "#3b82f6" }}
            />

            {isSelected ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <FolderIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
            )}

            {editingFolder?.id === folder.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleUpdateFolder(folder.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateFolder(folder.id);
                  if (e.key === "Escape") setEditingFolder(null);
                }}
                autoFocus
                className="bg-background px-1 py-0.5 rounded border text-xs focus:outline-none focus:border-primary w-full max-w-[120px]"
              />
            ) : (
              <span className="truncate">{folder.name}</span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {folder._count && (
              <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded-full">
                {folder._count.drafts}
              </span>
            )}

            {/* Folder Actions Menu */}
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuFolderId(activeMenuFolderId === folder.id ? null : folder.id);
                }}
                className="p-1 hover:bg-background rounded text-muted-foreground"
              >
                <MoreHorizontal className="h-3 w-3" />
              </button>

              {activeMenuFolderId === folder.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-6 z-20 w-36 rounded-lg border bg-popover p-1 shadow-md text-[11px] animate-in fade-in"
                >
                  <button
                    onClick={() => {
                      setNewParentFolderId(folder.id);
                      setIsCreateModalOpen(true);
                      setActiveMenuFolderId(null);
                    }}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1 hover:bg-muted text-foreground text-left"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Thêm mục con</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingFolder(folder);
                      setEditName(folder.name);
                      setActiveMenuFolderId(null);
                    }}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1 hover:bg-muted text-foreground text-left"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Đổi tên</span>
                  </button>
                  <div className="my-1 h-px bg-border" />
                  <button
                    onClick={() => {
                      handleDeleteFolder(folder.id, folder.name);
                      setActiveMenuFolderId(null);
                    }}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1 hover:bg-destructive/10 text-destructive text-left"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Xóa thư mục</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Render Subfolders recursively */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {subFolders.map((sub) => renderFolderItem(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-3">
      {/* Folder Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FolderIcon className="h-3.5 w-3.5 text-primary" />
          <span>Hồ sơ lưu trữ</span>
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setNewParentFolderId(null);
            setIsCreateModalOpen(true);
          }}
          className="h-6 w-6 p-0 rounded-md text-muted-foreground hover:text-primary"
          title="Tạo thư mục mới"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Quick Filter: Tất cả văn bản & Chưa phân loại */}
      <div className="space-y-0.5">
        <button
          onClick={() => onSelectFolder(null)}
          onDragOver={(e) => handleDragOver(e, null)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            selectedFolderId === null
              ? "bg-primary/10 text-primary border-primary/30 font-semibold"
              : dragOverFolderId === null
              ? "bg-primary/20 border-primary border-dashed"
              : "border-transparent text-foreground/80 hover:bg-muted/70 hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <Files className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Tất cả văn bản</span>
          </div>
        </button>

        <button
          onClick={() => onSelectFolder("UNORGANIZED")}
          onDragOver={(e) => handleDragOver(e, "UNORGANIZED")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            selectedFolderId === "UNORGANIZED"
              ? "bg-primary/10 text-primary border-primary/30 font-semibold"
              : dragOverFolderId === "UNORGANIZED"
              ? "bg-primary/20 border-primary border-dashed"
              : "border-transparent text-foreground/80 hover:bg-muted/70 hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Chưa phân loại</span>
          </div>
        </button>
      </div>

      {/* Nested Folder Tree List */}
      <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-1">
        {loading ? (
          <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span>Đang tải thư mục...</span>
          </div>
        ) : rootFolders.length === 0 ? (
          <div className="py-3 text-center text-xs text-muted-foreground italic">
            Chưa có thư mục nào
          </div>
        ) : (
          rootFolders.map((folder) => renderFolderItem(folder, 0))
        )}
      </div>

      {/* Modal Tạo Thư mục mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm">
                {newParentFolderId ? "Tạo thư mục con" : "Tạo thư mục mới"}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Tên thư mục</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Quyết định năm 2026, Công văn đi..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              {/* Color Palette */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Màu sắc đánh dấu</label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolderColor(c)}
                      className="h-6 w-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ backgroundColor: c }}
                    >
                      {newFolderColor === c && <Check className="h-3 w-3 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs h-8"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newFolderName.trim() || isSubmitting}
                  className="text-xs h-8 gap-1.5"
                >
                  {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Tạo thư mục</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
