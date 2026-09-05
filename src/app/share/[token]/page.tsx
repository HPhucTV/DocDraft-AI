"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import {
  FileText,
  Lock,
  Eye,
  Edit3,
  MessageSquare,
  AlertCircle,
  Loader2,
  Calendar,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TiptapNode } from "@/lib/compliance/compliance-engine";

interface SharedDraftData {
  id: string;
  title: string;
  docType: string;
  contentJson: TiptapNode;
  updatedAt: string;
  sharerName: string;
}

export default function SharedDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [isLoading, setIsLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [draft, setDraft] = useState<SharedDraftData | null>(null);
  const [permission, setPermission] = useState<"VIEW" | "COMMENT" | "EDIT">("VIEW");

  // 1. Mở khóa tài liệu
  const unlockDocument = useCallback(async (pwd: string) => {
    setIsUnlocking(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/share/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Mật khẩu không chính xác");
        setIsUnlocking(false);
        return;
      }

      setDraft(data.draft);
      setPermission(data.permission);
      setRequiresPassword(false);
    } catch {
      setErrorMessage("Lỗi kết nối khi mở khóa tài liệu");
    } finally {
      setIsLoading(false);
      setIsUnlocking(false);
    }
  }, [token]);

  // 2. Kiểm tra trạng thái liên kết
  useEffect(() => {
    async function checkLink() {
      try {
        const res = await fetch(`/api/share/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.error || "Liên kết không hợp lệ");
          setIsLoading(false);
          return;
        }

        if (data.requiresPassword) {
          setRequiresPassword(true);
          setIsLoading(false);
        } else {
          // Mở khóa tự động nếu không có mật khẩu
          await unlockDocument("");
        }
      } catch {
        setErrorMessage("Không thể kết nối đến máy chủ");
        setIsLoading(false);
      }
    }

    checkLink();
  }, [token, unlockDocument]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    unlockDocument(password);
  };

  // 3. Render nội dung văn bản từ AST (chế độ xem)
  const renderAstContent = (node: TiptapNode | null): React.ReactNode => {
    if (!node) return null;

    if (node.type === "doc" && Array.isArray(node.content)) {
      return (
        <div className="space-y-3">
          {node.content.map((child, idx) => (
            <React.Fragment key={idx}>{renderAstContent(child)}</React.Fragment>
          ))}
        </div>
      );
    }

    if (node.type === "paragraph") {
      const textAlign = (node.attrs?.textAlign as string) || "left";
      const alignClass =
        textAlign === "center"
          ? "text-center"
          : textAlign === "right"
          ? "text-right"
          : textAlign === "justify"
          ? "text-justify"
          : "text-left";

      return (
        <p className={`my-1 leading-relaxed ${alignClass}`}>
          {Array.isArray(node.content) ? (
            node.content.map((c, cIdx) => {
              let textNode = <span>{c.text}</span>;
              if (Array.isArray(c.marks)) {
                c.marks.forEach((m) => {
                  if (m.type === "bold") textNode = <strong>{textNode}</strong>;
                  if (m.type === "italic") textNode = <em>{textNode}</em>;
                  if (m.type === "underline") textNode = <u>{textNode}</u>;
                });
              }
              return <React.Fragment key={cIdx}>{textNode}</React.Fragment>;
            })
          ) : (
            <br />
          )}
        </p>
      );
    }

    if (node.type === "table" && Array.isArray(node.content)) {
      return (
        <table className="w-full my-4 border-collapse border-none">
          <tbody>
            {node.content.map((row, rIdx) => (
              <tr key={rIdx}>
                {Array.isArray(row.content) &&
                  row.content.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="p-1 align-top border-none"
                      style={{ width: `${100 / (row.content?.length || 1)}%` }}
                    >
                      {Array.isArray(cell.content) &&
                        cell.content.map((p, pIdx) => (
                          <React.Fragment key={pIdx}>{renderAstContent(p)}</React.Fragment>
                        ))}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Đang kiểm tra liên kết chia sẻ...</p>
      </div>
    );
  }

  // MÀN HÌNH NHẬP MẬT KHẨU
  if (requiresPassword) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Tài liệu được bảo vệ bằng mật khẩu
            </h2>
            <p className="text-xs text-slate-500">
              Người tạo đã thiết lập mật khẩu cho tài liệu này. Vui lòng nhập mật khẩu để mở khóa.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu truy cập
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isUnlocking}
              className="w-full h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {isUnlocking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Mở khóa tài liệu
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // MÀN HÌNH BÁO LỖI HẾT HẠN HOẶC KHÔNG TỒN TẠI
  if (errorMessage && !draft) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Không thể truy cập tài liệu
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // MÀN HÌNH XEM VĂN BẢN ĐƯỢC CHIA SẺ
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold truncate max-w-md">{draft?.title}</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {draft?.docType}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
              <span className="flex items-center gap-1">
                <UserIcon className="w-3 h-3" />
                Người chia sẻ: <strong>{draft?.sharerName}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Cập nhật: {draft?.updatedAt ? new Date(draft.updatedAt).toLocaleDateString("vi-VN") : ""}
              </span>
            </div>
          </div>
        </div>

        {/* QUYỀN TRUY CẬP VÀ CÁC NÚT TÁC VỤ */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
            {permission === "VIEW" ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Chỉ xem</span>
              </>
            ) : permission === "COMMENT" ? (
              <>
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Bình luận</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* VÙNG HIỂN THỊ CANVAS A4 */}
      <main className="flex-1 p-4 sm:p-8 md:p-12 overflow-x-auto flex justify-center">
        <div
          className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl rounded-xs border border-slate-200 dark:border-slate-800 box-border"
          style={{
            width: "210mm",
            minHeight: "297mm",
            paddingTop: "20mm",
            paddingBottom: "20mm",
            paddingLeft: "30mm",
            paddingRight: "15mm",
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: "13pt",
          }}
        >
          {draft?.contentJson ? (
            renderAstContent(draft.contentJson)
          ) : (
            <p className="text-slate-400 italic text-center py-20">Văn bản chưa có nội dung.</p>
          )}
        </div>
      </main>
    </div>
  );
}
