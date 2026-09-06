"use client";

import React, { useState, useEffect, useRef } from "react";
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
  LayoutTemplate,
  Send,
  ArrowDownToLine,
  Layers,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatDocumentND30,
  insertNationalHeaderTable,
  insertSignatureFooterTable,
  getSelectedWordText,
  replaceSelectedWordText,
  insertSnippetAtCursor,
  insertDocumentContent,
  isWordEnvironment,
} from "@/lib/office/word-service";

interface TemplateItem {
  id: string;
  title: string;
  description?: string;
  category?: { name: string };
  formSchema?: {
    properties?: Record<
      string,
      {
        title?: string;
        type?: string;
        placeholder?: string;
        description?: string;
      }
    >;
    required?: string[];
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function WordAddinTaskpanePage() {
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"format" | "template" | "raw" | "copilot">("format");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Tab 1: Format & Inline AI
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>("formalize");
  const [previewText, setPreviewText] = useState<string>("");
  const [showGuide, setShowGuide] = useState(false);

  // Tab 2: Template Generator
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [generatedDocHtml, setGeneratedDocHtml] = useState<string>("");

  // Tab 3: Raw Polish
  const [rawText, setRawText] = useState("");
  const [targetDocType, setTargetDocType] = useState("Công văn");
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishedHtml, setPolishedHtml] = useState("");

  // Tab 4: Copilot Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Xin chào! Tôi là Trợ lý DocDraft AI trong Microsoft Word. Tôi có thể hỗ trợ tra cứu thể thức Nghị định 30, gợi ý căn cứ pháp lý, hoặc soạn thảo văn bản giúp bạn.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Khởi tạo Office.js
  useEffect(() => {
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

  // Tải danh sách mẫu khi mở tab template
  useEffect(() => {
    if (activeTab === "template" && templates.length === 0) {
      fetch("/api/templates")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setTemplates(data);
            setSelectedTemplateId(data[0].id);
          }
        })
        .catch(() => {
          // Fallback các mẫu cơ bản nếu chưa login hoặc chạy offline
          setTemplates([
            {
              id: "to-trinh-kinh-phi",
              title: "Tờ trình xin phê duyệt kinh phí",
              formSchema: {
                properties: {
                  kinh_phi_du_kien: { title: "Kinh phí dự kiến (VNĐ)", placeholder: "VD: 50.000.000 VNĐ" },
                  ly_do_de_xuat: { title: "Lý do đề xuất", placeholder: "Mua sắm trang thiết bị văn phòng..." },
                },
              },
            },
            {
              id: "cong-van-thong-bao",
              title: "Công văn thông báo nội bộ",
              formSchema: {
                properties: {
                  trich_yeu: { title: "Trích yếu", placeholder: "V/v lịch nghỉ lễ Quốc khánh..." },
                  noi_dung_chinh: { title: "Nội dung chính", placeholder: "Thông báo toàn thể cán bộ công nhân viên..." },
                },
              },
            },
            {
              id: "quyet-dinh-bo-nhiem",
              title: "Quyết định bổ nhiệm cán bộ",
              formSchema: {
                properties: {
                  ho_ten: { title: "Họ và tên cán bộ", placeholder: "Ông/Bà Nguyễn Văn A" },
                  chuc_vu_moi: { title: "Chức vụ bổ nhiệm", placeholder: "Trưởng phòng Kế hoạch" },
                },
              },
            },
          ]);
          setSelectedTemplateId("to-trinh-kinh-phi");
        });
    }
  }, [activeTab, templates.length]);

  // Cuộn xuống cuối khung chat
  useEffect(() => {
    if (activeTab === "copilot") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  // 1-Click Chuẩn hóa thể thức NĐ 30
  const handleFormatND30 = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const result = await formatDocumentND30();
      setStatusMessage({ type: "success", text: result.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setStatusMessage({ type: "error", text: `Lỗi: ${msg}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertHeader = async () => {
    setIsLoading(true);
    try {
      const res = await insertNationalHeaderTable();
      setStatusMessage({ type: "success", text: res.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertFooter = async () => {
    setIsLoading(true);
    try {
      const res = await insertSignatureFooterTable();
      setStatusMessage({ type: "success", text: res.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // AI Copilot trên đoạn bôi đen
  const handleRunAiCopilot = async (command: string) => {
    setSelectedAction(command);
    setAiLoading(true);
    setStatusMessage(null);

    try {
      const selectedText = await getSelectedWordText();
      if (!selectedText || !selectedText.trim()) {
        setStatusMessage({
          type: "info",
          text: "Vui lòng bôi đen một đoạn văn bản trong Word trước khi gọi AI.",
        });
        setAiLoading(false);
        return;
      }

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
        throw new Error("Không thể kết nối đến máy chủ AI (Hãy kiểm tra đăng nhập)");
      }

      const data = await res.json();
      const resultText = data.resultText || "";
      setPreviewText(resultText);

      await replaceSelectedWordText(resultText);
      setStatusMessage({
        type: "success",
        text: `Đã áp dụng lệnh "${command}" vào văn bản Word!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setStatusMessage({ type: "error", text: `Lỗi AI: ${msg}` });
    } finally {
      setAiLoading(false);
    }
  };

  // Sinh văn bản theo mẫu (Template Generator)
  const handleGenerateTemplate = async () => {
    if (!selectedTemplateId) return;
    setIsGeneratingTemplate(true);
    setGeneratedDocHtml("");
    setStatusMessage(null);

    try {
      const res = await fetch("/api/ai/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          variables: formValues,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể gọi API sinh văn bản");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.content) {
                  accumulated += parsed.content;
                  setGeneratedDocHtml(accumulated);
                }
              } catch {
                accumulated += dataStr;
                setGeneratedDocHtml(accumulated);
              }
            }
          }
        }
      }

      setStatusMessage({
        type: "success",
        text: "AI đã sinh xong văn bản! Bạn có thể bấm 'Chèn vào Word' bên dưới.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi";
      setStatusMessage({ type: "error", text: `Lỗi sinh mẫu: ${msg}` });
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  // Chuốt văn bản thô (Raw Polish)
  const handlePolishRaw = async () => {
    if (!rawText.trim()) {
      setStatusMessage({ type: "info", text: "Vui lòng nhập nội dung nháp thô." });
      return;
    }
    setIsPolishing(true);
    setPolishedHtml("");
    setStatusMessage(null);

    try {
      const res = await fetch("/api/ai/raw-to-doc/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          targetDocType,
        }),
      });

      if (!res.ok) {
        throw new Error("Lỗi kết nối API Raw-to-Doc");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.content) {
                  accumulated += parsed.content;
                  setPolishedHtml(accumulated);
                }
              } catch {
                accumulated += dataStr;
                setPolishedHtml(accumulated);
              }
            }
          }
        }
      }

      setStatusMessage({
        type: "success",
        text: "Đã chuốt xong văn bản! Sẵn sàng chèn vào Word.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi";
      setStatusMessage({ type: "error", text: `Lỗi chuốt văn bản: ${msg}` });
    } finally {
      setIsPolishing(false);
    }
  };

  // Gửi tin nhắn Copilot Chat
  const handleSendChat = async (presetPrompt?: string) => {
    const textToSend = presetPrompt || chatInput;
    if (!textToSend.trim() || isChatting) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: textToSend,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetPrompt) setChatInput("");
    setIsChatting(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          documentTitle: "Tài liệu Microsoft Word",
        }),
      });

      if (!res.ok) {
        throw new Error("Lỗi phản hồi từ AI Copilot");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantReply = "";
      const botMsgId = `b-${Date.now()}`;

      setChatMessages((prev) => [
        ...prev,
        { id: botMsgId, role: "assistant", content: "" },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.content) {
                  assistantReply += parsed.content;
                  setChatMessages((prev) =>
                    prev.map((m) => (m.id === botMsgId ? { ...m, content: assistantReply } : m))
                  );
                }
              } catch {
                assistantReply += dataStr;
                setChatMessages((prev) =>
                  prev.map((m) => (m.id === botMsgId ? { ...m, content: assistantReply } : m))
                );
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi";
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Có lỗi xảy ra: ${msg}. Hãy đảm bảo đã đăng nhập hoặc kiểm tra kết nối.`,
        },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  // Chèn nội dung đã sinh vào Word
  const handleInsertGenerated = async (html: string) => {
    setIsLoading(true);
    try {
      const res = await insertDocumentContent(html);
      setStatusMessage({ type: "success", text: res.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Chèn snippet tại con trỏ
  const handleInsertSnippet = async (text: string) => {
    try {
      const res = await insertSnippetAtCursor(text);
      setStatusMessage({ type: "success", text: res.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi";
      setStatusMessage({ type: "error", text: msg });
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const formProperties = selectedTemplate?.formSchema?.properties || {};

  return (
    <>
      <Script
        src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
        strategy="afterInteractive"
      />

      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 space-y-3 max-w-sm mx-auto font-sans">
        {/* HEADER: BRAND & STATUS */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-tight flex items-center gap-1">
                DocDraft AI
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Full
                </span>
              </h1>
              <p className="text-[10px] text-slate-500">Trợ lý Văn bản trong Word</p>
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
            {isOfficeReady ? "Word Ready" : "Xem trước"}
          </div>
        </div>

        {/* NOTIFICATION BANNER */}
        {statusMessage && (
          <div
            className={`p-2 rounded-lg text-[11px] flex items-start gap-1.5 border transition-all ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                : statusMessage.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300"
                : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
            ) : statusMessage.type === "error" ? (
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
            ) : (
              <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600" />
            )}
            <span className="leading-tight flex-1">{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* 4-TAB NAVIGATION BAR */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-lg text-[11px] font-semibold">
          <button
            onClick={() => setActiveTab("format")}
            className={`py-1.5 rounded-md flex flex-col items-center gap-0.5 transition-all ${
              activeTab === "format"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Thể thức</span>
          </button>
          <button
            onClick={() => setActiveTab("template")}
            className={`py-1.5 rounded-md flex flex-col items-center gap-0.5 transition-all ${
              activeTab === "template"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Mẫu AI</span>
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`py-1.5 rounded-md flex flex-col items-center gap-0.5 transition-all ${
              activeTab === "raw"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Chuốt thô</span>
          </button>
          <button
            onClick={() => setActiveTab("copilot")}
            className={`py-1.5 rounded-md flex flex-col items-center gap-0.5 transition-all ${
              activeTab === "copilot"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Copilot</span>
          </button>
        </div>

        {/* TAB 1: CHUẨN HÓA THỂ THỨC NĐ 30 */}
        {activeTab === "format" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                Chuẩn hóa thể thức NĐ 30
              </span>

              <Button
                onClick={handleFormatND30}
                disabled={isLoading}
                className="w-full h-9 text-xs font-bold gap-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-xs"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                1-Click: Căn lề 30/15 & Times 13pt
              </Button>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInsertHeader}
                  disabled={isLoading}
                  className="text-[10px] h-8 px-1.5 gap-1 border-slate-200 dark:border-slate-800"
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
                  className="text-[10px] h-8 px-1.5 gap-1 border-slate-200 dark:border-slate-800"
                  title="Chèn bảng Nơi nhận & Ký tên chuẩn vào cuối trang"
                >
                  <Columns2 className="w-3 h-3 text-indigo-600" />
                  + Nơi nhận & Chữ ký
                </Button>
              </div>
            </div>

            {/* AI Bôi đen */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                AI Copilot trên văn bản bôi đen
              </span>
              <p className="text-[11px] text-slate-500">
                Bôi đen một đoạn văn trong Word và chọn lệnh:
              </p>

              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunAiCopilot("formalize")}
                  disabled={aiLoading}
                  className="text-[11px] h-7.5 gap-1 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300"
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
                  className="text-[11px] h-7.5 gap-1"
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
                  className="text-[11px] h-7.5 gap-1"
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
                  className="text-[11px] h-7.5 gap-1"
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
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[10px] space-y-1">
                  <span className="font-semibold text-slate-500">Đã chèn thay thế vào Word:</span>
                  <p className="line-clamp-3 text-slate-700 dark:text-slate-300 italic">
                    &ldquo;{previewText}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MẪU VĂN BẢN AI (TEMPLATE GENERATOR) */}
        {activeTab === "template" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600" />
                Chọn mẫu văn bản chuẩn
              </span>

              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>

              {/* Dynamic form fields */}
              <div className="space-y-2 pt-1">
                {Object.keys(formProperties).length > 0 ? (
                  Object.entries(formProperties).map(([key, prop]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        {prop.title || key}
                      </label>
                      <input
                        type="text"
                        placeholder={prop.placeholder || ""}
                        value={formValues[key] || ""}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [key]: e.target.value })
                        }
                        className="w-full text-xs p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 italic">
                    Mẫu này tự động sinh dựa trên dữ liệu chuẩn NĐ 30.
                  </p>
                )}
              </div>

              <Button
                onClick={handleGenerateTemplate}
                disabled={isGeneratingTemplate}
                className="w-full h-8.5 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isGeneratingTemplate ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isGeneratingTemplate ? "Đang sinh văn bản..." : "AI Sinh Văn bản Theo Mẫu"}
              </Button>
            </div>

            {/* Preview & Insert Button */}
            {generatedDocHtml && (
              <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
                    Bản nháp AI vừa sinh:
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleInsertGenerated(generatedDocHtml)}
                    disabled={isLoading}
                    className="h-7 text-[10px] px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <ArrowDownToLine className="w-3 h-3" />
                    Chèn vào Word
                  </Button>
                </div>

                <div
                  className="max-h-40 overflow-y-auto p-2 rounded bg-white dark:bg-slate-900 text-[10px] border border-indigo-100 dark:border-indigo-900 text-slate-700 dark:text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: generatedDocHtml }}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CHUỐT VĂN BẢN THÔ (RAW POLISH) */}
        {activeTab === "raw" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Chuốt nháp thô sang thể thức NĐ 30
              </span>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  Loại văn bản đích:
                </label>
                <select
                  value={targetDocType}
                  onChange={(e) => setTargetDocType(e.target.value)}
                  className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-hidden"
                >
                  <option value="Công văn">Công văn</option>
                  <option value="Tờ trình">Tờ trình</option>
                  <option value="Quyết định">Quyết định</option>
                  <option value="Thông báo">Thông báo</option>
                  <option value="Biên bản">Biên bản</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  Dán nội dung nháp thô / ghi chú cuộc họp:
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="VD: Họp phòng sáng nay thống nhất mua 10 laptop Dell cho kỹ sư, ngân sách 200tr trích từ quỹ phát triển..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 outline-hidden resize-none"
                />
              </div>

              <Button
                onClick={handlePolishRaw}
                disabled={isPolishing || !rawText.trim()}
                className="w-full h-8.5 text-xs font-bold gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                {isPolishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                {isPolishing ? "Đang chuốt văn bản..." : "AI Tái cấu trúc chuẩn NĐ 30"}
              </Button>
            </div>

            {/* Polished Result */}
            {polishedHtml && (
              <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300">
                    Văn bản sau chuốt:
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleInsertGenerated(polishedHtml)}
                    disabled={isLoading}
                    className="h-7 text-[10px] px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <ArrowDownToLine className="w-3 h-3" />
                    Chèn vào Word
                  </Button>
                </div>

                <div
                  className="max-h-40 overflow-y-auto p-2 rounded bg-white dark:bg-slate-900 text-[10px] border border-purple-100 dark:border-purple-900 text-slate-700 dark:text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: polishedHtml }}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TRỢ LÝ COPILOT CHAT */}
        {activeTab === "copilot" && (
          <div className="flex flex-col h-[400px] border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            {/* Quick prompt chips */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-1 overflow-x-auto text-[10px]">
              <button
                onClick={() => handleSendChat("Quy định cỡ chữ và khoảng cách lề theo NĐ 30 là gì?")}
                className="shrink-0 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-400"
              >
                📜 Thể thức NĐ 30
              </button>
              <button
                onClick={() => handleSendChat("Gợi ý căn cứ pháp lý cho tờ trình mua sắm thiết bị")}
                className="shrink-0 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-400"
              >
                ⚖️ Căn cứ tờ trình
              </button>
            </div>

            {/* Message stream */}
            <div className="flex-1 p-2.5 overflow-y-auto space-y-2.5 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] p-2 rounded-xl leading-relaxed text-[11px] ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-slate-700/50"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {msg.role === "assistant" && msg.id !== "welcome" && msg.content && (
                    <button
                      onClick={() => handleInsertSnippet(msg.content)}
                      className="mt-1 text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      <ArrowDownToLine className="w-2.5 h-2.5" /> Chèn câu trả lời vào Word
                    </button>
                  )}
                </div>
              ))}
              {isChatting && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400 italic">
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                  DocDraft AI đang soạn câu trả lời...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Hỏi về thể thức, pháp lý..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                disabled={isChatting}
                className="flex-1 text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden"
              />
              <Button
                size="sm"
                onClick={() => handleSendChat()}
                disabled={isChatting || !chatInput.trim()}
                className="h-7.5 w-7.5 p-0 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* HƯỚNG DẪN CÀI ĐẶT ADD-IN (SIDELOADING GUIDE) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full p-2.5 flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-1.5 text-[11px]">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              Hướng dẫn nạp Add-in vào Word
            </span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showGuide && (
            <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 leading-relaxed">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Word Online (Trình duyệt):
              </p>
              <p>
                1. Tab <strong>Chèn (Insert)</strong> → <strong>Tiện ích (Add-ins)</strong>.<br />
                2. Chọn <strong>Tải lên tiện ích của tôi</strong>.<br />
                3. Tải tệp:{" "}
                <a
                  href="/word-addin/manifest.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 font-semibold underline inline-flex items-center gap-0.5"
                >
                  manifest.xml <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="text-center text-[9px] text-slate-400 pt-1">
          DocDraft AI Enterprise • Chuẩn hóa văn bản hành chính Việt Nam
        </div>
      </div>
    </>
  );
}
