"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import {
  FileText,
  Wand2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  Columns2,
  FileCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatDocumentND30,
  insertNationalHeaderTable,
  insertSignatureFooterTable,
  getSelectedWordText,
  replaceSelectedWordText,
  isWordEnvironment,
} from "@/lib/office/word-service";

export default function WordAddinTaskpanePage() {
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Trạng thái AI Copilot
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>("formalize");
  const [previewText, setPreviewText] = useState<string>("");

  // Trạng thái mở rộng hướng dẫn
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Kiểm tra Office.js khi trang đã tải
    const timer = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const officeGlobal = (window as any).Office;
      if (officeGlobal && officeGlobal.onReady) {
        officeGlobal.onReady((info: { host?: string }) => {
          if (info.host === "Word" || isWordEnvironment()) {
            setIsOfficeReady(true);
            setStatusMessage({
              type: "success",
              text: "Đã kết nối thành công với Microsoft Word!",
            });
          }
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 1-Click Chuẩn hóa thể thức NĐ 30
  const handleFormatND30 = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const result = await formatDocumentND30();
      setStatusMessage({
        type: "success",
        text: result.message,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setStatusMessage({
        type: "error",
        text: `Lỗi chuẩn hóa: ${msg}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Chèn khối Quốc hiệu & Tiêu ngữ
  const handleInsertHeader = async () => {
    setIsLoading(true);
    try {
      const res = await insertNationalHeaderTable();
      setStatusMessage({
        type: "success",
        text: res.message,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Chèn khối Nơi nhận & Ký tên
  const handleInsertFooter = async () => {
    setIsLoading(true);
    try {
      const res = await insertSignatureFooterTable();
      setStatusMessage({
        type: "success",
        text: res.message,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi AI Copilot trên đoạn văn bản đang bôi đen
  const handleRunAiCopilot = async (command: string) => {
    setSelectedAction(command);
    setAiLoading(true);
    setStatusMessage(null);

    try {
      // 1. Đọc đoạn văn bản bôi đen trong Word
      const selectedText = await getSelectedWordText();
      if (!selectedText || !selectedText.trim()) {
        setStatusMessage({
          type: "info",
          text: "Vui lòng bôi đen một đoạn văn bản trong Word trước khi gọi AI.",
        });
        setAiLoading(false);
        return;
      }

      // 2. Gọi API Inline Edit
      const res = await fetch("/api/ai/inline-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedText,
          command,
          documentTitle: "Văn bản Word",
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể kết nối đến máy chủ AI");
      }

      const data = await res.json();
      const resultText = data.resultText || "";
      setPreviewText(resultText);

      // 3. Thay thế trực tiếp vào Word
      await replaceSelectedWordText(resultText);

      setStatusMessage({
        type: "success",
        text: `Đã áp dụng lệnh "${command}" vào văn bản Word!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setStatusMessage({
        type: "error",
        text: `Lỗi AI: ${msg}`,
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      {/* Nạp thư viện Office.js chính thức từ CDN Microsoft */}
      <Script
        src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
        strategy="afterInteractive"
      />

      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 space-y-4 max-w-sm mx-auto font-sans">
        {/* HEADER: LOGO & STATUS */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                DocDraft AI
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Lite
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">Chuẩn hóa Nghị định 30 trong Word</p>
            </div>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
              isOfficeReady
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOfficeReady ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            {isOfficeReady ? "Word Online" : "Xem trước Web"}
          </div>
        </div>

        {/* THÔNG BÁO TRẠNG THÁI */}
        {statusMessage && (
          <div
            className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border transition-all ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                : statusMessage.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300"
                : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : statusMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            ) : (
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            )}
            <span className="leading-snug">{statusMessage.text}</span>
          </div>
        )}

        {/* KHỐI 1: CHUẨN HÓA THỂ THỨC 1-CLICK (TASK-304) */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
              Chuẩn hóa Thể thức NĐ 30
            </span>
          </div>

          <Button
            onClick={handleFormatND30}
            disabled={isLoading}
            className="w-full h-10 text-xs font-bold gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            1-Click: Căn lề 30/15 &amp; Times 13pt
          </Button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleInsertHeader}
              disabled={isLoading}
              className="text-[11px] h-8 px-2 gap-1 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Chèn bảng Quốc hiệu & Tiêu ngữ chuẩn vào đầu trang"
            >
              <Columns2 className="w-3 h-3 text-indigo-600" />
              + Quốc hiệu/Tiêu ngữ
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleInsertFooter}
              disabled={isLoading}
              className="text-[11px] h-8 px-2 gap-1 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Chèn bảng Nơi nhận & Ký tên chuẩn vào cuối trang"
            >
              <Columns2 className="w-3 h-3 text-indigo-600" />
              + Nơi nhận &amp; Chữ ký
            </Button>
          </div>
        </div>

        {/* KHỐI 2: AI COPILOT TRỰC TIẾP TRONG WORD (TASK-304) */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              AI Copilot trên văn bản bôi đen
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Bôi đen đoạn văn bản bất kỳ trong Word và bấm chọn tác vụ dưới đây:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRunAiCopilot("formalize")}
              disabled={aiLoading}
              className="text-xs h-8 gap-1.5 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300"
            >
              {aiLoading && selectedAction === "formalize" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 text-indigo-600" />
              )}
              Hành chính hóa
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRunAiCopilot("shorten")}
              disabled={aiLoading}
              className="text-xs h-8 gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {aiLoading && selectedAction === "shorten" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3 text-blue-600" />
              )}
              Rút gọn ý chính
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRunAiCopilot("expand")}
              disabled={aiLoading}
              className="text-xs h-8 gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {aiLoading && selectedAction === "expand" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3 text-emerald-600" />
              )}
              Viết chi tiết
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRunAiCopilot("fix_spelling")}
              disabled={aiLoading}
              className="text-xs h-8 gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {aiLoading && selectedAction === "fix_spelling" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-amber-600" />
              )}
              Sửa chính tả
            </Button>
          </div>

          {previewText && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
              <span className="font-semibold text-slate-500">Kết quả AI vừa chèn:</span>
              <p className="line-clamp-3 text-slate-700 dark:text-slate-300 italic">
                &ldquo;{previewText}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* KHỐI 3: HƯỚNG DẪN CÀI ĐẶT ADD-IN VÀO WORD (SIDELOADING GUIDE) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full p-3 flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              Hướng dẫn cài Add-in vào Word
            </span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showGuide && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 leading-relaxed">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Cách 1: Cài trên Word Online (Trình duyệt):
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Mở tài liệu trên Microsoft Word Online.</li>
                <li>Chọn tab <strong>Chèn (Insert)</strong> → <strong>Tiện ích (Add-ins)</strong>.</li>
                <li>Chọn <strong>Tiện ích của tôi</strong> → <strong>Tải lên tiện ích của tôi</strong>.</li>
                <li>
                  Tải tệp tin:{" "}
                  <a
                    href="/word-addin/manifest.xml"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    manifest.xml <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
              </ol>

              <p className="font-medium text-slate-900 dark:text-slate-100 pt-1">
                Cách 2: Cài trên Microsoft Word Desktop (Windows):
              </p>
              <p>
                Sao chép tệp <code>manifest.xml</code> vào thư mục chia sẻ mạng nội bộ hoặc thư mục Sideloading của Office theo hướng dẫn từ Microsoft Developer.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="text-center text-[10px] text-slate-400 pt-2">
          DocDraft AI v1.0 • Chuẩn hóa văn bản hành chính Việt Nam
        </div>
      </div>
    </>
  );
}
