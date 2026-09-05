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
import { EditorToolbar } from "./editor-toolbar";
import { LegalAutocompleteDialog } from "./legal-autocomplete-dialog";
import { ComplianceDialog } from "./compliance-dialog";
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
                <span className="text-[10px] text-muted-foreground capitalize">
                  {inlineSuggestion.command}
                </span>
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
            </div>
          )}
        </BubbleMenu>
      )}

      {/* Khu vực Canvas A4 với nền xám nhạt mô phỏng bàn làm việc */}
      <div className="flex-1 bg-muted/40 p-4 sm:p-8 md:p-12 overflow-x-auto flex justify-center min-h-[900px]">
        {/* Tờ giấy A4 chuẩn Nghị định 30/2020/NĐ-CP */}
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
    </div>
  );
}
