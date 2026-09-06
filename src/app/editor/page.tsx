"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  Square,
  Check,
  Save,
  Layers,
  HelpCircle,
  Brain,
  Loader2,
  AlertTriangle,
  GitCompare,
  History,
  Sparkles,
  Wand2,
  FileEdit,
  DollarSign,
  Calendar,
  Building,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  BookmarkPlus,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { DynamicFormEngine } from "@/components/forms/dynamic-form-engine";
import { FormSchema } from "@/types/form-schema";
import { streamDocumentGeneration } from "@/lib/ai/stream-client";
import { streamRawToDocument } from "@/lib/ai/raw-to-doc-client";
import { RawExtractionResult } from "@/lib/ai/raw-to-doc-service";
import { useAutoSave } from "@/hooks/use-auto-save";
import { OfflineStatusPill } from "@/components/offline/offline-status-pill";
import { buildWordDocumentHtml } from "@/lib/export/word-fallback";
import { ShareExportPopover } from "@/components/editor/share-export-popover";
import { CollaborativePresenceBar } from "@/components/editor/collaborative-presence-bar";

// Tối ưu hóa Bundle Size: Lazy-load các Panel & Modal nặng (bundle-dynamic-imports)
const SideBySideDiffModal = dynamic(
  () => import("@/components/diff/side-by-side-diff-modal").then((m) => m.SideBySideDiffModal),
  { ssr: false }
);
const AuditTrailPanel = dynamic(
  () => import("@/components/audit/audit-trail-panel").then((m) => m.AuditTrailPanel),
  { ssr: false }
);
const SaveTemplateDialog = dynamic(
  () => import("@/components/editor/save-template-dialog").then((m) => m.SaveTemplateDialog),
  { ssr: false }
);
const VersionHistoryPanel = dynamic(
  () => import("@/components/editor/version-history-panel").then((m) => m.VersionHistoryPanel),
  { ssr: false }
);
const AIChatSidebar = dynamic(
  () => import("@/components/editor/ai-chat-sidebar").then((m) => m.AIChatSidebar),
  { ssr: false }
);
const ShareDialog = dynamic(
  () => import("@/components/editor/share-dialog").then((m) => m.ShareDialog),
  { ssr: false }
);

const DEFAULT_EDITOR_USER = {
  id: "user-current",
  name: "Bạn",
  email: "user@docdraft.vn",
  role: "USER" as const,
};

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  industryPack: string;
  formSchema: FormSchema;
  userPromptTemplate: string;
  isBuiltin?: boolean;
  isCustom?: boolean;
  createdBy?: string;
}

const RAW_DOC_TYPES = [
  "Công văn",
  "Quyết định",
  "Tờ trình",
  "Thông báo",
  "Báo cáo",
  "Biên bản",
  "Kế hoạch",
];

function EditorContentComponent() {
  const searchParams = useSearchParams();
  const draftIdFromUrl = searchParams.get("id");

  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftIdFromUrl);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Chế độ bên trái: "template" (Form mẫu) | "raw" (Nháp thô)
  const [sidebarMode, setSidebarMode] = useState<"template" | "raw">("template");

  // State cho chế độ Nháp thô (TASK-201)
  const [rawText, setRawText] = useState("");
  const [rawTargetDocType, setRawTargetDocType] = useState("Công văn");
  const [extractedFacts, setExtractedFacts] = useState<RawExtractionResult | null>(null);

  const [documentTitle, setDocumentTitle] = useState("Văn bản dự thảo mới");
  const [editorContent, setEditorContent] = useState<string>("");
  const [editorJson, setEditorJson] = useState<object | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingText, setThinkingText] = useState<string>("");
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [streamStats, setStreamStats] = useState<{
    wordCount?: number;
    durationMs?: number;
    modelUsed?: string;
  } | null>(null);

  // State cho Diff Modal (TASK-202, TASK-203)
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [diffOriginalText, setDiffOriginalText] = useState("");
  const [diffProposedText, setDiffProposedText] = useState("");

  // State cho Audit Trail Panel (TASK-204)
  const [isAuditPanelOpen, setIsAuditPanelOpen] = useState(false);

  // State cho Version History Panel (TASK-209)
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);

  // State cho AI Chat Sidebar & In-line Copilot (TASK-206)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isImportingDocx, setIsImportingDocx] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const insertTextRef = useRef<((text: string) => void) | null>(null);
  const setEditorContentRef = useRef<((content: string | object) => void) | null>(null);

  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Chế độ hiển thị trên màn hình di động & tablet (< 1024px) (TASK-412)
  const [mobileActiveView, setMobileActiveView] = useState<"sidebar" | "canvas">("sidebar");

  // Trạng thái đóng / mở khung bên trái (Mẫu quy chuẩn & Nháp thô)
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("docdraft_editor_left_sidebar");
      if (saved !== null) {
        setIsLeftSidebarOpen(saved === "true");
      }
    }
  }, []);

  const toggleLeftSidebar = () => {
    setIsLeftSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("docdraft_editor_left_sidebar", String(next));
      }
      return next;
    });
  };

  // Phím tắt Ctrl+B (hoặc Cmd+B) để đóng / mở thanh bên trái
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        const target = e.target as HTMLElement | null;
        const isInput =
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          toggleLeftSidebar();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 1. Tải danh sách templates từ API
  useEffect(() => {
    let ignore = false;
    async function loadTemplates() {
      try {
        const res = await fetch("/api/templates");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.length > 0) {
            setTemplates(data);
            if (!draftIdFromUrl) {
              const urlTemplateId = searchParams.get("templateId") || searchParams.get("template");
              const targetTemplate = urlTemplateId
                ? data.find((t: TemplateItem) => t.id === urlTemplateId)
                : null;
              if (targetTemplate) {
                setSelectedTemplateId(targetTemplate.id);
                setDocumentTitle(`Dự thảo ${targetTemplate.title}`);
                setIsLeftSidebarOpen(true);
                setSidebarMode("template");
              } else {
                setSelectedTemplateId(data[0].id);
                setDocumentTitle(`Dự thảo ${data[0].title}`);
              }
            }
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải biểu mẫu:", err);
      } finally {
        if (!ignore) setLoadingTemplates(false);
      }
    }
    loadTemplates();
    return () => {
      ignore = true;
    };
  }, [draftIdFromUrl]);

  // 2. Nếu có `id` trên URL, tải dữ liệu bản nháp từ DB
  useEffect(() => {
    if (!draftIdFromUrl) return;

    let ignore = false;
    async function loadDraft() {
      try {
        const res = await fetch(`/api/drafts/${draftIdFromUrl}`);
        if (res.ok) {
          const draft = await res.json();
          if (!ignore) {
            setCurrentDraftId(draft.id);
            setDocumentTitle(draft.title);
            setCurrentVersion(draft.currentVersion);
            if (draft.templateId) {
              setSelectedTemplateId(draft.templateId);
            }
            if (draft.contentJson) {
              setEditorJson(draft.contentJson);
              setEditorContentRef.current?.(draft.contentJson);
            } else if (draft.content) {
              setEditorContent(draft.content);
              setEditorContentRef.current?.(draft.content);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết bản nháp:", err);
      }
    }
    loadDraft();
    return () => {
      ignore = true;
    };
  }, [draftIdFromUrl]);

  // 3. Cơ chế Tự động lưu (Auto-save) và Kiểm soát khóa lạc quan (Optimistic Locking - TASK-118)
  const autoSavePayload = useMemo(() => {
    const rawTextOnly = editorContent ? editorContent.replace(/<[^>]*>/g, "") : "";
    const words = rawTextOnly.trim() ? rawTextOnly.trim().split(/\s+/).length : 0;
    return {
      title: documentTitle,
      contentJson: editorJson || undefined,
      wordCount: words,
    };
  }, [documentTitle, editorJson, editorContent]);

  const { isSaving, isDirty, lastSavedAt, hasConflict, saveNow, resolveConflict } = useAutoSave(
    autoSavePayload,
    {
      draftId: currentDraftId,
      initialVersion: currentVersion,
      intervalMs: 60000, // Chu kỳ 1 phút (60 giây), chỉ lưu khi có thay đổi thực tế
      onSaveSuccess: ({ version }) => {
        setCurrentVersion(version);
      },
      onConflict: (info) => {
        console.warn("Phát hiện xung đột phiên bản (409 Conflict):", info);
      },
    }
  );

  // Phím tắt Ctrl+S / Cmd+S để lưu chủ động bất cứ lúc nào
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        saveNow();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveNow]);

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  // Ghi nhận Audit Log (TASK-204)
  const logAuditEvent = async (
    actionType: string,
    source: "AI" | "HUMAN",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details: Record<string, any>
  ) => {
    if (!currentDraftId) return;
    try {
      await fetch(`/api/drafts/${currentDraftId}/audit-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType,
          source,
          details,
        }),
      });
    } catch (e) {
      console.error("Lỗi khi ghi audit log:", e);
    }
  };

  // 4. Xử lý gửi Form & Bắt đầu sinh văn bản qua AI SSE Stream (Mẫu quy chuẩn)
  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    if (isStreaming) return;

    setIsStreaming(true);
    setThinkingText("");
    setStreamStats(null);
    setEditorContent(""); // Làm trống canvas để đón typewriter stream
    setMobileActiveView("canvas"); // Tự động chuyển sang Canvas trên di động (TASK-412)

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedHtml = "";

    await streamDocumentGeneration({
      templateId: currentTemplate?.id,
      variables: formData,
      preferredProvider: "deepseek",
      signal: controller.signal,
      onThinking: (token) => {
        setThinkingText((prev) => (prev + token).slice(-300));
      },
      onToken: (chunk) => {
        accumulatedHtml += chunk;
        setEditorContent(accumulatedHtml);
      },
      onComplete: (stats) => {
        setIsStreaming(false);
        setThinkingText("");
        setStreamStats({
          wordCount: stats.word_count,
          durationMs: stats.duration_ms,
          modelUsed: stats.model_used,
        });

        // Ghi Audit Trail
        logAuditEvent("AI_GENERATE", "AI", {
          words_added: stats.word_count,
          ai_model: stats.model_used,
          template_id: currentTemplate?.id,
        });

        // Đảm bảo editor đồng bộ nội dung hoàn chỉnh
        setEditorContentRef.current?.(accumulatedHtml);

        // Tạo draft nếu chưa có
        if (!currentDraftId) {
          fetch("/api/drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: documentTitle,
              templateId: currentTemplate?.id || null,
              wordCount: stats.word_count,
              rawInputData: formData,
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.id) {
                setCurrentDraftId(d.id);
                setCurrentVersion(d.currentVersion || 1);
                window.history.replaceState(null, "", `/editor?id=${d.id}`);
              }
            })
            .catch((e) => console.error("Lỗi tạo bản nháp:", e));
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        console.error("Lỗi stream AI:", err);
      },
    });
  };

  // 5. Xử lý Chuẩn hóa Nháp thô sang Nghị định 30 (TASK-201)
  const handleRawToDocSubmit = async () => {
    if (!rawText.trim() || isStreaming) return;

    setIsStreaming(true);
    setThinkingText("");
    setStreamStats(null);
    setExtractedFacts(null);
    setMobileActiveView("canvas"); // Tự động chuyển sang Canvas trên di động (TASK-412)

    // Lưu văn bản gốc hiện tại để chuẩn bị so sánh Diff nếu cần
    const originalSnapshot = editorContent;
    setEditorContent("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedHtml = "";

    await streamRawToDocument({
      rawText,
      targetDocType: rawTargetDocType,
      preferredProvider: "deepseek",
      signal: controller.signal,
      onFacts: (facts) => {
        setExtractedFacts(facts);
        if (facts.documentType) {
          setDocumentTitle(`${facts.documentType}: ${facts.organization}`);
        }
      },
      onThinking: (token) => {
        setThinkingText((prev) => (prev + token).slice(-300));
      },
      onToken: (chunk) => {
        accumulatedHtml += chunk;
        setEditorContent(accumulatedHtml);
      },
      onComplete: (stats) => {
        setIsStreaming(false);
        setThinkingText("");
        setStreamStats({
          wordCount: stats.word_count,
          durationMs: stats.duration_ms,
          modelUsed: stats.model_used,
        });

        // Nếu trước đó đã có nội dung, chuẩn bị sẵn bản so sánh Diff View
        if (originalSnapshot.trim()) {
          setDiffOriginalText(originalSnapshot);
          setDiffProposedText(accumulatedHtml);
        }

        // Ghi Audit Trail
        logAuditEvent("AI_GENERATE", "AI", {
          words_added: stats.word_count,
          ai_model: stats.model_used,
          mode: "RAW_TO_DOC",
        });

        setEditorContentRef.current?.(accumulatedHtml);

        if (!currentDraftId) {
          fetch("/api/drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: documentTitle,
              wordCount: stats.word_count,
              mode: "RAW",
              rawInputData: { rawText, rawTargetDocType },
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.id) {
                setCurrentDraftId(d.id);
                setCurrentVersion(d.currentVersion || 1);
                window.history.replaceState(null, "", `/editor?id=${d.id}`);
              }
            })
            .catch((e) => console.error("Lỗi tự động tạo draft:", e));
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        console.error("Lỗi Raw-to-Doc stream:", err);
      },
    });
  };

  // 6. Áp dụng kết quả từ Side-by-side Diff View (TASK-202, TASK-203)
  const handleApplyDiffMerged = (
    mergedText: string,
    stats: { aiAttributionPercentage: number; addedWords: number; removedWords: number }
  ) => {
    setEditorContent(mergedText);
    logAuditEvent("AI_APPLY", "AI", {
      words_added: stats.addedWords,
      words_removed: stats.removedWords,
      ai_attribution_percentage: stats.aiAttributionPercentage,
    });
  };

  // 7. Dừng sinh (AbortController)
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  // 8. Sao chép HTML
  const handleCopyHTML = () => {
    if (!editorContent) return;
    navigator.clipboard.writeText(editorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Kích hoạt hộp thoại In / Lưu PDF vector chất lượng cao của trình duyệt
  const triggerBrowserPdfPrint = () => {
    const originalTitle = document.title;
    const cleanTitle = (documentTitle || "Van_ban")
      .replace(/[/\\?%*:|"<>]/g, "-")
      .trim();

    // Gán tạm document.title để trình duyệt tự điền tên file PDF trùng với tiêu đề văn bản
    document.title = cleanTitle;

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1500);
    }, 50);
  };

  // Xuất file Word tương thích trực tiếp từ Client (Không phụ thuộc Python Service)
  const exportWordDirectly = (title: string, html: string) => {
    const cleanTitle = (title || "Van_ban").replace(/[/\\?%*:|"<>]/g, "-").trim();
    const wordHtml = buildWordDocumentHtml(cleanTitle, html);
    const blob = new Blob(["\ufeff", wordHtml], {
      type: "application/msword;charset=utf-8",
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${cleanTitle}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  };

  // 9. Xuất bản văn bản (Word .docx hoặc PDF) (TASK-113, TASK-114, TASK-115)
  const handleExport = async (format: "docx" | "pdf") => {
    if (!editorContent) return;
    setExportingFormat(format);
    try {
      if (format === "pdf") {
        let downloaded = false;
        try {
          const res = await fetch(`/api/export/pdf`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: documentTitle,
              html_content: editorContent,
            }),
          });

          const contentType = res.headers.get("Content-Type") || "";
          if (res.ok && contentType.includes("application/pdf")) {
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            const cleanTitle = (documentTitle || "Van_ban")
              .replace(/[/\\?%*:|"<>]/g, "-")
              .trim();
            a.download = `${cleanTitle}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            downloaded = true;
          }
        } catch (e) {
          console.warn("Document Service ngoại tuyến, tự động chuyển sang in/lưu PDF trình duyệt:", e);
        }

        // Tự động chuyển tiếp sang chế độ In / Lưu PDF vector chất lượng cao nếu Document Service offline
        if (!downloaded) {
          triggerBrowserPdfPrint();
        }
        return;
      }

      // Xử lý xuất Word
      if (format === "docx") {
        let downloaded = false;
        try {
          const res = await fetch(`/api/export/docx`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: documentTitle,
              content_json: editorJson || {
                type: "doc",
                content: [{ type: "paragraph", content: [{ type: "text", text: editorContent }] }],
              },
              html_content: editorContent,
            }),
          });

          if (res.ok) {
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            const cleanTitle = (documentTitle || "Van_ban")
              .replace(/[/\\?%*:|"<>]/g, "-")
              .trim();
            const ext = res.headers.get("Content-Type")?.includes("msword") ? "doc" : "docx";
            a.download = `${cleanTitle}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            downloaded = true;
          }
        } catch (e) {
          console.warn("Lỗi gọi API xuất Word, chuyển sang xuất Word trực tiếp:", e);
        }

        if (!downloaded) {
          exportWordDirectly(documentTitle, editorContent);
        }
        return;
      }
    } catch (err: unknown) {
      console.error(`Xuất ${format.toUpperCase()} thất bại:`, err);
      if (format === "pdf") {
        triggerBrowserPdfPrint();
      } else {
        exportWordDirectly(documentTitle, editorContent);
      }
    } finally {
      setExportingFormat(null);
    }
  };

  // 10. Xử lý Nhập khẩu tệp Word (.docx) sang Tiptap Canvas (TASK-207)
  const handleImportDocx = async (file: File) => {
    setIsImportingDocx(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse/docx", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Không thể đọc tệp Word (.docx)");
      }

      const data = await res.json();
      if (data.html) {
        setEditorContent(data.html);
      }
      if (data.content_json) {
        setEditorJson(data.content_json);
      }
      const inferredTitle = file.name.replace(/\.[^/.]+$/, "");
      setDocumentTitle(inferredTitle);

      logAuditEvent("IMPORT_DOCX", "HUMAN", {
        file_name: file.name,
        file_size: file.size,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Lỗi import Word:", err);
      alert(`Lỗi import Word: ${errMsg}`);
    } finally {
      setIsImportingDocx(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Top Header & Toolbar Bar */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6 shadow-xs no-print">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 h-9 shrink-0 px-2 sm:px-3">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
          </Button>

          {/* Nút đóng / mở khung bên trái (gần nút Dashboard) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLeftSidebar}
            className={`gap-1.5 h-9 px-2 text-xs transition-colors shrink-0 ${
              !isLeftSidebarOpen
                ? "text-primary bg-primary/10 hover:bg-primary/20 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title={isLeftSidebarOpen ? "Ẩn khung bên trái (Ctrl+B)" : "Hiện khung bên trái (Ctrl+B)"}
          >
            {isLeftSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4 text-primary" />
            )}
            <span className="hidden 2xl:inline text-xs">
              {isLeftSidebarOpen ? "Đóng thanh bên" : "Mở thanh bên"}
            </span>
          </Button>

          <div className="h-4 w-px bg-border shrink-0" />

          {/* Tiêu đề văn bản có thể chỉnh sửa trực tiếp */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="bg-transparent font-semibold text-sm sm:text-base border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-0.5 w-32 sm:w-44 md:w-56 lg:w-64 truncate shrink-0"
              placeholder="Nhập tên văn bản..."
            />
          </div>

          {/* Trạng thái Auto-save & Khóa lạc quan (TASK-118) */}
          {currentDraftId && (
            <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l text-xs shrink-0 whitespace-nowrap">
              {hasConflict ? (
                <button
                  type="button"
                  onClick={() => {
                    resolveConflict(currentVersion);
                    saveNow();
                  }}
                  className="flex items-center gap-1 text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20 hover:bg-destructive/20 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  title="Nhấn để đồng bộ phiên bản mới nhất và thử lưu lại"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Xung đột (409)</span>
                </button>
              ) : isSaving ? (
                <span className="flex items-center gap-1.5 text-muted-foreground shrink-0 whitespace-nowrap">
                  <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
                  <span>Đang lưu...</span>
                </span>
              ) : isDirty ? (
                <span
                  className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0 whitespace-nowrap"
                  title="Có chỉnh sửa mới chưa lưu. Hệ thống tự động lưu sau 1 phút, hoặc nhấn Ctrl+S để lưu ngay."
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span>Chưa lưu</span>
                </span>
              ) : lastSavedAt ? (
                <span className="flex items-center gap-1 text-muted-foreground shrink-0 whitespace-nowrap">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Đã lưu {lastSavedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground/80 shrink-0 whitespace-nowrap">
                  <Check className="h-3.5 w-3.5 text-emerald-500/80 shrink-0" />
                  <span>Đã đồng bộ</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {streamStats && (
            <div className="hidden 2xl:flex items-center gap-2 text-xs text-muted-foreground mr-1 shrink-0 whitespace-nowrap">
              <span>Mô hình: <strong>{streamStats.modelUsed}</strong></span>
              <span>&bull;</span>
              <span>{streamStats.wordCount} từ</span>
              <span>&bull;</span>
              <span>{(streamStats.durationMs! / 1000).toFixed(1)}s</span>
            </div>
          )}

          {/* Nút mở Side-by-side Diff View (TASK-202, TASK-203) */}
          {diffOriginalText && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDiffModalOpen(true)}
              className="gap-1.5 h-8 text-xs text-primary border-primary/30 shrink-0 whitespace-nowrap px-2 sm:px-2.5"
              title="So sánh với bản nháp thô ban đầu"
            >
              <GitCompare className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xl:inline">Diff View</span>
            </Button>
          )}

          {/* Nút mở Lịch sử phiên bản & Rollback (TASK-209) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVersionPanelOpen(true)}
            className="gap-1 h-8 text-xs font-semibold text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10 shrink-0 whitespace-nowrap px-2 sm:px-2.5"
            title="Lịch sử phiên bản & Khôi phục 1-Click"
          >
            <History className="h-3.5 w-3.5 shrink-0" />
            <span>v{currentVersion}</span>
          </Button>

          {/* Nút mở Audit Trail (TASK-204) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAuditPanelOpen(true)}
            className="gap-1.5 h-8 text-xs shrink-0 whitespace-nowrap px-2 sm:px-2.5"
            title="Nhật ký kiểm toán AI & Người dùng"
          >
            <History className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="hidden xl:inline">Audit Trail</span>
          </Button>

          {/* Nút mở AI Copilot Chat (TASK-206) */}
          <Button
            variant={isChatOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="gap-1.5 h-8 text-xs font-medium shrink-0 whitespace-nowrap px-2 sm:px-2.5"
            title="Mở bảng trợ lý AI Copilot ngữ cảnh văn bản"
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">AI Copilot</span>
          </Button>

          {/* Nút Lưu thành Mẫu mới */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSaveTemplateModalOpen(true)}
            disabled={!editorContent}
            className="gap-1.5 h-8 text-xs font-medium text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 transition-all shrink-0 whitespace-nowrap px-2 sm:px-2.5"
            title="Lưu văn bản này thành mẫu mới để tái sử dụng"
          >
            <BookmarkPlus className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Lưu mẫu</span>
          </Button>

          {currentDraftId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveNow()}
              disabled={isSaving}
              className="gap-1.5 h-8 text-xs shrink-0 whitespace-nowrap px-2 sm:px-2.5"
              title="Lưu thủ công ngay (Ctrl+S)"
            >
              <Save className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">Lưu</span>
            </Button>
          )}

          {/* Cụm Hiển thị Trực tuyến (Giữ nguyên vẹn theo yêu cầu người dùng) */}
          <CollaborativePresenceBar
            draftId={currentDraftId || "default-draft"}
            currentUser={DEFAULT_EDITOR_USER}
            onShareClick={() => setIsShareOpen(true)}
          />

          {/* Menu Chia sẻ & Xuất bản chuẩn phong cách Canva (Gói gọn 3 nút Xuất Word, In/PDF, Sao chép + Mời) */}
          <ShareExportPopover
            open={isShareOpen}
            onOpenChange={setIsShareOpen}
            draftId={currentDraftId || undefined}
            draftTitle={documentTitle || "Văn bản dự thảo"}
            editorContent={editorContent}
            currentUser={DEFAULT_EDITOR_USER}
            exportingFormat={exportingFormat as ("pdf" | "docx" | null)}
            onExport={handleExport}
            onCopyHTML={handleCopyHTML}
            copied={copied}
            onOpenAdvancedShare={() => setIsShareDialogOpen(true)}
            onOpenHistory={() => setIsVersionPanelOpen(true)}
            onSaveAsTemplate={() => setIsSaveTemplateModalOpen(true)}
          />

          <OfflineStatusPill draftId={currentDraftId || undefined} />


          <ThemeToggle />
        </div>
      </header>

      {/* Mobile / Tablet Segmented View Switcher (< 1024px) (TASK-412) */}
      <div className="flex lg:hidden border-b bg-muted/40 p-2 gap-2 shrink-0 no-print">
        <button
          type="button"
          onClick={() => setMobileActiveView("sidebar")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            mobileActiveView === "sidebar"
              ? "bg-background text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Nhập dữ liệu ({sidebarMode === "template" ? "Mẫu" : "Nháp"})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActiveView("canvas")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            mobileActiveView === "canvas"
              ? "bg-background text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Trang soạn thảo A4</span>
        </button>
      </div>

      {/* Main Workspace: Left Sidebar & Right A4 Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Biểu mẫu động & Nháp thô */}
        <aside
          className={`${
            mobileActiveView === "sidebar" ? "flex" : "hidden"
          } ${
            isLeftSidebarOpen ? "lg:flex w-full lg:w-[460px]" : "hidden lg:hidden w-0"
          } border-r bg-muted/20 flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out no-print`}
        >
          {/* Mode Switcher Tabs */}
          <div className="p-2.5 sm:p-3 border-b bg-background/50 flex items-center gap-1.5">
            <button
              onClick={() => setSidebarMode("template")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sidebarMode === "template"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Mẫu quy chuẩn</span>
            </button>
            <button
              onClick={() => setSidebarMode("raw")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sidebarMode === "raw"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Chuẩn hóa nháp thô</span>
            </button>

            {/* Nút đóng nhanh trực tiếp trên thanh tiêu đề khung bên trái */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLeftSidebar}
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 rounded-lg hover:bg-muted"
              title="Đóng khung bên trái (Ctrl+B)"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>

          {/* Sub-header for Mode */}
          {sidebarMode === "template" ? (
            <div className="p-4 border-b bg-background/30 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileEdit className="h-3.5 w-3.5 text-primary" />
                <span>Chọn biểu mẫu</span>
              </label>

              {loadingTemplates ? (
                <div className="h-9 rounded-md bg-muted animate-pulse" />
              ) : (
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedTemplateId(id);
                    const tmpl = templates.find((t) => t.id === id);
                    if (tmpl) setDocumentTitle(`Dự thảo ${tmpl.title}`);
                  }}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-xs focus:border-primary focus:outline-none"
                >
                  {templates.map((tmpl) => {
                    const isCustom = tmpl.isCustom || tmpl.isBuiltin === false;
                    return (
                      <option key={tmpl.id} value={tmpl.id}>
                        {isCustom
                          ? `⭐ [Mẫu của tôi] ${tmpl.title}`
                          : `${tmpl.title} ${tmpl.industryPack ? `(${tmpl.industryPack})` : ""}`}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          ) : (
            <div className="p-4 border-b bg-background/30 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Loại văn bản đích</span>
              </label>
              <select
                value={rawTargetDocType}
                onChange={(e) => setRawTargetDocType(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-xs focus:border-primary focus:outline-none"
              >
                {RAW_DOC_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Form / Raw Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sidebarMode === "template" ? (
              currentTemplate ? (
                <DynamicFormEngine
                  schema={currentTemplate.formSchema}
                  onSubmit={handleFormSubmit}
                  isSubmitting={isStreaming}
                />
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  Đang tải cấu hình biểu mẫu...
                </div>
              )
            ) : (
              /* Raw Polish Mode Form (TASK-201) */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Nội dung nháp thô / Ghi chú / Email</span>
                    <span className="text-[11px] text-muted-foreground">
                      {rawText.length} ký tự
                    </span>
                  </label>
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Dán nội dung nháp thô, email chỉ đạo, biên bản họp hoặc gạch đầu dòng vào đây... Ví dụ:&#10;- UBND tỉnh yêu cầu Sở GD&ĐT chuẩn bị khai giảng&#10;- Kinh phí tổ chức 150.000.000 đ&#10;- Hoàn thành trước 30/08/2026..."
                    className="w-full rounded-lg border bg-background p-3 text-xs leading-relaxed shadow-xs focus:border-primary focus:outline-none resize-none font-sans"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleRawToDocSubmit}
                  disabled={!rawText.trim() || isStreaming}
                  className="w-full gap-2 shadow-xs"
                >
                  <Wand2 className="h-4 w-4" />
                  <span>Chuẩn hóa sang Nghị định 30</span>
                </Button>

                {/* Facts Extracted Badge Preview */}
                {extractedFacts && (
                  <div className="rounded-xl border bg-card p-3.5 space-y-2 text-xs animate-in fade-in">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Dữ kiện đã bóc tách (Bảo toàn 100%)</span>
                    </div>

                    <div className="space-y-1 text-muted-foreground text-[11px]">
                      {extractedFacts.organization && (
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3 w-3 text-primary shrink-0" />
                          <span className="truncate">Cơ quan: {extractedFacts.organization}</span>
                        </div>
                      )}
                      {extractedFacts.financialFigures.length > 0 && (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                          <DollarSign className="h-3 w-3 shrink-0" />
                          <span>Số tiền: {extractedFacts.financialFigures.join(", ")}</span>
                        </div>
                      )}
                      {extractedFacts.datesAndDeadlines.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-blue-500 shrink-0" />
                          <span>Thời hạn: {extractedFacts.datesAndDeadlines.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Thinking / Reasoning Stream Indicator */}
            {isStreaming && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <Brain className="h-4 w-4 animate-pulse" />
                  <span>DeepSeek reasoning tokens...</span>
                </div>
                {thinkingText ? (
                  <p className="text-xs font-mono text-muted-foreground whitespace-pre-wrap line-clamp-4 bg-background/50 p-2 rounded border border-border/50">
                    {thinkingText}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    Đang phân tích cấu trúc Nghị định 30 và bóc tách dữ kiện...
                  </p>
                )}
              </div>
            )}

            {/* Stop Streaming Button */}
            {isStreaming && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleStopStreaming}
                className="w-full gap-2 shadow-xs"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>Dừng sinh văn bản</span>
              </Button>
            )}

            {/* Hướng dẫn tuân thủ Nghị định 30 */}
            <div className="rounded-lg border border-border/80 bg-background/60 p-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <span>Tiêu chuẩn Nghị định 30/2020/NĐ-CP</span>
              </div>
              <p className="leading-relaxed">
                Văn bản sinh ra sử dụng bố cục bảng ẩn 2 cột chuẩn tỉ lệ 40/60 cho Tiêu ngữ và 50/50 cho Chữ ký.
                Các số liệu chưa được nhập sẽ được bọc an toàn trong <code className="bg-muted px-1 rounded">[...]</code>.
              </p>
            </div>
          </div>
        </aside>

        {/* Right Side: A4 Canvas Editor (Tiptap) */}
        <main className={`${mobileActiveView === "canvas" ? "flex" : "hidden"} lg:flex flex-1 flex-col overflow-hidden relative`}>
          <TiptapEditor
            draftId={currentDraftId || undefined}
            draftTitle={documentTitle}
            initialContent={editorContent}
            initialJson={editorJson}
            onSetContentRef={setEditorContentRef}
            onChange={(html, json) => {
              setEditorContent(html);
              setEditorJson(json);
            }}
            onImportDocx={handleImportDocx}
            isImportingDocx={isImportingDocx}
            onApplyTextRef={insertTextRef}
            className="flex-1 overflow-hidden"
          />

          {/* AI Chat Sidebar Drawer (TASK-206) */}
          <AIChatSidebar
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            documentTitle={documentTitle}
            documentContent={editorContent}
            onApplyText={(text) => {
              insertTextRef.current?.(text);
            }}
          />
        </main>
      </div>

      {/* Side-by-side Diff Modal (TASK-202, TASK-203) */}
      <SideBySideDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        originalText={diffOriginalText}
        proposedText={diffProposedText}
        onApplyMerged={handleApplyDiffMerged}
        title={`So sánh đề xuất thay đổi: ${documentTitle}`}
      />

      {/* Audit Trail Panel (TASK-204) */}
      <AuditTrailPanel
        draftId={currentDraftId}
        isOpen={isAuditPanelOpen}
        onClose={() => setIsAuditPanelOpen(false)}
      />

      {/* Version History Panel (TASK-209) */}
      <VersionHistoryPanel
        draftId={currentDraftId}
        currentVersion={currentVersion}
        isOpen={isVersionPanelOpen}
        onClose={() => setIsVersionPanelOpen(false)}
        onRollbackSuccess={(newVersion, contentJson) => {
          setCurrentVersion(newVersion);
          setEditorJson(contentJson);
          setEditorContentRef.current?.(contentJson);
          resolveConflict(newVersion);
        }}
      />

      {/* Dialog Lưu thành Mẫu mới */}
      <SaveTemplateDialog
        isOpen={isSaveTemplateModalOpen}
        onClose={() => setIsSaveTemplateModalOpen(false)}
        defaultTitle={documentTitle ? `Mẫu: ${documentTitle}` : "Mẫu văn bản mới"}
        initialContentHtml={editorContent}
        onSuccess={(newTemplate) => {
          setTemplates((prev) => [newTemplate, ...prev]);
          setSelectedTemplateId(newTemplate.id);
          setDocumentTitle(`Dự thảo ${newTemplate.title}`);
        }}
      />

      {/* Dialog Cài đặt Chia sẻ Nâng cao (Mật khẩu, Hạn dùng, Thu hồi) */}
      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        draftId={currentDraftId || "draft-temp"}
        draftTitle={documentTitle || "Văn bản dự thảo"}
      />
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <EditorContentComponent />
    </Suspense>
  );
}
