"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Square,
  Copy,
  Check,
  Download,
  Printer,
  ChevronDown,
  Layers,
  HelpCircle,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { DynamicFormEngine } from "@/components/forms/dynamic-form-engine";
import { FormSchema } from "@/types/form-schema";
import { streamDocumentGeneration } from "@/lib/ai/stream-client";

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  industryPack: string;
  formSchema: FormSchema;
  userPromptTemplate: string;
}

export default function EditorPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [documentTitle, setDocumentTitle] = useState("Văn bản dự thảo mới");
  const [editorContent, setEditorContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingText, setThinkingText] = useState<string>("");
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
            setSelectedTemplateId(data[0].id);
            setDocumentTitle(`Dự thảo ${data[0].title}`);
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
  }, []);

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  // 2. Xử lý gửi Form & Bắt đầu sinh văn bản qua AI SSE Stream
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
      },
      onError: (err) => {
        setIsStreaming(false);
        console.error("Lỗi stream AI:", err);
      },
    });
  };

  // 3. Dừng sinh (AbortController)
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  // 4. Sao chép HTML
  const handleCopyHTML = () => {
    if (!editorContent) return;
    navigator.clipboard.writeText(editorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              className="bg-transparent font-semibold text-sm sm:text-base border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-0.5 max-w-[220px] sm:max-w-[340px] truncate"
              placeholder="Nhập tên văn bản..."
            />
          </div>
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
            onClick={() => window.print()}
            disabled={!editorContent}
            className="gap-1.5 h-8 text-xs"
            title="In hoặc Xuất PDF"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">In / PDF</span>
          </Button>

          <Button
            size="sm"
            className="gap-1.5 h-8 text-xs shadow-xs"
            onClick={() => alert("Tính năng tải Word (.docx) chuẩn Nghị định 30 đang đồng bộ qua Document Service.")}
            disabled={!editorContent}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xuất Word (.docx)</span>
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
                  className="w-full appearance-none rounded-lg border bg-background px-3 py-2 text-sm font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-primary truncate"
                >
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.title} ({tmpl.industryPack === "hanh_chinh" ? "Hành chính" : "Doanh nghiệp"})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            )}

            {currentTemplate && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {currentTemplate.description}
              </p>
            )}
          </div>

          {/* AI Thinking Stream Box (Nếu đang có reasoning_content) */}
          {thinkingText && (
            <div className="mx-4 mt-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-blue-800 dark:text-blue-300">
                <Brain className="h-3.5 w-3.5 animate-pulse text-blue-600" />
                <span>DeepSeek đang suy nghĩ & xây dựng thể thức...</span>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                {thinkingText}
              </p>
            </div>
          )}

          {/* Form Engine Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentTemplate?.formSchema ? (
              <div className="rounded-xl border bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <span className="font-semibold text-sm">Thông tin biến số</span>
                  <span className="text-[11px] text-muted-foreground">Tự động gắn vào mẫu</span>
                </div>

                <DynamicFormEngine
                  schema={currentTemplate.formSchema}
                  onSubmit={handleFormSubmit}
                  submitLabel={isStreaming ? "Đang sinh văn bản..." : "Sinh văn bản AI (DeepSeek)"}
                  isSubmitting={isStreaming}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Đang tải thông số biểu mẫu...
              </div>
            )}

            {/* Nút Hủy (Dừng sinh) khi đang stream */}
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
            onChange={(html) => setEditorContent(html)}
            className="flex-1 overflow-y-auto"
          />
        </main>
      </div>
    </div>
  );
}
