"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  X,
  PlusCircle,
  Copy,
  Check,
  RotateCcw,
  Bot,
  User,
  Square,
  Sparkles,
  BookmarkPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cleanAndFormatAiContentForEditor } from "@/lib/ai/ai-text-formatter";
import { SaveTemplateDialog } from "@/components/editor/save-template-dialog";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
}

export interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentContent: string;
  onApplyText: (text: string) => void;
}

const QUICK_PROMPTS = [
  "Thêm điều khoản về phạt vi phạm hợp đồng mức tối đa 8%",
  "Soát lỗi thể thức và dấu câu theo Nghị định 30/2020",
  "Viết chuẩn hóa danh mục nơi nhận cho cơ quan cấp tỉnh",
  "Bổ sung căn cứ Luật Đấu thầu và Luật Ngân sách",
];

function renderInlineStyles(text: string): React.ReactNode[] {
  const regex = /(\*\*.*?\*\*|\*.*?\*|\[[A-Z0-9_À-Ỹa-z0-9_\s/.\-]+\])/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2 && !part.startsWith("**")) {
      return (
        <em key={i} className="italic text-muted-foreground">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("[") && part.endsWith("]") && part.length >= 2) {
      return (
        <span
          key={i}
          className="inline-block px-1 py-0.5 mx-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

function renderFormattedChatMessage(content: string, isStreamingThis: boolean) {
  if (!content) {
    if (isStreamingThis) {
      return (
        <div className="flex items-center gap-2.5 py-1 px-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground animate-pulse flex items-center gap-1.5 ml-1">
            <Sparkles className="h-3 w-3 text-primary animate-spin" style={{ animationDuration: "3s" }} />
            AI đang suy nghĩ &amp; soạn thảo...
          </span>
        </div>
      );
    }
    return null;
  }

  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        const isLastLine = idx === lines.length - 1;
        const trimmed = line.trim();

        if (trimmed === "---") {
          return (
            <div key={idx} className="my-2 border-t border-border/60">
              {isLastLine && isStreamingThis && (
                <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary align-middle animate-pulse rounded-xs" />
              )}
            </div>
          );
        }

        if (trimmed.startsWith("### ")) {
          const titleText = trimmed.replace(/^###\s+/, "");
          return (
            <h4 key={idx} className="font-bold text-xs mt-2 mb-1 text-foreground">
              {renderInlineStyles(titleText)}
              {isLastLine && isStreamingThis && (
                <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary align-middle animate-pulse rounded-xs" />
              )}
            </h4>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const bulletText = trimmed.replace(/^[-*]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-2 my-0.5">
              <span className="text-primary font-bold">•</span>
              <span className="flex-1">
                {renderInlineStyles(bulletText)}
                {isLastLine && isStreamingThis && (
                  <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary align-middle animate-pulse rounded-xs" />
                )}
              </span>
            </div>
          );
        }

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        return (
          <p key={idx}>
            {renderInlineStyles(line)}
            {isLastLine && isStreamingThis && (
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary align-middle animate-pulse rounded-xs shadow-xs" />
            )}
          </p>
        );
      })}
    </div>
  );
}

export function AIChatSidebar({
  isOpen,
  onClose,
  documentTitle,
  documentContent,
  onApplyText,
}: AIChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content:
        "Xin chào! Tôi là trợ lý AI chuyên môn về thể thức hành chính Nghị định 30/2020/NĐ-CP. Tôi đã nắm toàn bộ nội dung văn bản hiện tại của bạn. Bạn cần tôi hỗ trợ soạn thêm điều khoản, tra cứu căn cứ pháp lý hay rà soát câu chữ nào?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [saveTemplateData, setSaveTemplateData] = useState<{
    isOpen: boolean;
    content: string;
    title: string;
  }>({
    isOpen: false,
    content: "",
    title: "",
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const idCounterRef = useRef(1);
  const accumulatedContentRef = useRef("");

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isStreaming) return;

    setInputValue("");
    idCounterRef.current += 1;
    const userMessageId = `user-${idCounterRef.current}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: text,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Chuẩn bị assistant message placeholder
    idCounterRef.current += 1;
    const assistantId = `ai-${idCounterRef.current}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    setMessages([...newMessages, assistantPlaceholder]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    accumulatedContentRef.current = "";

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          documentTitle,
          documentContent,
          preferredProvider: "deepseek",
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.replace("data:", "").trim();
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.chunk) {
                accumulatedContentRef.current += parsed.chunk;
                const currentText = accumulatedContentRef.current;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: currentText }
                      : msg
                  )
                );
              }
            } catch {}
          }
        }
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      console.error("Lỗi AI Chat:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: "Xin lỗi, đã xảy ra sự cố kết nối tới mô hình AI. Vui lòng thử lại sau.",
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l bg-background shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-5 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight">
              DocDraft AI Assistant
            </h3>
            <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
              Ngữ cảnh: {documentTitle || "Văn bản hiện tại"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() =>
              setMessages([
                {
                  id: "msg-welcome",
                  role: "assistant",
                  content:
                    "Đã làm mới đoạn hội thoại. Bạn cần tôi hỗ trợ soạn thảo nội dung nào?",
                },
              ])
            }
            title="Làm mới cuộc trò chuyện"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Quick Prompt Chips */}
      <div className="border-b bg-background/50 p-3 overflow-x-auto flex gap-1.5 no-scrollbar">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isStreaming}
            className="shrink-0 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-[11px] font-medium text-foreground hover:bg-muted hover:border-primary transition-all text-left truncate max-w-[220px]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Timeline */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isAi = msg.role === "assistant";
          const isCurrentStreamingAi = isStreaming && isAi && idx === messages.length - 1;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isAi ? "items-start" : "items-start flex-row-reverse"}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isAi
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-foreground border"
                }`}
              >
                {isAi ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </div>

              <div
                className={`group relative max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  isAi
                    ? "bg-muted/40 text-foreground border border-border/60 shadow-xs"
                    : "bg-primary text-primary-foreground shadow-xs"
                }`}
              >
                {isAi ? (
                  renderFormattedChatMessage(msg.content, isCurrentStreamingAi)
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}

                {/* Assistant Action Buttons (Hiển thị khi đã hoàn thành sinh văn bản) */}
                {isAi && msg.content && !isCurrentStreamingAi && (
                  <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copiedId === msg.id ? "Đã sao chép" : "Sao chép"}</span>
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const cleanHtml = cleanAndFormatAiContentForEditor(msg.content);
                          setSaveTemplateData({
                            isOpen: true,
                            content: cleanHtml,
                            title: documentTitle ? `Mẫu: ${documentTitle}` : "Mẫu văn bản AI",
                          });
                        }}
                        className="h-6 text-[11px] gap-1 px-2 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 transition-all"
                        title="Lưu nội dung này thành Mẫu mới để tái sử dụng"
                      >
                        <BookmarkPlus className="h-3 w-3" />
                        <span>Lưu mẫu</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const cleanHtml = cleanAndFormatAiContentForEditor(msg.content);
                          onApplyText(cleanHtml);
                          setAppliedId(msg.id);
                          setTimeout(() => setAppliedId(null), 2000);
                        }}
                        className="h-6 text-[11px] gap-1 px-2.5 text-primary border-primary/30 hover:bg-primary/5 transition-all"
                      >
                        {appliedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Đã áp dụng</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="h-3 w-3" />
                            <span>Áp dụng vào văn bản</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Input Area */}
      <footer className="border-t p-3 bg-muted/20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Hỏi trợ lý AI hoặc yêu cầu soạn điều khoản..."
            disabled={isStreaming}
            className="w-full rounded-xl border bg-background pl-4 pr-20 py-2.5 text-xs shadow-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            {isStreaming ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-7 w-7 rounded-lg"
                onClick={handleStop}
                title="Dừng phản hồi"
              >
                <Square className="h-3 w-3 fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim()}
                className="h-7 w-7 rounded-lg shadow-xs"
              >
                <Send className="h-3 w-3" />
              </Button>
            )}
          </div>
        </form>
      </footer>

      {/* Dialog lưu mẫu tùy chỉnh */}
      <SaveTemplateDialog
        isOpen={saveTemplateData.isOpen}
        onClose={() => setSaveTemplateData((prev) => ({ ...prev, isOpen: false }))}
        defaultTitle={saveTemplateData.title}
        initialContentHtml={saveTemplateData.content}
      />
    </div>
  );
}
