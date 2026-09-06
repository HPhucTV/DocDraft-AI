"use client";

import React, { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  PlusCircle,
  Search,
  LayoutGrid,
  List,
  Clock,
  Trash2,
  Copy,
  RotateCcw,
  X,
  Loader2,
  UploadCloud,
  BookmarkCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FolderTree } from "./folder-tree";
import { SaveTemplateDialog } from "@/components/editor/save-template-dialog";

export interface DraftItem {
  id: string;
  title: string;
  status: string;
  mode: string;
  wordCount: number;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  template?: {
    id: string;
    title: string;
    industryPack?: string | null;
  } | null;
  folder?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
}

export interface TemplateChoice {
  id: string;
  title: string;
  description?: string | null;
  industryPack?: string | null;
  isBuiltin?: boolean;
  isCustom?: boolean;
  createdBy?: string | null;
}

const INDUSTRY_OPTIONS = [
  { value: "ALL", label: "Tất cả ngành nghề" },
  { value: "PUBLIC_ADMIN", label: "Hành chính & Công vụ" },
  { value: "ENTERPRISE", label: "Doanh nghiệp & Thương mại" },
  { value: "EDUCATION", label: "Giáo dục & Đào tạo" },
  { value: "HEALTHCARE", label: "Y tế & Chăm sóc sức khỏe" },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Bản nháp", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  PENDING_APPROVAL: { label: "Chờ duyệt", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  APPROVED: { label: "Đã phê duyệt", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  ARCHIVED: { label: "Lưu trữ", color: "bg-muted text-muted-foreground border-border" },
};

export function DashboardWorkspace() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"ALL" | "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "TRASH">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("ALL");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Modal tạo mới & Quản lý mẫu
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateChoice[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateTab, setTemplateTab] = useState<"ALL" | "SYSTEM" | "CUSTOM">("ALL");
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [uploadedTemplateData, setUploadedTemplateData] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
  }>({
    isOpen: false,
    title: "",
    content: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreating, startCreatingTransition] = useTransition();

  // Tải danh sách bản nháp
  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === "TRASH") {
        params.append("trash", "true");
      } else if (activeTab !== "ALL") {
        params.append("status", activeTab);
      }

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      if (selectedIndustry !== "ALL") {
        params.append("industryPack", selectedIndustry);
      }

      if (selectedFolderId) {
        params.append("folderId", selectedFolderId);
      }

      const res = await fetch(`/api/drafts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách bản nháp:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, selectedIndustry, selectedFolderId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDrafts();
    }, 250);
    return () => clearTimeout(handler);
  }, [fetchDrafts]);

  // Tải danh sách templates (bao gồm mẫu quy chuẩn và mẫu cá nhân)
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải biểu mẫu:", err);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  // Mở modal tạo mới & làm mới danh sách templates
  const handleOpenCreateModal = async () => {
    setIsCreateModalOpen(true);
    fetchTemplates();
  };

  // Xử lý tải lên tệp mẫu (.docx, .txt, .md)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTemplate(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/templates/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tải lên và bóc tách tệp mẫu");
      }

      // Mở modal xác nhận lưu mẫu
      setUploadedTemplateData({
        isOpen: true,
        title: data.title || file.name.replace(/\.[^/.]+$/, ""),
        content: data.contentHtml,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Lỗi tải tệp mẫu: ${errMsg}`);
    } finally {
      setIsUploadingTemplate(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Xử lý xóa mẫu cá nhân
  const handleDeleteCustomTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa mẫu văn bản cá nhân này không?")) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || "Không thể xóa mẫu văn bản");
      }
    } catch (err) {
      console.error("Lỗi khi xóa mẫu:", err);
    }
  };

  // Tạo bản nháp mới từ template
  const handleCreateFromTemplate = (template?: TemplateChoice) => {
    startCreatingTransition(async () => {
      try {
        const res = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: template ? `Dự thảo ${template.title}` : "Văn bản dự thảo mới",
            templateId: template?.id || null,
          }),
        });

        if (res.ok) {
          const newDraft = await res.json();
          setIsCreateModalOpen(false);
          router.push(`/editor?id=${newDraft.id}`);
        }
      } catch (err) {
        console.error("Lỗi khi khởi tạo bản nháp:", err);
        alert("Không thể khởi tạo bản nháp mới");
      }
    });
  };

  // Nhân bản
  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/drafts/${id}/duplicate`, { method: "POST" });
      if (res.ok) {
        fetchDrafts();
      }
    } catch (err) {
      console.error("Lỗi khi nhân bản:", err);
    }
  };

  // Xóa / Đưa vào thùng rác
  const handleDelete = async (id: string, isPermanent: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = confirm(
      isPermanent
        ? "Bạn có chắc chắn muốn xóa vĩnh viễn văn bản này? Thao tác này không thể hoàn tác."
        : "Chuyển văn bản này vào Thùng rác?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/drafts/${id}${isPermanent ? "?permanent=true" : ""}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDrafts();
      }
    } catch (err) {
      console.error("Lỗi khi xóa văn bản:", err);
    }
  };

  // Khôi phục từ thùng rác
  const handleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/drafts/${id}/restore`, { method: "POST" });
      if (res.ok) {
        fetchDrafts();
      }
    } catch (err) {
      console.error("Lỗi khi khôi phục:", err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Cột trái: Cây thư mục lồng nhau Drag & Drop (TASK-208) */}
      <aside className="w-full lg:w-64 shrink-0 rounded-2xl border bg-card p-4 shadow-xs self-start sticky top-20">
        <FolderTree
          selectedFolderId={selectedFolderId}
          onSelectFolder={(id) => setSelectedFolderId(id)}
          onDraftDropped={() => fetchDrafts()}
        />
      </aside>

      {/* Cột phải: Không gian văn bản & Bảng điều khiển */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Control Bar: Search, Industry Filter, View Toggles & New Button */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm văn bản theo tiêu đề, loại mẫu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-4 text-sm shadow-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Industry Filter */}
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-xs font-medium shadow-xs focus:border-primary focus:outline-none"
          >
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Buttons */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
              title="Chế độ Lưới (Grid View)"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
              title="Chế độ Danh sách (List View)"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Primary "+ Tạo mới" Button */}
          <Button onClick={handleOpenCreateModal} className="gap-2 shadow-xs">
            <PlusCircle className="h-4 w-4" />
            <span>Tạo mới văn bản</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b flex items-center gap-1 overflow-x-auto text-sm font-medium">
        {[
          { id: "ALL", label: "Tất cả văn bản" },
          { id: "DRAFT", label: "Bản nháp" },
          { id: "PENDING_APPROVAL", label: "Chờ phê duyệt" },
          { id: "APPROVED", label: "Đã ban hành" },
          { id: "TRASH", label: "Thùng rác", icon: Trash2 },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Rendering: Loading vs Empty vs Grid vs List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-xl border bg-card p-5 animate-pulse space-y-4">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-6 w-3/4 rounded bg-muted" />
              <div className="h-24 rounded bg-muted/40" />
            </div>
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            {activeTab === "TRASH" ? <Trash2 className="h-7 w-7" /> : <FileText className="h-7 w-7" />}
          </div>
          <h3 className="text-lg font-semibold">
            {activeTab === "TRASH" ? "Thùng rác trống" : "Không tìm thấy văn bản nào"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            {activeTab === "TRASH"
              ? "Các văn bản đã xóa mềm sẽ được lưu trữ tại đây trước khi xóa vĩnh viễn."
              : searchQuery
              ? `Không có văn bản nào khớp với từ khóa "${searchQuery}".`
              : "Bắt đầu soạn thảo văn bản quy chuẩn Nghị định 30 đầu tiên ngay bây giờ."}
          </p>
          {activeTab !== "TRASH" && (
            <div className="mt-6">
              <Button onClick={handleOpenCreateModal} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Tạo văn bản ngay</span>
              </Button>
            </div>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View: A4 Canvas preview cards */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft) => {
            const statusConfig = STATUS_MAP[draft.status] || STATUS_MAP.DRAFT;
            const isTrash = draft.deletedAt !== null && draft.deletedAt !== undefined;

            return (
              <div
                key={draft.id}
                draggable={!isTrash}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/draft-id", draft.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onClick={() => {
                  if (!isTrash) router.push(`/editor?id=${draft.id}`);
                }}
                className={`group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-primary/50 cursor-pointer ${
                  isTrash ? "opacity-75 bg-muted/10 cursor-default" : ""
                }`}
              >
                {/* Header: Status Badge & Template Badge */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusConfig.color}`}
                  >
                    {statusConfig.label}
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {draft.folder && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: draft.folder.color || "#3b82f6" }}
                        />
                        <span className="truncate max-w-[100px]">{draft.folder.name}</span>
                      </span>
                    )}

                    {draft.template?.industryPack && (
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {draft.template.industryPack}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Document Meta */}
                <div className="mt-4 space-y-2 flex-1">
                  <h4 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors">
                    {draft.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {draft.template?.title ? `Mẫu: ${draft.template.title}` : "Soạn thảo tự do"}
                  </p>
                </div>

                {/* Bottom Meta & Action Buttons */}
                <div className="mt-5 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {new Date(draft.updatedAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>&bull;</span>
                    <span>{draft.wordCount} từ</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                    {isTrash ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                          title="Khôi phục"
                          onClick={(e) => handleRestore(draft.id, e)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive/80"
                          title="Xóa vĩnh viễn"
                          onClick={(e) => handleDelete(draft.id, true, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Nhân bản"
                          onClick={(e) => handleDuplicate(draft.id, e)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive/80"
                          title="Chuyển vào thùng rác"
                          onClick={(e) => handleDelete(draft.id, false, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View: Detailed Table */
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Tên văn bản</th>
                <th className="px-4 py-3.5">Mẫu quy chuẩn</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Số từ</th>
                <th className="px-4 py-3.5">Cập nhật</th>
                <th className="px-6 py-3.5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drafts.map((draft) => {
                const statusConfig = STATUS_MAP[draft.status] || STATUS_MAP.DRAFT;
                const isTrash = draft.deletedAt !== null && draft.deletedAt !== undefined;

                return (
                  <tr
                    key={draft.id}
                    draggable={!isTrash}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/draft-id", draft.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    className="transition-colors hover:bg-muted/30 cursor-pointer"
                    onClick={() => {
                      if (!isTrash) router.push(`/editor?id=${draft.id}`);
                    }}
                  >
                    <td className="px-6 py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="line-clamp-1">{draft.title}</span>
                          {draft.folder && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <span
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: draft.folder.color || "#3b82f6" }}
                              />
                              <span className="truncate max-w-[140px]">{draft.folder.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {draft.template?.title || "Soạn thảo tự do"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{draft.wordCount} từ</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {new Date(draft.updatedAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {isTrash ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600"
                              title="Khôi phục"
                              onClick={(e) => handleRestore(draft.id, e)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              title="Xóa vĩnh viễn"
                              onClick={(e) => handleDelete(draft.id, true, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Nhân bản"
                              onClick={(e) => handleDuplicate(draft.id, e)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              title="Xóa"
                              onClick={(e) => handleDelete(draft.id, false, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal "+ Tạo mới văn bản" */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl border bg-background p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-bold">Khởi tạo văn bản mới</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chọn mẫu văn bản quy chuẩn hành chính hoặc bắt đầu từ trang trắng
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Options Grid: Blank Document & Upload Template File */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Soạn thảo tự do */}
              <div
                onClick={() => handleCreateFromTemplate()}
                className="flex items-center justify-between p-3.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:scale-105 transition-transform shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Soạn thảo văn bản tự do</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      Trang A4 trắng lề chuẩn 30/15/20/20mm
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs font-medium" disabled={isCreating}>
                  Bắt đầu
                </Button>
              </div>

              {/* Tải lên tệp mẫu */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-between p-3.5 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white group-hover:scale-105 transition-transform shrink-0">
                    {isUploadingTemplate ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <UploadCloud className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-foreground">Tải lên tệp mẫu</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      Hỗ trợ tệp .docx, .txt, .md
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-medium border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  disabled={isUploadingTemplate}
                >
                  {isUploadingTemplate ? "Đang đọc..." : "Chọn tệp"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.txt,.md"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Template Gallery with Tabs */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between border-b pb-2.5">
                {/* Tabs phân loại mẫu */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setTemplateTab("ALL")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      templateTab === "ALL"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    Tất cả ({templates.length})
                  </button>
                  <button
                    onClick={() => setTemplateTab("SYSTEM")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      templateTab === "SYSTEM"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    Mẫu quy chuẩn ({templates.filter((t) => t.isBuiltin !== false).length})
                  </button>
                  <button
                    onClick={() => setTemplateTab("CUSTOM")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      templateTab === "CUSTOM"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                    }`}
                  >
                    <BookmarkCheck className="h-3 w-3" />
                    <span>
                      Mẫu của tôi ({templates.filter((t) => t.isCustom || t.isBuiltin === false).length})
                    </span>
                  </button>
                </div>

                {loadingTemplates && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
              </div>

              {/* Danh sách templates theo tab */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {templates
                  .filter((tmpl) => {
                    if (templateTab === "SYSTEM") return tmpl.isBuiltin !== false;
                    if (templateTab === "CUSTOM") return tmpl.isCustom === true || tmpl.isBuiltin === false;
                    return true;
                  })
                  .map((tmpl) => {
                    const isCustom = tmpl.isCustom || tmpl.isBuiltin === false;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => handleCreateFromTemplate(tmpl)}
                        className="flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                              {tmpl.title}
                            </span>
                            {isCustom ? (
                              <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <BookmarkCheck className="h-2.5 w-2.5" />
                                MẪU CỦA TÔI
                              </span>
                            ) : tmpl.industryPack ? (
                              <span className="text-[10px] font-medium bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                {tmpl.industryPack}
                              </span>
                            ) : null}
                          </div>
                          {tmpl.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{tmpl.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {isCustom && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Xóa mẫu này"
                              onClick={(e) => handleDeleteCustomTemplate(tmpl.id, e)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs font-medium"
                            disabled={isCreating}
                            onClick={() => handleCreateFromTemplate(tmpl)}
                          >
                            Chọn mẫu
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                {/* Khi tab Mẫu của tôi trống */}
                {templateTab === "CUSTOM" &&
                  templates.filter((t) => t.isCustom || t.isBuiltin === false).length === 0 && (
                    <div className="py-8 text-center space-y-2 border border-dashed rounded-xl p-4">
                      <BookmarkCheck className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                      <p className="text-xs font-medium text-foreground">Bạn chưa lưu mẫu văn bản cá nhân nào</p>
                      <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                        Hãy bấm &ldquo;Tải lên tệp mẫu&rdquo; ở trên hoặc dùng Copilot AI trong trình soạn thảo để lưu những mẫu văn bản ưng ý nhất.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog lưu mẫu khi tải lên file */}
      <SaveTemplateDialog
        isOpen={uploadedTemplateData.isOpen}
        onClose={() => setUploadedTemplateData((prev) => ({ ...prev, isOpen: false }))}
        defaultTitle={uploadedTemplateData.title}
        initialContentHtml={uploadedTemplateData.content}
        onSuccess={(newTemplate) => {
          setTemplates((prev) => [newTemplate, ...prev]);
          setTemplateTab("CUSTOM");
        }}
      />
      </div>
    </div>
  );
}
