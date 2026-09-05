"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Lock,
  Copy,
  Check,
  Trash2,
  Eye,
  Edit3,
  MessageSquare,
  Loader2,
  Globe,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface SharedLinkItem {
  id: string;
  shareToken: string;
  shareUrl: string;
  permission: "VIEW" | "COMMENT" | "EDIT";
  hasPassword: boolean;
  expiresAt: string | null;
  useCount: number;
  createdAt: string;
  isExpired: boolean;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId: string;
  draftTitle?: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  draftId,
  draftTitle = "Văn bản",
}: ShareDialogProps) {
  const [links, setLinks] = useState<SharedLinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [permission, setPermission] = useState<"VIEW" | "COMMENT" | "EDIT">("VIEW");
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}/share`);
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách liên kết:", err);
    } finally {
      setIsLoading(false);
    }
  }, [draftId]);

  // Tải danh sách liên kết khi mở dialog
  useEffect(() => {
    if (open && draftId && draftId !== "draft-temp") {
      const timer = setTimeout(() => {
        fetchLinks();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, draftId, fetchLinks]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsCreating(true);

    try {
      const res = await fetch(`/api/drafts/${draftId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permission,
          password: hasPassword ? password : undefined,
          expiresInDays: expiresInDays > 0 ? expiresInDays : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Không thể tạo liên kết chia sẻ");
        setIsCreating(false);
        return;
      }

      // Reset form
      setPassword("");
      setHasPassword(false);
      await fetchLinks();
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      const res = await fetch(`/api/drafts/${draftId}/share/${linkId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
      }
    } catch (err) {
      console.error("Lỗi xóa liên kết:", err);
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Chia sẻ liên kết bảo mật
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Chia sẻ &ldquo;{draftTitle}&rdquo; với đồng nghiệp hoặc đối tác qua đường dẫn bảo mật
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* FORM TẠO LIÊN KẾT MỚI */}
          <form
            onSubmit={handleCreateLink}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              Tạo liên kết mới
            </h3>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* PHÂN QUYỀN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quyền truy cập
                </label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as "VIEW" | "COMMENT" | "EDIT")}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="VIEW">Chỉ xem (Xem & Tải văn bản)</option>
                  <option value="COMMENT">Bình luận (Góp ý điều khoản)</option>
                  <option value="EDIT">Chỉnh sửa (Cộng tác nội dung)</option>
                </select>
              </div>

              {/* HẠN SỬ DỤNG */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thời hạn hiệu lực
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>1 ngày</option>
                  <option value={7}>7 ngày (Khuyên dùng)</option>
                  <option value={30}>30 ngày</option>
                  <option value={0}>Vĩnh viễn (Không hết hạn)</option>
                </select>
              </div>
            </div>

            {/* BẢO VỆ BẰNG MẬT KHẨU */}
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={hasPassword}
                  onChange={(e) => setHasPassword(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Đặt mật khẩu bảo vệ liên kết</span>
              </label>

              {hasPassword && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu bảo vệ..."
                  required={hasPassword}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            <Button
              type="submit"
              disabled={isCreating}
              className="w-full h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {isCreating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              Tạo liên kết chia sẻ
            </Button>
          </form>

          {/* DANH SÁCH CÁC LIÊN KẾT ĐÃ TẠO */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Các liên kết đang hoạt động ({links.length})
            </h3>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Đang tải liên kết...
              </div>
            ) : links.length === 0 ? (
              <div className="p-6 text-center border rounded-xl border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Chưa có liên kết chia sẻ nào. Tạo liên kết đầu tiên ở khung trên.
              </div>
            ) : (
              <div className="space-y-2.5">
                {links.map((link) => {
                  const isCopied = copiedId === link.id;

                  return (
                    <div
                      key={link.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 overflow-hidden max-w-full sm:max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            {link.permission === "VIEW" ? (
                              <Eye className="w-3 h-3 text-blue-500" />
                            ) : link.permission === "COMMENT" ? (
                              <MessageSquare className="w-3 h-3 text-amber-500" />
                            ) : (
                              <Edit3 className="w-3 h-3 text-emerald-500" />
                            )}
                            {link.permission === "VIEW"
                              ? "Chỉ xem"
                              : link.permission === "COMMENT"
                              ? "Bình luận"
                              : "Chỉnh sửa"}
                          </span>

                          {link.hasPassword && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Có mật khẩu
                            </span>
                          )}

                          {link.isExpired && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Đã hết hạn
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 truncate max-w-sm sm:max-w-md font-mono">
                          {link.shareUrl}
                        </div>

                        <div className="text-[10px] text-slate-400 flex items-center gap-3">
                          <span>Đã mở: {link.useCount} lượt</span>
                          {link.expiresAt && (
                            <span>
                              Hết hạn: {new Date(link.expiresAt).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(link.shareUrl, link.id)}
                          className="h-8 text-xs gap-1.5 px-3"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã sao chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </Button>

                        <a
                          href={link.shareUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Mở liên kết"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Thu hồi liên kết"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
