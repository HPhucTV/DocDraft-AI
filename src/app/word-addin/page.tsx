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
  Download,
  KeyRound,
  SlidersHorizontal,
  Check,
  RotateCcw,
  Bookmark,
  PauseCircle,
  PlayCircle,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DocDraftFormatConfig,
  FormatPresetId,
  FORMAT_PRESETS,
  getStoredFormatConfig,
  saveStoredFormatConfig,
  getStoredCustomProfiles,
  saveCustomProfile,
  deleteCustomProfile,
  SupportedFontFamily,
} from "@/lib/office/format-config";
import {
  formatDocumentWithConfig,
  formatDocumentND30,
  applyDocumentMargins,
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

/**
 * Làm sạch mã HTML đầu ra của AI trước khi render vào DOM để triệt tiêu nguy cơ XSS
 */
function sanitizeHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*['"]?javascript:[^'"]*['"]?/gi, "");
}

/**
 * Làm sạch mã HTML trước khi truyền vào Word Office.js API
 * Xóa markdown code fence nếu LLM trả về dạng ```html ... ```
 */
function cleanHtmlForWord(raw: string): string {
  if (!raw) return "";
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:html)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  return cleaned.trim();
}

export default function WordAddinTaskpanePage() {
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"template" | "raw" | "copilot">("template");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Tab: Format & Inline AI
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>("formalize");
  const [previewText, setPreviewText] = useState<string>("");
  const [userByokKey, setUserByokKey] = useState<string>("");

  // Cấu hình Thể thức & Bảng Cài đặt (Settings Drawer)
  const [formatConfig, setFormatConfig] = useState<DocDraftFormatConfig>(FORMAT_PRESETS.nd30);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [settingsActiveSection, setSettingsActiveSection] = useState<"format" | "byok">("format");
  const [streamWordCount, setStreamWordCount] = useState<number>(0);
  const [customProfiles, setCustomProfiles] = useState<DocDraftFormatConfig[]>([]);
  const [newProfileName, setNewProfileName] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("docdraft_user_byok") || "";
      setUserByokKey(saved);
      setFormatConfig(getStoredFormatConfig());
      setCustomProfiles(getStoredCustomProfiles());
    }
  }, []);

  const handleSelectPreset = (presetId: FormatPresetId) => {
    const next = { ...FORMAT_PRESETS[presetId] };
    setFormatConfig(next);
    saveStoredFormatConfig(next);
    setStatusMessage({
      type: "success",
      text: `Đã kích hoạt thể thức: ${next.name}`,
    });
  };

  const handleSelectCustomProfile = (profile: DocDraftFormatConfig) => {
    setFormatConfig(profile);
    saveStoredFormatConfig(profile);
    setStatusMessage({
      type: "success",
      text: `Đã áp dụng hồ sơ thể thức: ${profile.name}`,
    });
  };

  const handleSaveNewProfile = () => {
    if (!newProfileName.trim()) return;
    const profile: DocDraftFormatConfig = {
      ...formatConfig,
      preset: "custom",
      name: newProfileName.trim(),
    };
    const updated = saveCustomProfile(profile);
    setCustomProfiles(updated);
    setFormatConfig(profile);
    saveStoredFormatConfig(profile);
    setNewProfileName("");
    setStatusMessage({
      type: "success",
      text: `Đã lưu hồ sơ thể thức "${profile.name}" thành công!`,
    });
  };

  const handleDeleteCustomProfile = (name: string) => {
    const updated = deleteCustomProfile(name);
    setCustomProfiles(updated);
    setStatusMessage({
      type: "info",
      text: `Đã xóa hồ sơ "${name}".`,
    });
  };

  const handleUpdateFormatConfig = (updates: Partial<DocDraftFormatConfig>) => {
    const next: DocDraftFormatConfig = {
      ...formatConfig,
      ...updates,
      preset: (updates.preset || "custom") as FormatPresetId,
      name: updates.name || "Tùy chỉnh riêng",
    };
    setFormatConfig(next);
    saveStoredFormatConfig(next);
  };

  const handleApplyFormatToDocument = async () => {
    setIsLoading(true);
    try {
      const res = await formatDocumentWithConfig(formatConfig);
      setStatusMessage({ type: "success", text: res.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyMarginsOnly = async () => {
    setIsLoading(true);
    try {
      await applyDocumentMargins(formatConfig.margins);
      setStatusMessage({
        type: "success",
        text: `Đã căn lề tài liệu: Trái ${formatConfig.margins.left}mm, Phải ${formatConfig.margins.right}mm, Trên ${formatConfig.margins.top}mm, Dưới ${formatConfig.margins.bottom}mm.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveByokKey = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("docdraft_user_byok", userByokKey.trim());
      setStatusMessage({
        type: "success",
        text: userByokKey.trim()
          ? "Đã lưu khóa API BYOK cá nhân vào Word Add-in thành công!"
          : "Đã chuyển về sử dụng khóa AI mặc định của hệ thống!",
      });
    }
  };

  const handleClearByokKey = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("docdraft_user_byok");
      setUserByokKey("");
      setStatusMessage({
        type: "info",
        text: "Đã xóa khóa cá nhân. Trở về dùng khóa mặc định của hệ thống.",
      });
    }
  };

  const getAddinHeaders = () => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("docdraft_user_byok") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Client-Source": "word-addin",
    };
    if (saved && saved.trim().length > 0) {
      headers["X-API-Key"] = saved.trim();
    }
    return headers;
  };

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

  // 1-Click Chuẩn hóa thể thức theo cấu hình hiện hành (NĐ 30, Doanh nghiệp, Trường học...)
  const handleFormatND30 = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const result = await formatDocumentWithConfig(formatConfig);
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
        headers: getAddinHeaders(),
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
    setStreamWordCount(0);
    setStatusMessage({ type: "info", text: "DocDraft AI đang kết nối và chuẩn bị sinh văn bản..." });

    try {
      const res = await fetch("/api/ai/generate/stream", {
        method: "POST",
        headers: getAddinHeaders(),
        body: JSON.stringify({
          templateId: selectedTemplateId,
          variables: formValues,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể gọi API sinh văn bản");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";
      let buffer = "";
      let currentEvent = "message";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;

            if (trimmed.startsWith("event:")) {
              currentEvent = trimmed.replace(/^event:\s*/, "").trim();
              if (currentEvent === "thinking") {
                setStatusMessage({
                  type: "info",
                  text: "AI đang suy nghĩ và lập dàn ý thể thức...",
                });
              } else if (currentEvent === "content") {
                setStatusMessage({
                  type: "info",
                  text: "AI đang soạn thảo trực tiếp...",
                });
              }
              continue;
            }

            if (trimmed.startsWith("data:")) {
              const dataStr = trimmed.replace(/^data:\s*/, "").trim();
              if (dataStr === "[DONE]") break;

              // Không chèn tokens reasoning nội bộ vào văn bản
              if (currentEvent === "thinking") {
                continue;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const textChunk =
                  parsed.text ?? parsed.chunk ?? parsed.content ?? "";
                if (textChunk) {
                  accumulated += textChunk;
                  setGeneratedDocHtml(accumulated);
                  const count = accumulated.trim().split(/\s+/).filter(Boolean).length;
                  setStreamWordCount(count);
                }
              } catch {
                if (currentEvent !== "ping" && currentEvent !== "error" && currentEvent !== "done") {
                  accumulated += dataStr;
                  setGeneratedDocHtml(accumulated);
                  const count = accumulated.trim().split(/\s+/).filter(Boolean).length;
                  setStreamWordCount(count);
                }
              }
            }
          }
        }
      }

      // Xử lý dữ liệu còn tồn đọng trong buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith("data:")) {
          const dataStr = trimmed.replace(/^data:\s*/, "").trim();
          if (dataStr && dataStr !== "[DONE]") {
            try {
              const parsed = JSON.parse(dataStr);
              const textChunk =
                parsed.text ?? parsed.chunk ?? parsed.content ?? "";
              if (textChunk) {
                accumulated += textChunk;
              }
            } catch {
              accumulated += dataStr;
            }
          }
        }
      }

      if (accumulated.trim()) {
        setGeneratedDocHtml(accumulated);
        const totalWords = accumulated.trim().split(/\s+/).filter(Boolean).length;
        setStreamWordCount(totalWords);

        if (formatConfig.autoInsertToWord) {
          setStatusMessage({
            type: "info",
            text: `AI đã sinh xong (${totalWords} từ). Đang tự động chèn vào Word...`,
          });
          const insertRes = await insertDocumentContent(accumulated, formatConfig);
          if (insertRes.success) {
            setStatusMessage({
              type: "success",
              text: `Đã tự động chèn văn bản (${totalWords} từ) vào Word chuẩn thể thức "${formatConfig.name}"!`,
            });
          } else {
            setStatusMessage({
              type: "error",
              text: `Lỗi khi tự động chèn: ${insertRes.message}`,
            });
          }
        } else {
          setStatusMessage({
            type: "success",
            text: `AI đã sinh xong văn bản (${totalWords} từ)! Bấm "Chèn vào Word" để ghi vào tài liệu.`,
          });
        }
      } else {
        throw new Error("Không nhận được nội dung từ AI. Vui lòng thử lại.");
      }
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
    setStreamWordCount(0);
    setStatusMessage({ type: "info", text: "AI đang phân tích và tái cấu trúc nháp thô..." });

    try {
      const res = await fetch("/api/ai/raw-to-doc/stream", {
        method: "POST",
        headers: getAddinHeaders(),
        body: JSON.stringify({
          rawText,
          targetDocType,
        }),
      });

      if (!res.ok) {
        throw new Error("Lỗi kết nối API Raw-to-Doc");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";
      let buffer = "";
      let currentEvent = "message";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;

            if (trimmed.startsWith("event:")) {
              currentEvent = trimmed.replace(/^event:\s*/, "").trim();
              continue;
            }

            if (trimmed.startsWith("data:")) {
              const dataStr = trimmed.replace(/^data:\s*/, "").trim();
              if (dataStr === "[DONE]") break;

              if (currentEvent === "thinking") {
                continue;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const textChunk =
                  parsed.chunk ?? parsed.text ?? parsed.content ?? "";
                if (textChunk) {
                  accumulated += textChunk;
                  setPolishedHtml(accumulated);
                  const count = accumulated.trim().split(/\s+/).filter(Boolean).length;
                  setStreamWordCount(count);
                }
              } catch {
                if (currentEvent !== "ping" && currentEvent !== "error" && currentEvent !== "done") {
                  accumulated += dataStr;
                  setPolishedHtml(accumulated);
                  const count = accumulated.trim().split(/\s+/).filter(Boolean).length;
                  setStreamWordCount(count);
                }
              }
            }
          }
        }
      }

      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith("data:")) {
          const dataStr = trimmed.replace(/^data:\s*/, "").trim();
          if (dataStr && dataStr !== "[DONE]") {
            try {
              const parsed = JSON.parse(dataStr);
              const textChunk =
                parsed.chunk ?? parsed.text ?? parsed.content ?? "";
              if (textChunk) accumulated += textChunk;
            } catch {
              accumulated += dataStr;
            }
          }
        }
      }

      if (accumulated.trim()) {
        setPolishedHtml(accumulated);
        const totalWords = accumulated.trim().split(/\s+/).filter(Boolean).length;
        setStreamWordCount(totalWords);

        if (formatConfig.autoInsertToWord) {
          setStatusMessage({
            type: "info",
            text: `Đã chuốt xong (${totalWords} từ). Đang tự động chèn vào Word...`,
          });
          const insertRes = await insertDocumentContent(accumulated, formatConfig);
          if (insertRes.success) {
            setStatusMessage({
              type: "success",
              text: `Đã tự động chèn văn bản chuốt (${totalWords} từ) vào Word chuẩn thể thức "${formatConfig.name}"!`,
            });
          } else {
            setStatusMessage({
              type: "error",
              text: `Lỗi khi tự động chèn: ${insertRes.message}`,
            });
          }
        } else {
          setStatusMessage({
            type: "success",
            text: `Đã chuốt xong văn bản (${totalWords} từ)! Bấm "Chèn vào Word" để ghi vào tài liệu.`,
          });
        }
      } else {
        throw new Error("Không nhận được kết quả chuốt từ AI. Vui lòng thử lại.");
      }
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
        headers: getAddinHeaders(),
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
      const decoder = new TextDecoder("utf-8");
      let assistantReply = "";
      let buffer = "";
      let currentEvent = "message";
      const botMsgId = `b-${Date.now()}`;

      setChatMessages((prev) => [
        ...prev,
        { id: botMsgId, role: "assistant", content: "" },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;

            if (trimmed.startsWith("event:")) {
              currentEvent = trimmed.replace(/^event:\s*/, "").trim();
              continue;
            }

            if (trimmed.startsWith("data:")) {
              const dataStr = trimmed.replace(/^data:\s*/, "").trim();
              if (dataStr === "[DONE]") break;

              try {
                const parsed = JSON.parse(dataStr);
                const textChunk =
                  parsed.chunk ?? parsed.content ?? parsed.text ?? "";
                if (textChunk) {
                  assistantReply += textChunk;
                  setChatMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsgId ? { ...m, content: assistantReply } : m
                    )
                  );
                }
              } catch {
                if (currentEvent !== "ping" && currentEvent !== "error" && currentEvent !== "done") {
                  assistantReply += dataStr;
                  setChatMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsgId ? { ...m, content: assistantReply } : m
                    )
                  );
                }
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
      const cleaned = cleanHtmlForWord(html);
      const res = await insertDocumentContent(cleaned, formatConfig);
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
      const res = await insertSnippetAtCursor(text, formatConfig);
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

          <div className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                isOfficeReady
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
              }`}
              title={isOfficeReady ? "Đã kết nối với Microsoft Word" : "Đang mở ở chế độ xem trước"}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOfficeReady ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              {isOfficeReady ? "Word Ready" : "Xem trước"}
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className={`p-1.5 rounded-lg border transition-all ${
                showSettingsDrawer
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs"
              }`}
              title="Cài đặt Thể thức & Khóa AI (BYOK)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
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

        {/* MICRO STATUS BAR (PRESET CHIP & AUTO-INSERT TOGGLE) */}
        <div className="flex items-center justify-between gap-1 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 text-[10px]">
          <button
            type="button"
            onClick={() => {
              setShowSettingsDrawer(true);
              setSettingsActiveSection("format");
            }}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
            title="Bấm để mở cài đặt đổi thể thức"
          >
            <span className="text-slate-400 font-normal">Thể thức:</span>
            <span>
              {formatConfig.preset === "nd30" && "🏛️ NĐ 30"}
              {formatConfig.preset === "corporate" && "🏢 Doanh nghiệp"}
              {formatConfig.preset === "school" && "🏫 Trường học"}
              {formatConfig.preset === "custom" && `⚙️ ${formatConfig.name}`}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleUpdateFormatConfig({ autoInsertToWord: !formatConfig.autoInsertToWord })
            }
            className={`px-2 py-0.5 rounded-full font-bold transition-all border shrink-0 flex items-center gap-1 ${
              formatConfig.autoInsertToWord
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-white text-slate-600 border-slate-300 dark:bg-slate-900 dark:text-slate-400"
            }`}
            title="Bật/Tắt tự động ghi vào Word khi AI hoàn tất"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                formatConfig.autoInsertToWord ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span>{formatConfig.autoInsertToWord ? "Auto: BẬT" : "Auto: TẮT"}</span>
          </button>
        </div>

        {/* SETTINGS DRAWER (SLIDE-DOWN DRAWER FOR FORMAT & BYOK) */}
        {showSettingsDrawer && (
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/70 bg-white dark:bg-slate-900 shadow-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  Cài đặt Thể thức & Khóa AI
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1.5 py-0.5 rounded hover:bg-slate-200/50"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 p-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/50 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setSettingsActiveSection("format")}
                className={`py-1 rounded-md transition-all ${
                  settingsActiveSection === "format"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                🏛️ Thể thức & Lề trang
              </button>
              <button
                type="button"
                onClick={() => setSettingsActiveSection("byok")}
                className={`py-1 rounded-md transition-all flex items-center justify-center gap-1 ${
                  settingsActiveSection === "byok"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <KeyRound className="w-3 h-3 text-amber-500" />
                <span>Khóa AI (BYOK)</span>
              </button>
            </div>

            {settingsActiveSection === "format" && (
              <div className="p-3 space-y-3 text-[11px] max-h-[420px] overflow-y-auto">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Chọn bộ mẫu chuẩn (Preset):
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectPreset("nd30")}
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold text-left border flex items-center justify-between ${
                        formatConfig.preset === "nd30"
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <span>🏛️ Nghị định 30</span>
                      {formatConfig.preset === "nd30" && <Check className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset("corporate")}
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold text-left border flex items-center justify-between ${
                        formatConfig.preset === "corporate"
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <span>🏢 Doanh nghiệp (SME)</span>
                      {formatConfig.preset === "corporate" && <Check className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset("school")}
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold text-left border flex items-center justify-between ${
                        formatConfig.preset === "school"
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <span>🏫 Trường học / Nội bộ</span>
                      {formatConfig.preset === "school" && <Check className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset("custom")}
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold text-left border flex items-center justify-between ${
                        formatConfig.preset === "custom"
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <span>⚙️ Tùy chỉnh riêng</span>
                      {formatConfig.preset === "custom" && <Check className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyFormatToDocument}
                  disabled={isLoading}
                  className="w-full h-8 text-[11px] font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                >
                  <FileCheck className="w-3.5 h-3.5 mr-1" />
                  Áp dụng thể thức vào tệp Word này
                </Button>

                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInsertHeader}
                    disabled={isLoading}
                    className="text-[10px] h-7 px-1.5 gap-1 border-slate-200 dark:border-slate-800"
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
                    className="text-[10px] h-7 px-1.5 gap-1 border-slate-200 dark:border-slate-800"
                    title="Chèn bảng Nơi nhận & Ký tên chuẩn vào cuối trang"
                  >
                    <Columns2 className="w-3 h-3 text-indigo-600" />
                    + Nơi nhận & Chữ ký
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Font chữ:</label>
                    <select
                      value={formatConfig.fontFamily}
                      onChange={(e) =>
                        handleUpdateFormatConfig({ fontFamily: e.target.value as SupportedFontFamily })
                      }
                      className="w-full text-[11px] p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none"
                    >
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Arial">Arial</option>
                      <option value="Calibri">Calibri</option>
                      <option value="Segoe UI">Segoe UI</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Cỡ chữ (pt):</label>
                    <select
                      value={formatConfig.fontSize}
                      onChange={(e) => handleUpdateFormatConfig({ fontSize: Number(e.target.value) })}
                      className="w-full text-[11px] p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none"
                    >
                      <option value={12}>12 pt</option>
                      <option value={13}>13 pt (Chuẩn NĐ 30)</option>
                      <option value={14}>14 pt</option>
                      <option value={11}>11 pt</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Khoảng cách dòng:</label>
                    <select
                      value={formatConfig.lineSpacing}
                      onChange={(e) => handleUpdateFormatConfig({ lineSpacing: Number(e.target.value) })}
                      className="w-full text-[11px] p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none"
                    >
                      <option value={1.0}>1.0 (Single)</option>
                      <option value={1.15}>1.15</option>
                      <option value={1.3}>1.3</option>
                      <option value={1.35}>1.35 (Chuẩn NĐ 30)</option>
                      <option value={1.5}>1.5</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Cách đoạn dưới:</label>
                    <select
                      value={formatConfig.spaceAfter}
                      onChange={(e) => handleUpdateFormatConfig({ spaceAfter: Number(e.target.value) })}
                      className="w-full text-[11px] p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none"
                    >
                      <option value={0}>0 pt (Sát dòng)</option>
                      <option value={2}>2 pt</option>
                      <option value={3}>3 pt</option>
                      <option value={4}>4 pt</option>
                      <option value={6}>6 pt</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-center">
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Căn lề đoạn:</label>
                    <select
                      value={formatConfig.alignment}
                      onChange={(e) =>
                        handleUpdateFormatConfig({ alignment: e.target.value as "Justified" | "Left" })
                      }
                      className="w-full text-[11px] p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none"
                    >
                      <option value="Justified">Justified (Đều 2 bên)</option>
                      <option value="Left">Left (Căn trái)</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] pt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formatConfig.indentFirstLine}
                      onChange={(e) => handleUpdateFormatConfig({ indentFirstLine: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Thụt đầu dòng (1.27cm)</span>
                  </label>
                </div>

                <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:border-slate-800">
                      Căn lề trang Word (mm):
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyMarginsOnly}
                      disabled={isLoading}
                      className="h-6 text-[9px] px-2"
                      title="Áp dụng lề trang vào văn bản Word"
                    >
                      Đặt lề trang Word
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <div>
                      <span className="text-[9px] text-slate-400 block">Trên</span>
                      <input
                        type="number"
                        value={formatConfig.margins.top}
                        onChange={(e) =>
                          handleUpdateFormatConfig({
                            margins: { ...formatConfig.margins, top: Number(e.target.value) },
                          })
                        }
                        className="w-full text-[11px] p-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Dưới</span>
                      <input
                        type="number"
                        value={formatConfig.margins.bottom}
                        onChange={(e) =>
                          handleUpdateFormatConfig({
                            margins: { ...formatConfig.margins, bottom: Number(e.target.value) },
                          })
                        }
                        className="w-full text-[11px] p-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Trái</span>
                      <input
                        type="number"
                        value={formatConfig.margins.left}
                        onChange={(e) =>
                          handleUpdateFormatConfig({
                            margins: { ...formatConfig.margins, left: Number(e.target.value) },
                          })
                        }
                        className="w-full text-[11px] p-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Phải</span>
                      <input
                        type="number"
                        value={formatConfig.margins.right}
                        onChange={(e) =>
                          handleUpdateFormatConfig({
                            margins: { ...formatConfig.margins, right: Number(e.target.value) },
                          })
                        }
                        className="w-full text-[11px] p-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {settingsActiveSection === "byok" && (
              <div className="p-3 space-y-2.5 text-[11px] bg-white dark:bg-slate-900">
                <p className="text-[10px] text-slate-500">
                  Nhập khóa DeepSeek (sk-...) hoặc Gemini (AIza...) của bạn để sử dụng trực tiếp không giới hạn lượt gọi:
                </p>
                <div className="space-y-1.5">
                  <input
                    type="password"
                    placeholder="Dán API Key (sk-... hoặc AIza...)"
                    value={userByokKey}
                    onChange={(e) => setUserByokKey(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[9px] text-slate-400">
                      {userByokKey ? "Đang dùng Key cá nhân" : "Đang dùng Key hệ thống mặc định"}
                    </span>
                    <div className="flex gap-1.5">
                      {userByokKey && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleClearByokKey}
                          className="h-7 text-[10px] px-2 text-rose-600 hover:text-rose-700"
                        >
                          Xóa
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveByokKey}
                        className="h-7 text-[10px] px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Lưu khóa
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
                  <a
                    href="/word-addin/manifest.xml"
                    download="manifest.xml"
                    className="text-[9px] text-indigo-500 hover:underline inline-flex items-center gap-1"
                  >
                    <Download className="w-2.5 h-2.5" />
                    <span>Tải tệp manifest.xml cài đặt Add-in</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3-TAB NAVIGATION BAR */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-lg text-[11px] font-semibold">
          <button
            onClick={() => {
              setActiveTab("template");
              setShowSettingsDrawer(false);
            }}
            className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "template" && !showSettingsDrawer
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Mẫu AI</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("raw");
              setShowSettingsDrawer(false);
            }}
            className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "raw" && !showSettingsDrawer
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Chuốt thô</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("copilot");
              setShowSettingsDrawer(false);
            }}
            className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "copilot" && !showSettingsDrawer
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Copilot</span>
          </button>
        </div>

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
                    Mẫu này tự động sinh dựa trên dữ liệu mẫu đã chọn.
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

            {/* LIVE PROGRESS CARD (WHEN GENERATING) */}
            {isGeneratingTemplate && (
              <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/70 to-white dark:from-indigo-950/40 dark:to-slate-900 space-y-2.5 shadow-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-indigo-600 text-white">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 block">
                        AI đang soạn thảo trực tiếp...
                      </span>
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium">
                        Đã sinh: <span className="font-bold font-mono">{streamWordCount}</span> từ
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateFormatConfig({
                        autoInsertToWord: !formatConfig.autoInsertToWord,
                      })
                    }
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold border transition-colors flex items-center gap-1 ${
                      formatConfig.autoInsertToWord
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                    title="Tạm dừng hoặc bật tự động ghi vào Word"
                  >
                    {formatConfig.autoInsertToWord ? "⚡ Auto-insert: BẬT" : "⏸️ Auto-insert: TẮT"}
                  </button>
                </div>

                {/* Progress animated bar */}
                <div className="w-full bg-indigo-100 dark:bg-indigo-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse" style={{ width: "100%" }} />
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight italic">
                  {formatConfig.autoInsertToWord
                    ? `⚡ Văn bản sẽ tự động ghi thẳng vào Word theo chuẩn "${formatConfig.name}" ngay khi hoàn tất.`
                    : `⏸️ Đã tạm dừng tự động ghi. Bạn có thể bấm "Chèn vào Word" khi hoàn tất.`}
                </p>
              </div>
            )}

            {/* COMPLETION CARD (WHEN FINISHED) */}
            {!isGeneratingTemplate && generatedDocHtml && (
              <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 block">
                        Đã sinh xong văn bản ({streamWordCount} từ)
                      </span>
                      <span className="text-[9px] text-emerald-700 dark:text-emerald-400">
                        {formatConfig.autoInsertToWord
                          ? `✅ Đã tự động chèn vào Word chuẩn ${formatConfig.name}`
                          : "Sẵn sàng ghi vào tài liệu"}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleInsertGenerated(generatedDocHtml)}
                    disabled={isLoading}
                    className="h-7 text-[10px] px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    {formatConfig.autoInsertToWord ? "Chèn lại vào Word" : "Chèn vào Word"}
                  </Button>
                </div>
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
                Chuốt nháp thô sang thể thức văn bản
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
                {isPolishing ? "Đang chuốt văn bản..." : "AI Tái cấu trúc theo thể thức"}
              </Button>
            </div>

            {/* LIVE PROGRESS CARD (WHEN POLISHING) */}
            {isPolishing && (
              <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/70 to-white dark:from-purple-950/40 dark:to-slate-900 space-y-2.5 shadow-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-purple-600 text-white">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200 block">
                        AI đang tái cấu trúc nháp thô...
                      </span>
                      <span className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">
                        Đã chuốt: <span className="font-bold font-mono">{streamWordCount}</span> từ
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateFormatConfig({
                        autoInsertToWord: !formatConfig.autoInsertToWord,
                      })
                    }
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold border transition-colors flex items-center gap-1 ${
                      formatConfig.autoInsertToWord
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                    title="Tạm dừng hoặc bật tự động ghi vào Word"
                  >
                    {formatConfig.autoInsertToWord ? "⚡ Auto-insert: BẬT" : "⏸️ Auto-insert: TẮT"}
                  </button>
                </div>

                <div className="w-full bg-purple-100 dark:bg-purple-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-purple-600 h-1.5 rounded-full animate-pulse" style={{ width: "100%" }} />
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight italic">
                  {formatConfig.autoInsertToWord
                    ? `⚡ Văn bản chuốt sẽ tự động ghi vào Word theo chuẩn "${formatConfig.name}" ngay khi hoàn tất.`
                    : `⏸️ Đang tạm dừng tự động ghi. Bạn có thể bấm "Chèn vào Word" khi hoàn tất.`}
                </p>
              </div>
            )}

            {/* COMPLETION CARD (WHEN POLISHED) */}
            {!isPolishing && polishedHtml && (
              <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <div>
                      <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200 block">
                        Đã chuốt xong ({streamWordCount} từ)
                      </span>
                      <span className="text-[9px] text-purple-700 dark:text-purple-400">
                        {formatConfig.autoInsertToWord
                          ? `✅ Đã tự động chèn vào Word chuẩn ${formatConfig.name}`
                          : "Sẵn sàng ghi vào tài liệu"}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleInsertGenerated(polishedHtml)}
                    disabled={isLoading}
                    className="h-7 text-[10px] px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    {formatConfig.autoInsertToWord ? "Chèn lại vào Word" : "Chèn vào Word"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TRỢ LÝ COPILOT (LỆNH TRÊN ĐOẠN BÔI ĐEN & HỎI ĐÁP AI) */}
        {activeTab === "copilot" && (
          <div className="space-y-2.5">
            {/* AI Bôi đen trực tiếp trong Word */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Lệnh AI trên đoạn bôi đen trong Word
              </span>

              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunAiCopilot("formalize")}
                  disabled={aiLoading}
                  className="text-[10px] h-7 gap-1 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300 font-semibold"
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
                  className="text-[10px] h-7 gap-1 font-semibold"
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
                  className="text-[10px] h-7 gap-1 font-semibold"
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
                  className="text-[10px] h-7 gap-1 font-semibold"
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
                  <p className="line-clamp-2 text-slate-700 dark:text-slate-300 italic">
                    &ldquo;{previewText}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Khung Chat Copilot */}
            <div className="flex flex-col h-[340px] border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
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
        </div>
      )}



        {/* FOOTER */}
        <div className="text-center text-[9px] text-slate-400 pt-1">
          DocDraft AI Enterprise • Chuẩn hóa văn bản hành chính Việt Nam
        </div>
      </div>
    </>
  );
}
