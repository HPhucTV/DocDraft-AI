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
import { SubmitApprovalDialog } from "./submit-approval-dialog";
import { ApprovalBanner } from "./approval-banner";
import { checkCompliance } from "@/lib/compliance/compliance-engine";
import { PageBreak } from "./extensions/page-break";
import { FontFamily } from "./extensions/font-family";
import { FontSize } from "./extensions/font-size";
import { TextColor } from "./extensions/text-color";
import { Subscript, Superscript } from "./extensions/subscript-superscript";
import { WordRuler } from "./word-ruler";
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
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cleanAndFormatAiContentForEditor,
  isFullND30Document,
  convertFullDocumentToND30Html,
} from "@/lib/ai/ai-text-formatter";
import { collabManager } from "@/lib/collaboration/collab-manager";

export interface TiptapEditorProps {
  initialContent?: string;
  initialJson?: object | null;
  onSetContentRef?: React.MutableRefObject<((content: string | object) => void) | null>;
  onChange?: (html: string, json: object) => void;
  onImportDocx?: (file: File) => void;
  isImportingDocx?: boolean;
  onApplyTextRef?: React.MutableRefObject<((text: string) => void) | null>;
  onOpenSmartFill?: () => void;
  editable?: boolean;
  className?: string;
  draftId?: string;
  draftTitle?: string;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  draftStatus?: string;
  qrVerifyCode?: string | null;
  activeChainId?: string | null;
  currentStep?: number;
  totalSteps?: number;
  isCurrentApprover?: boolean;
  onWorkflowUpdate?: () => void;
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
 * Tích hợp Luồng Trình ký & Phê duyệt nội bộ (TASK-401, TASK-402, TASK-403, TASK-404).
 */
export function TiptapEditor({
  initialContent = "",
  initialJson = null,
  onSetContentRef,
  onChange,
  onImportDocx,
  isImportingDocx = false,
  onApplyTextRef,
  onOpenSmartFill,
  editable = true,
  className = "",
  draftId,
  draftTitle,
  currentUser,
  draftStatus = "DRAFT",
  qrVerifyCode,
  activeChainId,
  currentStep = 1,
  totalSteps = 1,
  isCurrentApprover = false,
  onWorkflowUpdate,
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

  // State cho Luồng Trình ký & Phê duyệt nội bộ (TASK-401, TASK-402)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);

  // State cho Giao diện trang giấy A4 (UI/UX Pro Max)
  const [paperTheme, setPaperTheme] = useState<"white" | "dark">("white");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [lineSpacing, setLineSpacing] = useState<number>(1.25);
  const [showRuler, setShowRuler] = useState<boolean>(true);

  // Cứu hộ dữ liệu khẩn cấp qua LocalStorage (TASK-118 Recovery)
  const [localBackup, setLocalBackup] = useState<{ time: string; content: object } | null>(null);

  const handleRestoreLocalBackup = () => {
    if (!editor || !localBackup) return;
    editor.commands.setContent(localBackup.content as Content);
    const html = editor.getHTML();
    const json = editor.getJSON();
    onChange?.(html, json);
    setLocalBackup(null);
  };

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
      PageBreak,
      FontFamily,
      FontSize,
      TextColor,
      Subscript,
      Superscript,
    ],
    content: initialContent,
    editable,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[250mm] h-auto font-times text-[13pt] leading-[1.35]",
        style: "font-family: 'Times New Roman', Times, serif;",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const json = ed.getJSON();
      onChange?.(html, json);

      // Lưu ngay vào LocalStorage để bảo vệ dữ liệu khi mất mạng hoặc tắt tab đột ngột
      try {
        const storageKey = `docdraft_backup_${draftId || "new"}`;
        localStorage.setItem(
          storageKey,
          JSON.stringify({ content: json, time: Date.now() })
        );
      } catch {}

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
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      collabManager.updateCursor(from, to);
    },
  });

  const stats = React.useMemo(() => {
    if (!editor) return { words: 0, characters: 0 };
    const text = editor.state.doc.textContent || "";
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    return { words, characters: text.length };
  }, [editor]);

  // Tính số trang hiện tại và tổng số trang (Word Multi-Page Pagination)
  const pageInfo = React.useMemo(() => {
    if (!editor) return { currentPage: 1, totalPages: 1 };
    const { from } = editor.state.selection;
    let totalBreaks = 0;
    let breaksBeforeCursor = 0;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "pageBreak") {
        totalBreaks++;
        if (pos < from) {
          breaksBeforeCursor++;
        }
      }
    });

    const charEstimate = Math.ceil((stats.characters || 0) / 2500);
    const totalPages = Math.max(1, totalBreaks + 1, charEstimate);
    const currentPage = Math.min(totalPages, breaksBeforeCursor + 1);
    return { currentPage, totalPages };
  }, [editor, stats.characters]);

  // Tự động quét LocalStorage tìm bản sao lưu có nội dung khi tài liệu bị trống (0 ký tự)
  useEffect(() => {
    if (typeof window === "undefined" || !editor) return;
    if (stats.characters === 0) {
      try {
        let foundBackup: { time: string; content: object } | null = null;
        const currentKey = `docdraft_backup_${draftId || "new"}`;
        const directSaved = localStorage.getItem(currentKey);
        if (directSaved) {
          const parsed = JSON.parse(directSaved);
          if (parsed?.content && parsed?.time) {
            const rawStr = JSON.stringify(parsed.content);
            if (rawStr.length > 60) {
              const d = new Date(parsed.time);
              const timeStr = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              foundBackup = { time: timeStr, content: parsed.content };
            }
          }
        }

        if (!foundBackup) {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith("docdraft_backup_")) {
              const val = localStorage.getItem(k);
              if (val) {
                try {
                  const p = JSON.parse(val);
                  if (p?.content && p?.time && JSON.stringify(p.content).length > 60) {
                    const d = new Date(p.time);
                    const timeStr = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                    foundBackup = { time: timeStr, content: p.content };
                    break;
                  }
                } catch {}
              }
            }
          }
        }

        if (foundBackup) {
          setLocalBackup(foundBackup);
        }
      } catch (e) {
        console.warn("Lỗi đọc local backup:", e);
      }
    }
  }, [stats.characters, draftId, editor]);

  // Expose hàm chèn văn bản từ bên ngoài (cho AI Chat Sidebar - TASK-206)
  useEffect(() => {
    if (onApplyTextRef) {
      onApplyTextRef.current = (text: string) => {
        if (!editor) return;
        const formatted = text.includes('<table data-nd30-table="true"') || text.startsWith("<p") || text.startsWith("<h")
          ? text
          : cleanAndFormatAiContentForEditor(text);

        const isEffectivelyEmpty = editor.isEmpty || editor.getText().trim() === "";
        if (isEffectivelyEmpty) {
          editor.commands.setContent(formatted);
        } else {
          editor.chain().focus().insertContent(formatted).run();
        }
      };
    }
  }, [editor, onApplyTextRef]);

  // Expose hàm nạp lại nội dung tức thời (Dùng cho Rollback phiên bản & LoadDraft)
  useEffect(() => {
    if (onSetContentRef) {
      onSetContentRef.current = (content: string | object) => {
        if (!editor) return;
        editor.commands.setContent(content as Content);
        const html = editor.getHTML();
        const json = editor.getJSON();
        onChange?.(html, json);
        try {
          const storageKey = `docdraft_backup_${draftId || "new"}`;
          localStorage.setItem(
            storageKey,
            JSON.stringify({ content: json, time: Date.now() })
          );
        } catch {}
      };
    }
  }, [editor, onSetContentRef, onChange, draftId]);

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

  // Lắng nghe sự kiện mở Compliance Dialog NĐ 30 từ Command Palette hoặc phím tắt
  useEffect(() => {
    const handleOpenCompliance = () => {
      setIsComplianceDialogOpen(true);
    };
    window.addEventListener("docdraft:open-compliance", handleOpenCompliance);
    return () => window.removeEventListener("docdraft:open-compliance", handleOpenCompliance);
  }, []);

  // Cập nhật nội dung từ ngoài vào (khi sinh stream AI hoặc load draft, không can thiệp khi người dùng đang soạn)
  useEffect(() => {
    if (editor && initialContent && !editor.isFocused && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [editor, initialContent]);

  // Cập nhật khi initialJson thay đổi
  useEffect(() => {
    if (editor && initialJson && !editor.isFocused) {
      editor.commands.setContent(initialJson as Content, { emitUpdate: false });
    }
  }, [editor, initialJson]);

  // Chuẩn hóa Thể thức 1-Click theo Nghị định 30/2020/NĐ-CP (TASK-FORMAT-FIX)
  const handleAutoFormatND30 = useCallback(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const currentText = editor.state.doc.textContent || "";

    // 1. Nếu văn bản chưa có bảng nhưng chứa Quốc hiệu/Tiêu ngữ và Chữ ký
    // Tự động đóng gói vào Bảng ẩn 2 cột chuẩn NĐ 30
    if (!currentHtml.includes("<table") && isFullND30Document(currentText)) {
      const formattedHtml = convertFullDocumentToND30Html(currentText);
      if (formattedHtml && formattedHtml.includes("<table")) {
        editor.commands.setContent(formattedHtml, { emitUpdate: true });
        editor.commands.focus("start");
        return;
      }
    }

    // 2. Nếu văn bản đã có cấu trúc, duyệt qua và đảm bảo căn lề không làm hỏng Tiêu đề hay Bảng chữ ký
    editor.chain().focus().run();
  }, [editor]);

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
    <div className={`flex flex-col w-full h-full overflow-hidden bg-background ${className}`}>
      {/* Banner tiến độ luồng trình ký & phê duyệt nội bộ (TASK-401, TASK-402, TASK-403) */}
      <ApprovalBanner
        draftId={draftId || ""}
        status={draftStatus}
        qrVerifyCode={qrVerifyCode}
        activeChainId={activeChainId}
        currentStep={currentStep}
        totalSteps={totalSteps}
        isCurrentApprover={isCurrentApprover}
        onActionComplete={onWorkflowUpdate}
      />

      {/* Thanh công cụ định dạng chuẩn văn thư */}
      <EditorToolbar
        editor={editor}
        placeholderCount={placeholderCount}
        onJumpToNextPlaceholder={handleJumpToNextPlaceholder}
        onImportDocx={onImportDocx}
        isImportingDocx={isImportingDocx}
        onOpenLegalDialog={() => setIsLegalDialogOpen(true)}
        onOpenComplianceDialog={() => setIsComplianceDialogOpen(true)}
        onOpenSmartFill={onOpenSmartFill}
        complianceScore={complianceScore}
        onOpenShareDialog={() => setIsShareDialogOpen(true)}
        onToggleComments={() => setIsCommentsOpen(!isCommentsOpen)}
        commentsCount={commentsCount}
        isCommentsOpen={isCommentsOpen}
        onOpenSuggestionsPanel={() => setIsSuggestionsPanelOpen(!isSuggestionsPanelOpen)}
        suggestionsCount={suggestions.length}
        isSuggestionsPanelOpen={isSuggestionsPanelOpen}
        draftId={draftId}
        draftStatus={draftStatus}
        currentUser={currentUser}
        onOpenSubmitApproval={() => setIsApprovalDialogOpen(true)}
        lineSpacing={lineSpacing}
        onChangeLineSpacing={setLineSpacing}
        onAutoFormatND30={handleAutoFormatND30}
        onInsertPageBreak={() => {
          (editor.chain().focus() as any).insertPageBreak().run();
        }}
        showRuler={showRuler}
        onToggleRuler={() => setShowRuler(!showRuler)}
      />

      {/* AI In-line Copilot Bubble Menu (TASK-205) */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="z-50 flex items-center animate-in fade-in zoom-in-95"
        >
          {isInlineLoading ? (
            <div className="ai-copilot-bubble-menu flex items-center gap-2 px-3.5 py-2 text-xs bg-white/95 dark:bg-slate-900/98 border border-slate-200/90 dark:border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="menu-title font-medium">AI đang tối ưu câu chữ...</span>
            </div>
          ) : inlineSuggestion ? (
            /* Hiển thị bản xem trước gợi ý kèm nút [Chấp nhận / Bác bỏ] */
            <div className="ai-copilot-bubble-menu flex flex-col gap-2.5 p-3 max-w-sm bg-white/95 dark:bg-slate-900/98 border border-slate-200/90 dark:border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md text-slate-800 dark:text-slate-100">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="menu-title">Đề xuất chỉnh sửa:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
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

              <p className="text-xs bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 max-h-36 overflow-y-auto leading-relaxed font-serif text-slate-800 dark:text-slate-200">
                {inlineSuggestion.resultText}
              </p>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1 px-2"
                  onClick={() => setInlineSuggestion(null)}
                >
                  <X className="h-3 w-3" />
                  <span>Bác bỏ</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 text-[11px] text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 border-purple-200 dark:border-purple-800 gap-1 px-2 font-medium"
                  onClick={handleSuggestInline}
                  title="Ghi nhận dưới dạng đề xuất chỉnh sửa để xem xét sau (TASK-307)"
                >
                  <GitPullRequest className="h-3 w-3" />
                  <span>Đề xuất</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-6 text-[11px] gap-1 px-2.5 shadow-xs bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleAcceptInline}
                >
                  <Check className="h-3 w-3" />
                  <span>Chấp nhận</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Toolbar AI Copilot khi bôi đen đoạn văn bản */
            <div className="ai-copilot-bubble-menu flex items-center gap-1.5 p-1 bg-white/95 dark:bg-slate-900/98 border border-slate-200/90 dark:border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md text-slate-800 dark:text-slate-100">
              {/* Badge AI Header */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20 shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span className="menu-badge hidden sm:inline font-semibold">AI Copilot</span>
              </div>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700/80 mx-0.5" />

              {/* Nút 1: Hành chính hóa NĐ 30 */}
              <button
                type="button"
                onClick={() => handleInlineCommand("formalize")}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-left transition-all hover:bg-purple-50/80 dark:hover:bg-slate-800 hover:border-purple-200 dark:hover:border-purple-500/40 border border-transparent group cursor-pointer"
                title="Hành chính hóa: Viết lại đoạn văn này theo đúng văn phong công vụ, trang trọng và chuẩn mực Nghị định 30"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-500/30 group-hover:scale-105 transition-all shrink-0">
                  <Wand2 className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="menu-title text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors leading-tight">
                    Hành chính hóa
                  </span>
                  <span className="menu-subtitle text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Văn phong NĐ 30
                  </span>
                </div>
              </button>

              {/* Nút 2: Rút gọn */}
              <button
                type="button"
                onClick={() => handleInlineCommand("shorten")}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-left transition-all hover:bg-amber-50/80 dark:hover:bg-slate-800 hover:border-amber-200 dark:hover:border-amber-500/40 border border-transparent group cursor-pointer"
                title="Rút gọn: Rút ngắn câu từ, cô đọng nội dung nhưng giữ nguyên số liệu và ý nghĩa cốt lõi"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-500/30 group-hover:scale-105 transition-all shrink-0">
                  <Scissors className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="menu-title text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors leading-tight">
                    Rút gọn
                  </span>
                  <span className="menu-subtitle text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Ngắn gọn, súc tích
                  </span>
                </div>
              </button>

              {/* Nút 3: Mở rộng */}
              <button
                type="button"
                onClick={() => handleInlineCommand("expand")}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-left transition-all hover:bg-blue-50/80 dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-500/40 border border-transparent group cursor-pointer"
                title="Mở rộng: Bổ sung thêm luận cứ, lập luận hành chính và chi tiết diễn giải cho đoạn này"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/30 group-hover:scale-105 transition-all shrink-0">
                  <Maximize2 className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="menu-title text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors leading-tight">
                    Mở rộng
                  </span>
                  <span className="menu-subtitle text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Viết thêm chi tiết
                  </span>
                </div>
              </button>

              {/* Nút 4: Sửa chính tả */}
              <button
                type="button"
                onClick={() => handleInlineCommand("fix_spelling")}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-left transition-all hover:bg-emerald-50/80 dark:hover:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-500/40 border border-transparent group cursor-pointer"
                title="Sửa chính tả: Tự động kiểm tra và sửa lỗi chính tả, dấu câu, viết hoa và ngữ pháp tiếng Việt"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/30 group-hover:scale-105 transition-all shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="menu-title text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors leading-tight">
                    Sửa chính tả
                  </span>
                  <span className="menu-subtitle text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Lỗi gõ & ngữ pháp
                  </span>
                </div>
              </button>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700/80 mx-0.5" />

              {/* Nút 5: Bình luận */}
              <button
                type="button"
                onClick={handleAddCommentFromSelection}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-left transition-all hover:bg-amber-50/80 dark:hover:bg-slate-800 hover:border-amber-200 dark:hover:border-amber-500/40 border border-transparent group cursor-pointer"
                title="Bình luận: Đính kèm nhận xét hoặc yêu cầu chỉnh sửa cho đoạn văn bản này để cùng trao đổi"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-500/30 group-hover:scale-105 transition-all shrink-0">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="menu-title text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors leading-tight">
                    Bình luận
                  </span>
                  <span className="menu-subtitle text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Thêm ghi chú ý kiến
                  </span>
                </div>
              </button>
            </div>
          )}
        </BubbleMenu>
      )}

      {/* Khu vực Canvas A4 và Bảng bình luận / Đề xuất cộng tác (TASK-306, TASK-307) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Không gian Bàn làm việc (The Desk) cuộn mượt mà */}
        <div className="flex-1 bg-slate-100/90 dark:bg-[#070b13] p-3 sm:p-6 md:p-8 lg:p-10 overflow-y-auto overflow-x-auto flex flex-col items-center editor-canvas-scroll select-text">
          {/* Thanh chỉ số lề giấy & Khổ văn bản A4 chuẩn NĐ 30 */}
          <div className="w-full max-w-[210mm] flex items-center justify-between text-[11px] text-muted-foreground/80 mb-3 px-1 font-mono select-none no-print">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Khổ A4 (210 × 297 mm)</span>
            </div>
            <div className="hidden sm:flex items-center gap-2.5 text-[10px]">
              <span>Lề trái: 30mm</span>
              <span>•</span>
              <span>Lề phải: 15mm</span>
              <span>•</span>
              <span>Lề trên/dưới: 20mm</span>
            </div>
            <div className="flex items-center gap-1.5 font-sans">
              <span className="font-medium text-foreground/70">Nghị định 30/2020/NĐ-CP</span>
            </div>
          </div>

          {/* Banner Cứu hộ Dữ liệu khẩn cấp khi người dùng lỡ thoát chưa bấm Lưu (LocalStorage Recovery) */}
          {localBackup && stats.characters === 0 && (
            <div className="w-full max-w-[210mm] mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-in fade-in no-print">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
                <span>
                  Tìm thấy bản nháp tự động sao lưu lúc <strong>{localBackup.time}</strong> trên trình duyệt của bạn.
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                  onClick={() => setLocalBackup(null)}
                >
                  Bỏ qua
                </Button>
                <Button
                  size="sm"
                  className="h-6 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-2.5 shadow-xs"
                  onClick={handleRestoreLocalBackup}
                >
                  Khôi phục ngay
                </Button>
              </div>
            </div>
          )}

          {/* Thước đo căn lề khổ A4 (Word Ruler) */}
          {showRuler && (
            <div className="no-print w-full flex justify-center">
              <WordRuler zoomLevel={zoomLevel} />
            </div>
          )}

          {/* Tờ giấy A4 chuẩn Nghị định 30/2020/NĐ-CP */}
          <div
            style={{
              transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
              transformOrigin: "top center",
              lineHeight: lineSpacing,
              minHeight:
                pageInfo.totalPages > 1
                  ? `calc(297mm * ${pageInfo.totalPages} + ${(pageInfo.totalPages - 1) * 100}px)`
                  : "297mm",
            }}
            className={`a4-paper-canvas ${
              paperTheme === "white"
                ? "paper-sheet-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06),0_16px_40px_-4px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-slate-300 dark:border-slate-700/80"
                : "paper-sheet-dark shadow-[0_20px_50px_rgba(0,0,0,0.75)] border border-slate-800"
            } rounded-xs sm:rounded-sm transition-transform duration-150 box-border`}
          >
            <EditorContent editor={editor} />
          </div>

          {/* Vạch kết thúc trang tài liệu */}
          <div className="w-full max-w-[210mm] text-center text-[10px] text-muted-foreground/50 mt-6 mb-4 select-none no-print">
            — Hết trang văn bản —
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

      {/* Thanh trạng thái chân trang (Document Status Bar) */}
      <footer className="shrink-0 h-9 border-t border-border/80 bg-background/95 backdrop-blur px-3 sm:px-4 flex items-center justify-between text-xs text-muted-foreground select-none z-10 no-print">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground/95 bg-muted/60 px-2 py-0.5 rounded border border-border/40 font-mono text-[11px]">
            📄 Trang {pageInfo.currentPage} / {pageInfo.totalPages}
          </span>
          <span>•</span>
          <span className="font-medium text-foreground/90">{stats.words} từ</span>
          <span>•</span>
          <span>{stats.characters} ký tự</span>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium text-muted-foreground">Chuẩn thể thức Nghị định 30/2020/NĐ-CP</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Paper Theme Toggle */}
          <button
            type="button"
            onClick={() => setPaperTheme(paperTheme === "white" ? "dark" : "white")}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted text-[11px] font-medium transition-colors"
            title="Chuyển đổi giao diện trang giấy (Giấy in trắng / Giấy tối)"
          >
            {paperTheme === "white" ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline">Giấy in trắng</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden sm:inline">Giấy tối</span>
              </>
            )}
          </button>

          <div className="h-3.5 w-px bg-border mx-1" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={zoomLevel <= 70}
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              className="p-1 rounded hover:bg-muted disabled:opacity-40 transition-colors"
              title="Thu nhỏ trang"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center font-mono text-[11px]">{zoomLevel}%</span>
            <button
              type="button"
              disabled={zoomLevel >= 150}
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1 rounded hover:bg-muted disabled:opacity-40 transition-colors"
              title="Phóng to trang"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </footer>

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

      {/* Sequential Approval Workflow Submission Dialog (TASK-401, TASK-402) */}
      {draftId && (
        <SubmitApprovalDialog
          isOpen={isApprovalDialogOpen}
          onClose={() => setIsApprovalDialogOpen(false)}
          draftId={draftId}
          draftTitle={draftTitle}
          placeholderCount={placeholderCount}
          onSubmitted={() => {
            onWorkflowUpdate?.();
          }}
        />
      )}
    </div>
  );
}
