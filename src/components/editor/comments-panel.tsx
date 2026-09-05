"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  CheckCircle2,
  Trash2,
  CornerDownRight,
  Send,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CommentUser {
  id: string;
  fullName: string | null;
  email: string | null;
}

export interface CommentAnchor {
  from?: number;
  to?: number;
  quote?: string;
}

export interface CommentItem {
  id: string;
  draftId: string;
  userId: string;
  content: string;
  anchorJson: CommentAnchor | null;
  isResolved: boolean;
  createdAt: string;
  user: CommentUser;
  replies?: CommentItem[];
}

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  draftId: string;
  activeAnchor?: CommentAnchor | null;
  onClearAnchor?: () => void;
  onCommentsCountChange?: (count: number) => void;
}

export function CommentsPanel({
  isOpen,
  onClose,
  draftId,
  activeAnchor,
  onClearAnchor,
  onCommentsCountChange,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"open" | "resolved">("open");

  useEffect(() => {
    const openCount = comments.filter((c) => !c.isResolved).length;
    onCommentsCountChange?.(openCount);
  }, [comments, onCommentsCountChange]);

  // Form thêm bình luận mới
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form trả lời
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Lỗi tải bình luận:", err);
    } finally {
      setIsLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    if (isOpen && draftId && draftId !== "draft-temp") {
      const timer = setTimeout(() => {
        fetchComments();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, draftId, fetchComments]);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent,
          anchorJson: activeAnchor || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewContent("");
        onClearAnchor?.();
      }
    } catch (err) {
      console.error("Lỗi tạo bình luận:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmittingReply(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent,
          parentCommentId: parentId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), data.comment],
              };
            }
            return c;
          })
        );
        setReplyContent("");
        setReplyingToId(null);
      }
    } catch (err) {
      console.error("Lỗi trả lời bình luận:", err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleToggleResolved = async (commentId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/drafts/${draftId}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: !currentStatus }),
      });

      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, isResolved: !currentStatus } : c))
        );
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/drafts/${draftId}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error("Lỗi xóa bình luận:", err);
    }
  };

  if (!isOpen) return null;

  const openComments = comments.filter((c) => !c.isResolved);
  const resolvedComments = comments.filter((c) => c.isResolved);
  const displayedComments = activeTab === "open" ? openComments : resolvedComments;

  return (
    <aside className="w-80 sm:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full z-30 shadow-xl font-sans">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Bình luận theo ngữ cảnh
              {openComments.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                  {openComments.length}
                </span>
              )}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* TABS: CHƯA GIẢI QUYẾT / ĐÃ GIẢI QUYẾT */}
      <div className="grid grid-cols-2 p-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("open")}
          className={`py-1.5 rounded-lg transition-colors ${
            activeTab === "open"
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
              : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          }`}
        >
          Đang mở ({openComments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("resolved")}
          className={`py-1.5 rounded-lg transition-colors ${
            activeTab === "resolved"
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
              : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          }`}
        >
          Đã xong ({resolvedComments.length})
        </button>
      </div>

      {/* DANH SÁCH BÌNH LUẬN */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Đang tải danh sách bình luận...
          </div>
        ) : displayedComments.length === 0 ? (
          <div className="py-12 text-center border rounded-xl border-dashed border-slate-200 dark:border-slate-800 p-6">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {activeTab === "open"
                ? "Chưa có bình luận nào đang mở"
                : "Chưa có bình luận nào đã giải quyết"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {activeTab === "open"
                ? "Bôi đen đoạn văn bản và chọn 'Bình luận' để gắn góp ý tại đây."
                : ""}
            </p>
          </div>
        ) : (
          displayedComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                comment.isResolved
                  ? "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs"
              }`}
            >
              {/* THÔNG TIN TÁC GIẢ & NÚT THAO TÁC */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold uppercase">
                    {comment.user.fullName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {comment.user.fullName || "Đồng nghiệp"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(comment.createdAt).toLocaleDateString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleResolved(comment.id, comment.isResolved)}
                    className={`p-1 rounded-md text-xs transition-colors ${
                      comment.isResolved
                        ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                        : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                    }`}
                    title={
                      comment.isResolved ? "Mở lại bình luận" : "Đánh dấu đã giải quyết"
                    }
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="Xóa bình luận"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* TRÍCH DẪN ĐOẠN VĂN BẢN (NẾU CÓ ANCHOR) */}
              {comment.anchorJson?.quote && (
                <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border-l-2 border-amber-500 text-[11px] text-amber-900 dark:text-amber-200 italic line-clamp-2">
                  &ldquo;{comment.anchorJson.quote}&rdquo;
                </div>
              )}

              {/* NỘI DUNG BÌNH LUẬN */}
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>

              {/* DANH SÁCH CÂU TRẢ LỜI (REPLIES) */}
              {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                <div className="pl-3 border-l-2 border-slate-100 dark:border-slate-800 space-y-2 pt-1">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          {reply.user.fullName || "Đồng nghiệp"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(reply.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-snug">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* NÚT TRẢ LỜI / FORM TRẢ LỜI */}
              {replyingToId === comment.id ? (
                <div className="pt-2 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Viết câu trả lời..."
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCreateReply(comment.id)}
                    disabled={isSubmittingReply || !replyContent.trim()}
                    className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isSubmittingReply ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setReplyingToId(comment.id)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-1"
                >
                  <CornerDownRight className="w-3 h-3" /> Trả lời
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* KHUNG SOẠN BÌNH LUẬN MỚI */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        {activeAnchor?.quote && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
            <span className="truncate max-w-[200px] italic">
              &ldquo;{activeAnchor.quote}&rdquo;
            </span>
            <button
              type="button"
              onClick={onClearAnchor}
              className="text-amber-700 hover:text-amber-900 font-bold ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleCreateComment} className="flex items-end gap-2">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={
              activeAnchor ? "Viết bình luận cho đoạn văn..." : "Viết bình luận chung..."
            }
            rows={2}
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />

          <Button
            type="submit"
            disabled={isSubmitting || !newContent.trim()}
            className="h-9 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </aside>
  );
}
