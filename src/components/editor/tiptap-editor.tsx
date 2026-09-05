"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useEditor, EditorContent, type Content } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import {
  ND30Table,
  ND30TableRow,
  ND30TableCell,
  ND30TableHeader,
  ND30TableHelpers,
} from "./extensions/nd30-table";
import {
  SafePlaceholderHighlight,
  extractPlaceholders,
} from "./extensions/placeholder-highlight";
import {
  SuggestionDeletion,
  SuggestionInsertion,
  extractSuggestions,
  createSuggestion,
  type DocumentSuggestion,
} from "./extensions/suggestion-mode";
import { SuggestionsPanel } from "./suggestions-panel";
import { EditorToolbar } from "./editor-toolbar";
import { LegalAutocompleteDialog } from "./legal-autocomplete-dialog";
import { ComplianceDialog } from "./compliance-dialog";
import { ShareDialog } from "./share-dialog";
import { CommentsPanel, type CommentAnchor } from "./comments-panel";
import { AIFeedbackWidget } from "./ai-feedback-widget";
import { checkCompliance } from "@/lib/compliance/compliance-engine";
import {
  Sparkles,
  Wand2,
  Scissors,
  Maximize2,
  ShieldCheck,
  Check,
  X,
  Loader2,
  MessageSquare,
  GitPullRequest,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TiptapEditorProps {
  initialContent?: string;
  onChange?: (html: string, json: object) => void;
  onImportDocx?: (file: File) => void;
  isImportingDocx?: boolean;
  onApplyTextRef?: React.MutableRefObject<((text: string) => void) | null>;
  editable?: boolean;
  className?: string;
  draftId?: string;
  draftTitle?: string;
}

interface InlineSuggestionState {
  command: string;
  originalText: string;
  resultText: string;
  from: number;
  to: number;
}

/**
 * Trình soạn thảo A4 Canvas Editor chuẩn Nghị định 30/2020/NĐ-CP (TASK-110, TASK-111, TASK-112).
 * Tích hợp AI In-line Copilot Toolbar bôi đen gọi lệnh (TASK-205).
 */
export function TiptapEditor({
  initialContent = "",
  onChange,
  onImportDocx,
  isImportingDocx = false,
  onApplyTextRef,
  editable = true,
  className = "",
  draftId,
  draftTitle,
}: TiptapEditorProps) {
  const [placeholderCount, setPlaceholderCount] = useState(0);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);

  // State cho AI In-line Copilot Toolbar (TASK-205)
  const [isInlineLoading, setIsInlineLoading] = useState(false);
  const [inlineSuggestion, setInlineSuggestion] = useState<InlineSuggestionState | null>(null);

  // State cho Legal RAG Autocomplete Dialog (TASK-210, TASK-211)
  const [isLegalDialogOpen, setIsLegalDialogOpen] = useState(false);

  // State cho Compliance Dialog NĐ 30 (TASK-301, TASK-302)
  const [isComplianceDialogOpen, setIsComplianceDialogOpen] = useState(false);
  const [complianceScore, setComplianceScore] = useState<number>(100);

  // State cho Share Dialog (TASK-305)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // State cho In-context Comments Panel (TASK-306)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState<CommentAnchor | null>(null);
  const [commentsCount, setCommentsCount] = useState<number>(0);

  // State cho Suggestion Mode (TASK-307)
  const [isSuggestionsPanelOpen, setIsSuggestionsPanelOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<DocumentSuggestion[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      ND30Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: "nd30-table",
        },
      }),
      ND30TableRow,
      ND30TableCell,
      ND30TableHeader,
      ND30TableHelpers,
      SafePlaceholderHighlight,
      SuggestionDeletion,
      SuggestionInsertion,
    ],
    content: initialContent,
    editable,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[842px] font-times text-[13pt] leading-[1.35]",
        style: "font-family: 'Times New Roman', Times, serif;",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const json = ed.getJSON();
      onChange?.(html, json);

      // Cập nhật số lượng placeholder [...]
      const found = extractPlaceholders(ed.state.doc);
      setPlaceholderCount(found.length);

      // Cập nhật danh sách đề xuất chỉnh sửa (TASK-307)
      const foundSuggestions = extractSuggestions(ed.state.doc);
      setSuggestions(foundSuggestions);

      // Tính lại điểm tuân thủ thể thức NĐ 30
      try {
        const rep = checkCompliance(json);
        setComplianceScore(rep.score);
      } catch {
        // bỏ qua nếu ast chưa sẵn sàng
      }
    },
  });

  // Expose hàm chèn văn bản từ bên ngoài (cho AI Chat Sidebar - TASK-206)
  useEffect(() => {
    if (onApplyTextRef) {
      onApplyTextRef.current = (text: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent(text).run();
      };
    }
  }, [editor, onApplyTextRef]);

  // Lắng nghe cập nhật văn bản để tự động tính lại số lượng placeholder [...]
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const found = extractPlaceholders(editor.state.doc);
      setPlaceholderCount(found.length);
    };

    editor.on("transaction", handleUpdate);
    return () => {
      editor.off("transaction", handleUpdate);
    };
  }, [editor]);

  // Cập nhật nội dung từ ngoài vào (khi sinh stream AI)
  useEffect(() => {
    if (editor && initialContent && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [editor, initialContent]);

  // Di chuyển và bôi đen placeholder tiếp theo để người dùng nhập thông tin
  const handleJumpToNextPlaceholder = useCallback(() => {
    if (!editor) return;

    const placeholders = extractPlaceholders(editor.state.doc);
    if (placeholders.length === 0) return;

    const nextIndex = currentPlaceholderIndex >= placeholders.length ? 0 : currentPlaceholderIndex;
    const target = placeholders[nextIndex];

    editor
      .chain()
      .focus()
      .setTextSelection({ from: target.from, to: target.to })
      .scrollIntoView()
      .run();

    setCurrentPlaceholderIndex((nextIndex + 1) % placeholders.length);
  }, [editor, currentPlaceholderIndex]);

  // Xử lý gọi lệnh AI Inline Copilot (TASK-205)
  const handleInlineCommand = async (
    command: "formalize" | "shorten" | "expand" | "fix_spelling"
  ) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    if (from === to) return;

    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText.trim()) return;

    setIsInlineLoading(true);
    setInlineSuggestion(null);

    try {
      const res = await fetch("/api/ai/inline-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedText,
          command,
          preferredProvider: "deepseek",
        }),
      });

      if (!res.ok) {
        throw new Error("Lỗi khi xử lý lệnh AI Inline");
      }

      const data = await res.json();
      setInlineSuggestion({
        command,
        originalText: selectedText,
        resultText: data.resultText,
        from,
        to,
      });
    } catch (err) {
      console.error("Lỗi AI Inline Copilot:", err);
      alert("Không thể xử lý lệnh chỉnh sửa AI. Vui lòng thử lại.");
    } finally {
      setIsInlineLoading(false);
    }
  };

  // Mở bảng bình luận với đoạn văn bản đang chọn (TASK-306)
  const handleAddCommentFromSelection = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");
    setActiveAnchor({
      from,
      to,
      quote: text.slice(0, 150),
    });
    setIsCommentsOpen(true);
  };

  // Chấp nhận thay đổi từ AI Inline Copilot
  const handleAcceptInline = () => {
    if (!editor || !inlineSuggestion) return;
    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: inlineSuggestion.from, to: inlineSuggestion.to },
        inlineSuggestion.resultText
      )
      .run();
    setInlineSuggestion(null);
  };

  // Tạo đề xuất từ AI Inline Copilot (TASK-307)
  const handleSuggestInline = () => {
    if (!editor || !inlineSuggestion) return;
    createSuggestion(editor, {
      from: inlineSuggestion.from,
      to: inlineSuggestion.to,
      replacementText: inlineSuggestion.resultText,
      author: "AI Copilot",
    });
    setInlineSuggestion(null);
    setSuggestions(extractSuggestions(editor.state.doc));
    setIsSuggestionsPanelOpen(true);
  };

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {/* Thanh công cụ định dạng chuẩn văn thư */}
      <EditorToolbar
        editor={editor}
        placeholderCount={placeholderCount}
        onJumpToNextPlaceholder={handleJumpToNextPlaceholder}
        onImportDocx={onImportDocx}
        isImportingDocx={isImportingDocx}
        onOpenLegalDialog={() => setIsLegalDialogOpen(true)}
        onOpenComplianceDialog={() => setIsComplianceDialogOpen(true)}
        complianceScore={complianceScore}
        onOpenShareDialog={() => setIsShareDialogOpen(true)}
        onToggleComments={() => setIsCommentsOpen(!isCommentsOpen)}
        commentsCount={commentsCount}
        isCommentsOpen={isCommentsOpen}
        onOpenSuggestionsPanel={() => setIsSuggestionsPanelOpen(!isSuggestionsPanelOpen)}
        suggestionsCount={suggestions.length}
        isSuggestionsPanelOpen={isSuggestionsPanelOpen}
        draftId={draftId}
      />

      {/* AI In-line Copilot Bubble Menu (TASK-205) */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="z-50 flex items-center rounded-xl border border-border/80 bg-background/95 p-1.5 shadow-2xl backdrop-blur animate-in fade-in zoom-in-95"
        >
          {isInlineLoading ? (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>DeepSeek đang tối ưu câu chữ...</span>
            </div>
          ) : inlineSuggestion ? (
            /* Hiển thị bản xem trước gợi ý kèm nút [Chấp nhận / Bác bỏ] */
            <div className="flex flex-col gap-2 p-2 max-w-sm">
              <div className="flex items-center justify-between gap-2 border-b pb-1 text-xs font-semibold text-primary">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Đề xuất chỉnh sửa:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {inlineSuggestion.command}
                  </span>
                  <AIFeedbackWidget
                    draftId={draftId}
                    actionType="INLINE_EDIT"
                    promptSnippet={inlineSuggestion.originalText.slice(0, 100)}
                    completionSnippet={inlineSuggestion.resultText.slice(0, 100)}
                    size="sm"
                  />
                </div>
              </div>

              <p className="text-xs bg-muted/40 p-2 rounded border border-border/50 max-h-36 overflow-y-auto leading-relaxed font-serif">
                {inlineSuggestion.resultText}
              </p>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[11px] text-muted-foreground gap-1 px-2"
                  onClick={() => setInlineSuggestion(null)}
                >
                  <X className="h-3 w-3" />
                  <span>Bác bỏ</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 text-[11px] text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 border-purple-200 dark:border-purple-800 gap-1 px-2 font-medium"
                  onClick={handleSuggestInline}
                  title="Ghi nhận dưới dạng đề xuất chỉnh sửa để xem xét sau (TASK-307)"
                >
                  <GitPullRequest className="h-3 w-3" />
                  <span>Đề xuất</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-6 text-[11px] gap-1 px-2.5 shadow-xs"
                  onClick={handleAcceptInline}
                >
                  <Check className="h-3 w-3" />
                  <span>Chấp nhận</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Toolbar 4 nút bấm AI Copilot nhanh */
            <div className="flex items-center gap-1 text-xs">
              <div className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-primary border-r pr-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">AI Copilot</span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleInlineCommand("formalize")}
                className="h-7 text-xs gap-1 px-2 hover:text-primary hover:bg-primary/10"
                title="Hành chính hóa sang phong cách công vụ Nghị định 30"
              >
                <Wand2 className="h-3.5 w-3.5 text-primary" />
                <span>Hành chính hóa</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleInlineCommand("shorten")}
                className="h-7 text-xs gap-1 px-2 hover:text-amber-600 hover:bg-amber-500/10"
                title="Rút gọn súc tích, giữ nguyên số liệu"
              >
                <Scissors className="h-3.5 w-3.5 text-amber-500" />
                <span>Rút gọn</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleInlineCommand("expand")}
                className="h-7 text-xs gap-1 px-2 hover:text-blue-600 hover:bg-blue-500/10"
                title="Viết chi tiết, bổ sung diễn giải hành chính"
              >
                <Maximize2 className="h-3.5 w-3.5 text-blue-500" />
                <span>Chi tiết</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleInlineCommand("fix_spelling")}
                className="h-7 text-xs gap-1 px-2 hover:text-emerald-600 hover:bg-emerald-500/10"
                title="Sửa lỗi chính tả & Thể thức dấu câu"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Chính tả</span>
              </Button>

              <div className="h-4 w-px bg-border/60 mx-0.5" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddCommentFromSelection}
                className="h-7 text-xs gap-1 px-2 hover:text-amber-600 hover:bg-amber-500/10"
                title="Thêm bình luận cho đoạn văn bản này (TASK-306)"
              >
                <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                <span>Bình luận</span>
              </Button>
            </div>
          )}
        </BubbleMenu>
      )}

      {/* Khu vực Canvas A4 và Bảng bình luận / Đề xuất cộng tác (TASK-306, TASK-307) */}
      <div className="flex-1 flex overflow-hidden min-h-[900px]">
        {/* Tờ giấy A4 chuẩn Nghị định 30/2020/NĐ-CP */}
        <div className="flex-1 bg-muted/40 p-4 sm:p-8 md:p-12 overflow-x-auto flex justify-center">
          <div
            className="bg-white dark:bg-card text-foreground shadow-2xl rounded-xs border border-border/60 transition-all box-border"
            style={{
              width: "210mm",
              minHeight: "297mm",
              paddingTop: "20mm", // Lề trên: 20mm
              paddingBottom: "20mm", // Lề dưới: 20mm
              paddingLeft: "30mm", // Lề trái: 30mm
              paddingRight: "15mm", // Lề phải: 15mm
              fontFamily: "'Times New Roman', Times, serif",
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Bảng Đề xuất chỉnh sửa (TASK-307) */}
        <SuggestionsPanel
          isOpen={isSuggestionsPanelOpen}
          onClose={() => setIsSuggestionsPanelOpen(false)}
          editor={editor}
          suggestions={suggestions}
          onSuggestionChange={() => {
            if (editor) {
              setSuggestions(extractSuggestions(editor.state.doc));
              onChange?.(editor.getHTML(), editor.getJSON());
            }
          }}
        />

        {/* Bảng bình luận ngữ cảnh cộng tác (TASK-306) */}
        {draftId && (
          <CommentsPanel
            isOpen={isCommentsOpen}
            onClose={() => {
              setIsCommentsOpen(false);
              setActiveAnchor(null);
            }}
            draftId={draftId}
            activeAnchor={activeAnchor}
            onClearAnchor={() => setActiveAnchor(null)}
            onCommentsCountChange={setCommentsCount}
          />
        )}
      </div>

      {/* Legal RAG Citation Autocomplete Dialog (TASK-210, TASK-211) */}
      <LegalAutocompleteDialog
        isOpen={isLegalDialogOpen}
        onClose={() => setIsLegalDialogOpen(false)}
        onSelectCitation={(citationText) => {
          if (!editor) return;
          editor
            .chain()
            .focus()
            .insertContent(`<p><em>${citationText}</em></p>`)
            .run();
        }}
      />

      {/* Compliance Rules Engine & 1-Click Auto-Fix Dialog (TASK-301, TASK-302) */}
      <ComplianceDialog
        open={isComplianceDialogOpen}
        onOpenChange={setIsComplianceDialogOpen}
        editorContent={editor?.getJSON()}
        onApplyFixedContent={(fixedAst) => {
          if (!editor) return;
          editor.commands.setContent(fixedAst as Content);
          const newRep = checkCompliance(fixedAst);
          setComplianceScore(newRep.score);
          onChange?.(editor.getHTML(), fixedAst as object);
        }}
      />

      {/* Secure Shared Links Dialog (TASK-305) */}
      {draftId && (
        <ShareDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          draftId={draftId}
          draftTitle={draftTitle}
        />
      )}
    </div>
  );
}
