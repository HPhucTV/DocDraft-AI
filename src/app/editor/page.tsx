"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  Square,
  Copy,
  Check,
  Download,
  Printer,
  Save,
  Layers,
  HelpCircle,
  Brain,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { DynamicFormEngine } from "@/components/forms/dynamic-form-engine";
import { FormSchema } from "@/types/form-schema";
import { streamDocumentGeneration } from "@/lib/ai/stream-client";
import { useAutoSave } from "@/hooks/use-auto-save";

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  industryPack: string;
  formSchema: FormSchema;
  userPromptTemplate: string;
}

function EditorContentComponent() {
  const searchParams = useSearchParams();
  const draftIdFromUrl = searchParams.get("id");

  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftIdFromUrl);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(true);

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

  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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
              setSelectedTemplateId(data[0].id);
              setDocumentTitle(`Dự thảo ${data[0].title}`);
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
    const rawText = editorContent ? editorContent.replace(/<[^>]*>/g, "") : "";
    const words = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
    return {
      title: documentTitle,
      contentJson: editorJson || undefined,
      wordCount: words,
    };
  }, [documentTitle, editorJson, editorContent]);

  const { isSaving, isDirty, lastSavedAt, hasConflict, saveNow } = useAutoSave(
    autoSavePayload,
    {
      draftId: currentDraftId,
      initialVersion: currentVersion,
      intervalMs: 30000, // 30 giây theo đặc tả Nghị định 30 / ADR-005
      onSaveSuccess: ({ version }) => {
        setCurrentVersion(version);
      },
      onConflict: (info) => {
        console.warn("Phát hiện xung đột phiên bản (409 Conflict):", info);
      },
    }
  );

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  // 4. Xử lý gửi Form & Bắt đầu sinh văn bản qua AI SSE Stream
  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    if (isStreaming) return;

    setIsStreaming(true);
    setThinkingText("");
    setStreamStats(null);
    setEditorContent(""); // Làm trống canvas để đón typewriter stream

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedHtml = "";

    await streamDocumentGeneration({
      templateId: currentTemplate?.id,
      variables: formData,
      preferredProvider: "deepseek",
      signal: controller.signal,
      onThinking: (token) => {
        setThinkingText((prev) => (prev + token).slice(-300)); // Giữ 300 ký tự tư duy mới nhất
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

        // Nếu chưa có draftId trong DB, tự động tạo mới để lưu giữ
        if (!currentDraftId) {
          fetch("/api/drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: documentTitle,
              templateId: currentTemplate?.id || null,
              wordCount: stats.word_count,
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.id) {
                setCurrentDraftId(d.id);
                setCurrentVersion(d.currentVersion || 1);
              }
            })
            .catch((e) => console.error("Lỗi tự động tạo bản nháp:", e));
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        console.error("Lỗi stream AI:", err);
      },
    });
  };

  // 5. Dừng sinh (AbortController)
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  // 6. Sao chép HTML
  const handleCopyHTML = () => {
    if (!editorContent) return;
    navigator.clipboard.writeText(editorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 7. Xuất bản văn bản (Word .docx hoặc PDF) qua Next.js Proxy & Document Service (TASK-113, TASK-114, TASK-115)
  const handleExport = async (format: "docx" | "pdf") => {
    if (!editorContent) return;
    setExportingFormat(format);
    try {
      const payload =
        format === "docx"
          ? {
              title: documentTitle,
              content_json: editorJson || {
                type: "doc",
                content: [{ type: "paragraph", content: [{ type: "text", text: editorContent }] }],
              },
            }
          : {
              title: documentTitle,
              html_content: editorContent,
            };

      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.detail || `Lỗi xuất file ${format.toUpperCase()}`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const cleanTitle = (documentTitle || "Van_ban")
        .replace(/[/\\?%*:|"<>]/g, "-")
        .trim();
      a.download = `${cleanTitle}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`Xuất ${format.toUpperCase()} thất bại:`, err);
      alert(`Xuất ${format.toUpperCase()} thất bại: ${errMsg}`);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Top Header & Toolbar Bar */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-2 h-9">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </Button>

          <div className="h-4 w-px bg-border" />

          {/* Tiêu đề văn bản có thể chỉnh sửa trực tiếp */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="bg-transparent font-semibold text-sm sm:text-base border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-0.5 max-w-[200px] sm:max-w-[320px] truncate"
              placeholder="Nhập tên văn bản..."
            />
          </div>

          {/* Trạng thái Auto-save & Khóa lạc quan (TASK-118) */}
          {currentDraftId && (
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l text-xs">
              {hasConflict ? (
                <span className="flex items-center gap-1 text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Xung đột phiên bản (409)
                </span>
              ) : isSaving ? (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  Đang lưu...
                </span>
              ) : lastSavedAt ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Đã lưu lúc {lastSavedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              ) : isDirty ? (
                <span className="text-amber-500 font-medium">Chưa lưu</span>
              ) : null}
            </div>
          )}
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2">
          {streamStats && (
            <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground mr-2">
              <span>Mô hình: <strong>{streamStats.modelUsed}</strong></span>
              <span>&bull;</span>
              <span>{streamStats.wordCount} từ</span>
              <span>&bull;</span>
              <span>{(streamStats.durationMs! / 1000).toFixed(1)}s</span>
            </div>
          )}

          {currentDraftId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveNow()}
              disabled={isSaving}
              className="gap-1.5 h-8 text-xs"
              title="Lưu thủ công ngay bây giờ"
            >
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lưu</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyHTML}
            disabled={!editorContent}
            className="gap-1.5 h-8 text-xs"
            title="Sao chép mã HTML"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? "Đã chép" : "Sao chép HTML"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
            disabled={!editorContent || exportingFormat !== null}
            className="gap-1.5 h-8 text-xs"
            title="Xuất file PDF vector A4 chuẩn Nghị định 30"
          >
            {exportingFormat === "pdf" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : (
              <Printer className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {exportingFormat === "pdf" ? "Đang xuất..." : "In / PDF"}
            </span>
          </Button>

          <Button
            size="sm"
            className="gap-1.5 h-8 text-xs shadow-xs"
            onClick={() => handleExport("docx")}
            disabled={!editorContent || exportingFormat !== null}
            title="Xuất Microsoft Word (.docx) chuẩn Nghị định 30"
          >
            {exportingFormat === "docx" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>
              {exportingFormat === "docx" ? "Đang tạo .docx..." : "Xuất Word (.docx)"}
            </span>
          </Button>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Workspace: Left Sidebar (Form Engine) & Right (A4 Canvas Editor) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Biểu mẫu động & AI Control Panel */}
        <aside className="w-full md:w-[420px] lg:w-[460px] border-r bg-muted/20 flex flex-col shrink-0 overflow-hidden">
          {/* Template Selector Top */}
          <div className="p-4 border-b bg-background/50 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>Mẫu văn bản quy chuẩn</span>
            </label>

            {loadingTemplates ? (
              <div className="h-9 rounded-md bg-muted animate-pulse" />
            ) : (
              <div className="relative">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedTemplateId(id);
                    const tmpl = templates.find((t) => t.id === id);
                    if (tmpl) {
                      setDocumentTitle(`Dự thảo ${tmpl.title}`);
                    }
                  }}
                  className="w-full appearance-none rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.title} {tmpl.industryPack ? `(${tmpl.industryPack})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Form Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentTemplate ? (
              <DynamicFormEngine
                schema={currentTemplate.formSchema}
                onSubmit={handleFormSubmit}
                isSubmitting={isStreaming}
              />
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                Đang tải cấu hình biểu mẫu...
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
                    Đang phân tích cấu trúc Nghị định 30 và chuẩn hóa điều khoản...
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
        <main className="flex-1 flex flex-col overflow-hidden">
          <TiptapEditor
            initialContent={editorContent}
            onChange={(html, json) => {
              setEditorContent(html);
              setEditorJson(json);
            }}
            className="flex-1 overflow-y-auto"
          />
        </main>
      </div>
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
