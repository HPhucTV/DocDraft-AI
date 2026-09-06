"use client";

import React, { useState } from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Table as TableIcon,
  Plus,
  Trash2,
  ArrowRight,
  AlertTriangle,
  Columns2,
  Upload,
  Loader2,
  Scale,
  ShieldCheck,
  Share2,
  MessageSquare,
  GitPullRequest,
  Send,
  ChevronDown,
  Check,
  MoreHorizontal,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Layers,
  Sparkles,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Baseline,
  Eraser,
  Indent,
  Outdent,
  Minus,
  FilePlus2,
  Ruler,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AIFeedbackWidget } from "./ai-feedback-widget";
import { CollaborativePresenceBar } from "./collaborative-presence-bar";

interface EditorToolbarProps {
  editor: Editor | null;
  placeholderCount: number;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  onJumpToNextPlaceholder: () => void;
  onImportDocx?: (file: File) => void;
  isImportingDocx?: boolean;
  onOpenLegalDialog?: () => void;
  onOpenComplianceDialog?: () => void;
  complianceScore?: number;
  onOpenShareDialog?: () => void;
  onToggleComments?: () => void;
  commentsCount?: number;
  isCommentsOpen?: boolean;
  isSuggestionMode?: boolean;
  onToggleSuggestionMode?: () => void;
  onOpenSuggestionsPanel?: () => void;
  suggestionsCount?: number;
  isSuggestionsPanelOpen?: boolean;
  draftId?: string;
  draftStatus?: string;
  onOpenSubmitApproval?: () => void;
  lineSpacing?: number;
  onChangeLineSpacing?: (spacing: number) => void;
  onAutoFormatND30?: () => void;
  onInsertPageBreak?: () => void;
  showRuler?: boolean;
  onToggleRuler?: () => void;
}

const FONT_FAMILIES = [
  { label: "Times New Roman (Chuẩn NĐ 30)", value: "Times New Roman" },
  { label: "Arial", value: "Arial" },
  { label: "Calibri", value: "Calibri" },
  { label: "Roboto", value: "Roboto" },
];

const FONT_SIZES = [
  { label: "11pt", value: "11pt" },
  { label: "12pt", value: "12pt" },
  { label: "13pt (Chuẩn NĐ 30)", value: "13pt" },
  { label: "14pt (Chuẩn NĐ 30)", value: "14pt" },
  { label: "16pt", value: "16pt" },
  { label: "18pt", value: "18pt" },
  { label: "20pt", value: "20pt" },
  { label: "24pt", value: "24pt" },
];

const TEXT_COLORS = [
  { label: "Đen", value: "#000000" },
  { label: "Xám đen", value: "#334155" },
  { label: "Đỏ đậm", value: "#dc2626" },
  { label: "Xanh lam", value: "#2563eb" },
  { label: "Xanh lá", value: "#16a34a" },
  { label: "Vàng kim", value: "#d97706" },
  { label: "Tím", value: "#9333ea" },
];

const HIGHLIGHT_COLORS = [
  { label: "Không màu", value: "" },
  { label: "Vàng dạ quang", value: "#fef08a" },
  { label: "Xanh lục nhạt", value: "#bbf7d0" },
  { label: "Xanh lam nhạt", value: "#bae6fd" },
  { label: "Hồng nhạt", value: "#fbcfe8" },
  { label: "Cam nhạt", value: "#fed7aa" },
];

/**
 * Modern Office 365 Tabbed Ribbon Toolbar chuẩn Microsoft Word & Nghị định 30/2020/NĐ-CP.
 * Gồm 4 Tab:
 * 1. Trang chủ (Home): Phông chữ, Cỡ chữ, Định dạng, Đoạn văn, Căn lề, Kiểu văn bản, Thêm trang mới.
 * 2. Chèn (Insert): Thêm trang (Page Break), Bảng NĐ 30, Kẻ ngang, Nhập tệp Word, Ký tự đặc biệt.
 * 3. Bố cục & NĐ 30 (Layout): Căn lề A4, Hướng giấy, Thước kẻ (Ruler), Chuẩn hóa 1-Click, Soát lỗi.
 * 4. Xem lại (Review): Đề xuất (Track changes), Bình luận, Trình ký, Rà soát [...], Thống kê.
 */
export function EditorToolbar({
  editor,
  placeholderCount,
  onJumpToNextPlaceholder,
  onImportDocx,
  isImportingDocx = false,
  onOpenLegalDialog,
  onOpenComplianceDialog,
  complianceScore,
  onOpenShareDialog,
  onToggleComments,
  commentsCount,
  isCommentsOpen,
  isSuggestionMode,
  onOpenSuggestionsPanel,
  suggestionsCount,
  isSuggestionsPanelOpen,
  draftId,
  draftStatus,
  currentUser,
  onOpenSubmitApproval,
  lineSpacing = 1.25,
  onChangeLineSpacing,
  onAutoFormatND30,
  onInsertPageBreak,
  showRuler = true,
  onToggleRuler,
}: EditorToolbarProps) {
  const [activeTab, setActiveTab] = useState<"home" | "insert" | "layout" | "review">("home");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!editor) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportDocx) {
      onImportDocx(file);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  // Hàm tăng/giảm cỡ chữ nhanh
  const handleGrowFont = () => {
    editor.chain().focus().setFontSize("14pt").run();
  };

  const handleShrinkFont = () => {
    editor.chain().focus().setFontSize("12pt").run();
  };

  // Xóa toàn bộ định dạng (Clear Formatting)
  const handleClearFormatting = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  };

  // Thêm trang mới (Page Break)
  const handlePageBreak = () => {
    if (onInsertPageBreak) {
      onInsertPageBreak();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor.chain().focus() as any).insertPageBreak().run();
    }
  };

  return (
    <div className="border-b bg-background select-none shrink-0 shadow-2xs">
      {/* 1. Thanh Tab Ribbon chuẩn Microsoft Word (Office 365) */}
      <div className="flex items-center gap-1 px-3 pt-1 border-b border-border/40 bg-muted/20 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className={`px-3 py-1.5 font-medium rounded-t-md transition-all relative ${
            activeTab === "home"
              ? "bg-background text-primary font-semibold shadow-2xs border-t border-x border-border/60 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          Trang chủ
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("insert")}
          className={`px-3 py-1.5 font-medium rounded-t-md transition-all relative ${
            activeTab === "insert"
              ? "bg-background text-primary font-semibold shadow-2xs border-t border-x border-border/60 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          Chèn
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("layout")}
          className={`px-3 py-1.5 font-medium rounded-t-md transition-all relative ${
            activeTab === "layout"
              ? "bg-background text-primary font-semibold shadow-2xs border-t border-x border-border/60 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          Bố cục & Thể thức NĐ 30
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("review")}
          className={`px-3 py-1.5 font-medium rounded-t-md transition-all relative ${
            activeTab === "review"
              ? "bg-background text-primary font-semibold shadow-2xs border-t border-x border-border/60 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          Xem lại & Phê duyệt
        </button>

        {/* Nút hành động nhanh bên phải Ribbon */}
        <div className="ml-auto flex items-center gap-1.5 pb-1">
          <CollaborativePresenceBar
            draftId={draftId}
            currentUser={currentUser || { id: "user-current", name: "Bạn", email: "user@docdraft.vn", role: "USER" }}
            onShareClick={onOpenShareDialog}
          />

          {onAutoFormatND30 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAutoFormatND30}
              className="h-6.5 gap-1.5 text-xs font-semibold bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 px-2 shadow-2xs"
              title="Tự động căn lề đều 2 bên, thụt đầu dòng 1.2cm và giãn dòng chuẩn NĐ 30"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              <span>⚡ Chuẩn hóa NĐ 30</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePageBreak}
            className="h-6.5 gap-1.5 text-xs font-semibold border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 shadow-2xs cursor-pointer"
            title="Thêm 1 trang giấy A4 mới vào tài liệu (Phím tắt: Ctrl+Enter)"
          >
            <FilePlus2 className="h-3.5 w-3.5" />
            <span>➕ Thêm trang A4</span>
          </Button>
        </div>
      </div>

      {/* 2. Nội dung các Nhóm Công cụ (Ribbon Command Center) */}
      <div className="p-1.5 flex items-center gap-1 overflow-x-auto touch-scroll-x text-xs">
        {/* ========================================================================= */}
        {/* TAB 1: TRANG CHỦ (HOME)                                                  */}
        {/* ========================================================================= */}
        {activeTab === "home" && (
          <div className="flex items-center gap-1 flex-nowrap w-full">
            {/* Nhóm Undo / Redo */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-border/60">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="h-7 w-7"
                title="Hoàn tác (Ctrl+Z)"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="h-7 w-7"
                title="Làm lại (Ctrl+Y)"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearFormatting}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Xóa định dạng (Clear Formatting)"
              >
                <Eraser className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Nhóm Phông chữ (Font Family & Font Size) */}
            <div className="flex items-center gap-1 pr-1 border-r border-border/60">
              {/* Chọn Font Family */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs font-serif min-w-[130px] justify-between border border-border/40 hover:bg-muted"
                    title="Chọn phông chữ văn bản"
                  >
                    <span className="truncate">Times New Roman</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 text-xs font-serif">
                  <DropdownMenuLabel className="text-[11px] font-sans text-muted-foreground">
                    Phông chữ gợi ý
                  </DropdownMenuLabel>
                  {FONT_FAMILIES.map((font) => (
                    <DropdownMenuItem
                      key={font.value}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onClick={() => (editor.chain().focus() as any).setFontFamily(font.value).run()}
                      className="cursor-pointer flex items-center justify-between"
                      style={{ fontFamily: font.value }}
                    >
                      <span>{font.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Chọn Font Size */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-1.5 text-xs min-w-[58px] justify-between border border-border/40 hover:bg-muted font-mono"
                    title="Cỡ chữ văn bản (Chuẩn NĐ 30: 13pt hoặc 14pt)"
                  >
                    <span>13pt</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36 text-xs">
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                    Cỡ chữ chuẩn NĐ 30
                  </DropdownMenuLabel>
                  {FONT_SIZES.map((size) => (
                    <DropdownMenuItem
                      key={size.value}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onClick={() => (editor.chain().focus() as any).setFontSize(size.value).run()}
                      className="cursor-pointer font-mono"
                    >
                      <span>{size.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Tăng / Giảm cỡ chữ (A+ / A-) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGrowFont}
                className="h-7 w-7 text-xs font-bold"
                title="Tăng cỡ chữ (A+)"
              >
                A<span className="text-[9px] font-bold relative -top-1">+</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShrinkFont}
                className="h-7 w-7 text-xs font-bold"
                title="Giảm cỡ chữ (A-)"
              >
                A<span className="text-[9px] font-bold relative -top-1">-</span>
              </Button>
            </div>

            {/* Nhóm B / I / U / S & Chỉ số trên / dưới */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-border/60">
              <Button
                variant={editor.isActive("bold") ? "secondary" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className="h-7 w-7 font-bold"
                title="In đậm (Ctrl+B)"
              >
                <Bold className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant={editor.isActive("italic") ? "secondary" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className="h-7 w-7 italic"
                title="In nghiêng (Ctrl+I)"
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant={editor.isActive("underline") ? "secondary" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className="h-7 w-7"
                title="Gạch chân (Ctrl+U)"
              >
                <UnderlineIcon className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant={editor.isActive("strike") ? "secondary" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className="h-7 w-7"
                title="Gạch ngang chữ"
              >
                <Strikethrough className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant={editor.isActive("subscript") ? "secondary" : "ghost"}
                size="icon"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => (editor.chain().focus() as any).toggleSubscript().run()}
                className="h-7 w-7 text-[11px] font-bold font-mono"
                title="Chỉ số dưới (X₂, phím tắt: Ctrl+=)"
              >
                X<span className="text-[9px] relative top-1">2</span>
              </Button>

              <Button
                variant={editor.isActive("superscript") ? "secondary" : "ghost"}
                size="icon"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => (editor.chain().focus() as any).toggleSuperscript().run()}
                className="h-7 w-7 text-[11px] font-bold font-mono"
                title="Chỉ số trên (X², phím tắt: Ctrl+Shift+=)"
              >
                X<span className="text-[9px] relative -top-1">2</span>
              </Button>
            </div>

            {/* Nhóm Màu chữ & Màu dạ quang */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-border/60">
              {/* Màu chữ (Font Color) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-1.5 flex flex-col items-center justify-center relative hover:bg-muted"
                    title="Màu chữ (Font Color)"
                  >
                    <span className="text-xs font-bold leading-none">A</span>
                    <span className="w-3.5 h-0.5 bg-red-600 rounded-full" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36 p-2 text-xs">
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground">Màu chữ</DropdownMenuLabel>
                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {TEXT_COLORS.map((col) => (
                      <button
                        key={col.value}
                        type="button"
                        style={{ backgroundColor: col.value }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={() => (editor.chain().focus() as any).setTextColor(col.value).run()}
                        className="h-5 w-5 rounded-full border border-border/40 hover:scale-110 transition-transform shadow-2xs"
                        title={col.label}
                      />
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Màu dạ quang (Highlight) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={editor.isActive("highlight") ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 gap-1 px-1.5 hover:bg-muted"
                    title="Màu tô dạ quang (Text Highlight)"
                  >
                    <Highlighter className="h-3.5 w-3.5 text-amber-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36 p-2 text-xs">
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground">Màu tô sáng</DropdownMenuLabel>
                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    {HIGHLIGHT_COLORS.map((h) => (
                      <button
                        key={h.label}
                        type="button"
                        style={{ backgroundColor: h.value || "#ffffff" }}
                        onClick={() => {
                          if (!h.value) {
                            editor.chain().focus().unsetHighlight().run();
                          } else {
                            editor.chain().focus().setHighlight({ color: h.value }).run();
                          }
                        }}
                        className="h-5 rounded border border-border/60 hover:scale-105 transition-transform text-[8px] flex items-center justify-center font-medium shadow-2xs"
                        title={h.label}
                      >
                        {!h.value ? "Xóa" : ""}
                      </button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Nhóm Đoạn văn & Căn lề */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-border/60">
              <Button
                variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                className="h-7 w-7"
                title="Căn lề trái"
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                className="h-7 w-7"
                title="Căn giữa (Tiêu đề, Quốc hiệu, Chữ ký)"
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant={editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                className="h-7 w-7"
                title="Căn lề phải"
              >
                <AlignRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant={editor.isActive({ textAlign: "justify" }) ? "secondary" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                className="h-7 w-7 text-primary font-semibold"
                title="Căn đều 2 bên (Justify - Chuẩn NĐ 30/2020/NĐ-CP)"
              >
                <AlignJustify className="h-3.5 w-3.5" />
              </Button>

              {/* Giãn dòng */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-1.5 text-xs hover:bg-muted font-mono"
                    title="Khoảng cách dòng (Line Spacing)"
                  >
                    <span>{lineSpacing}x</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40 text-xs">
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground">Khoảng cách dòng</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onChangeLineSpacing?.(1.0)} className="cursor-pointer">
                    1.0x (Đơn)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onChangeLineSpacing?.(1.15)} className="cursor-pointer">
                    1.15x
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onChangeLineSpacing?.(1.25)}
                    className="cursor-pointer font-semibold text-primary"
                  >
                    1.25x (Chuẩn NĐ 30)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onChangeLineSpacing?.(1.35)} className="cursor-pointer">
                    1.35x (Nghị định 30)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onChangeLineSpacing?.(1.5)} className="cursor-pointer">
                    1.5x (Rộng)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Bullet / Numbered Lists */}
              <Button
                variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className="h-7 w-7"
                title="Danh sách dấu chấm"
              >
                <List className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
                size="icon"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className="h-7 w-7"
                title="Danh sách số"
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Phân cấp Văn bản (Styles) */}
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs border border-border/40 hover:bg-muted"
                    title="Chọn kiểu đoạn văn"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {editor.isActive("heading", { level: 1 })
                        ? "Tiêu đề 1"
                        : editor.isActive("heading", { level: 2 })
                        ? "Tiêu đề 2"
                        : editor.isActive("heading", { level: 3 })
                        ? "Tiêu đề 3"
                        : "Văn bản"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40 text-xs">
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    className="cursor-pointer"
                  >
                    Văn bản thường
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className="cursor-pointer font-bold text-base"
                  >
                    Tiêu đề 1 (H1)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className="cursor-pointer font-bold text-sm"
                  >
                    Tiêu đề 2 (H2)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className="cursor-pointer font-semibold text-xs"
                  >
                    Tiêu đề 3 (H3)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CHÈN (INSERT)                                                     */}
        {/* ========================================================================= */}
        {activeTab === "insert" && (
          <div className="flex items-center gap-2 flex-nowrap w-full">
            {/* Nhóm Trang */}
            <div className="flex items-center gap-1 pr-2 border-r border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePageBreak}
                className="h-7 gap-1.5 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                title="Chèn thêm 1 trang giấy A4 mới vào tài liệu (Phím tắt: Ctrl+Enter)"
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                <span>➕ Thêm trang A4 mới</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="h-7 gap-1 text-xs hover:bg-muted"
                title="Đường phân cách ngang"
              >
                <Minus className="h-3.5 w-3.5" />
                <span>Đường kẻ ngang</span>
              </Button>
            </div>

            {/* Nhóm Bảng Biểu & Mẫu NĐ 30 */}
            <div className="flex items-center gap-1 pr-2 border-r border-border/60">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs font-medium border-border/80 hover:bg-muted"
                    title="Chèn bảng biểu hoặc bảng chuẩn Nghị định 30"
                  >
                    <TableIcon className="h-3.5 w-3.5 text-primary" />
                    <span>Bảng & Thể thức NĐ 30</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60 text-xs">
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground font-semibold">
                    Bố cục Bảng ẩn NĐ 30/2020/NĐ-CP
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => editor.commands.insertND30HeaderTable()}
                    className="cursor-pointer gap-2 font-medium"
                  >
                    <Columns2 className="h-3.5 w-3.5 text-primary" />
                    <span>Bảng Tiêu ngữ & Quốc hiệu (40/60)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.commands.insertND30SignatureTable()}
                    className="cursor-pointer gap-2 font-medium"
                  >
                    <Columns2 className="h-3.5 w-3.5 text-primary" />
                    <span>Bảng Nơi nhận & Chữ ký (50/50)</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground font-semibold">
                    Bảng Dữ liệu thường
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() =>
                      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                    }
                    className="cursor-pointer gap-2"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Chèn Bảng 3 × 3 (Có dòng tiêu đề)</span>
                  </DropdownMenuItem>

                  {editor.isActive("table") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[11px] text-muted-foreground font-semibold">
                        Thao tác trên bảng hiện tại
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => editor.chain().focus().addRowAfter().run()}
                        className="cursor-pointer gap-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Thêm hàng dưới</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => editor.chain().focus().addColumnAfter().run()}
                        className="cursor-pointer gap-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Thêm cột phải</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => editor.chain().focus().deleteTable().run()}
                        className="cursor-pointer gap-2 text-destructive font-medium"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Xóa bảng này</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Nhóm Tệp tin & Nhập Word */}
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImportingDocx}
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/50"
                title="Nhập văn bản từ tệp Word (.docx)"
              >
                {isImportingDocx ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-blue-500" />
                )}
                <span>Nhập Word (.docx)</span>
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: BỐ CỤC & THỂ THỨC NĐ 30 (LAYOUT)                                  */}
        {/* ========================================================================= */}
        {activeTab === "layout" && (
          <div className="flex items-center gap-2 flex-nowrap w-full">
            {/* Nhóm Căn lề khổ A4 */}
            <div className="flex items-center gap-2 pr-2 border-r border-border/60">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/40 rounded border border-border/50 text-[11px] font-mono">
                <span className="font-semibold text-foreground">Căn lề NĐ 30:</span>
                <span className="text-muted-foreground">Trái 30mm • Phải 15mm • Trên/Dưới 20mm</span>
              </div>
            </div>

            {/* Nhóm Thước đo căn lề (Ruler) */}
            <div className="flex items-center gap-1 pr-2 border-r border-border/60">
              <Button
                variant={showRuler ? "secondary" : "ghost"}
                size="sm"
                onClick={onToggleRuler}
                className="h-7 gap-1.5 text-xs font-medium"
                title="Bật / Tắt thanh thước đo căn lề A4 (Word Ruler)"
              >
                <Ruler className="h-3.5 w-3.5 text-primary" />
                <span>Thước kẻ căn lề</span>
              </Button>
            </div>

            {/* Bộ công cụ Thể thức NĐ 30 */}
            <div className="flex items-center gap-1.5">
              {onAutoFormatND30 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAutoFormatND30}
                  className="h-7 gap-1.5 text-xs font-semibold bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 shadow-2xs"
                  title="Tự động căn đều 2 bên, thụt lề 1.2cm, giãn dòng 1.35x và phông Times New Roman"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>⚡ Chuẩn hóa 1-Click</span>
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenComplianceDialog}
                className="h-7 gap-1.5 text-xs font-semibold hover:bg-emerald-500/10 border-emerald-500/30 text-foreground shadow-2xs"
                title="Soát lỗi Thể thức & Chấm điểm tuân thủ theo NĐ 30/2020/NĐ-CP"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Soát lỗi Thể thức</span>
                {typeof complianceScore === "number" && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      complianceScore >= 90
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : complianceScore >= 70
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {complianceScore}đ
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenLegalDialog}
                className="h-7 gap-1.5 text-xs font-medium hover:bg-blue-500/10 border-blue-500/30 text-foreground"
                title="Tra cứu điều khoản Luật & Nghị định (Legal RAG)"
              >
                <Scale className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Căn cứ pháp lý</span>
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: XEM LẠI & PHÊ DUYỆT (REVIEW)                                      */}
        {/* ========================================================================= */}
        {activeTab === "review" && (
          <div className="flex items-center gap-2 flex-nowrap w-full">
            {/* Nhóm Đề xuất & Bình luận */}
            <div className="flex items-center gap-1.5 pr-2 border-r border-border/60">
              <Button
                type="button"
                variant={isSuggestionMode ? "secondary" : "outline"}
                size="sm"
                onClick={onOpenSuggestionsPanel}
                className={`h-7 gap-1.5 text-xs font-semibold ${
                  isSuggestionMode
                    ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40"
                    : "border-border/80 hover:bg-muted"
                }`}
                title="Chế độ Đề xuất chỉnh sửa (Track Changes)"
              >
                <GitPullRequest className="h-3.5 w-3.5 text-purple-500" />
                <span>Đề xuất</span>
                {(suggestionsCount ?? 0) > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-500 text-white">
                    {suggestionsCount}
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant={isCommentsOpen ? "secondary" : "outline"}
                size="sm"
                onClick={onToggleComments}
                className={`h-7 gap-1.5 text-xs font-semibold ${
                  isCommentsOpen
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                    : "border-border/80 hover:bg-muted"
                }`}
                title="Mở bảng bình luận ngữ cảnh cộng tác"
              >
                <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                <span>Bình luận</span>
                {(commentsCount ?? 0) > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                    {commentsCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Nhóm Trình ký & Thẩm định */}
            <div className="flex items-center gap-1.5 pr-2 border-r border-border/60">
              {draftId && onOpenSubmitApproval && (
                <Button
                  type="button"
                  size="sm"
                  onClick={onOpenSubmitApproval}
                  className="h-7 gap-1.5 text-xs font-semibold bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs px-3"
                  title="Gửi trình ký phê duyệt nội bộ"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Trình ký</span>
                </Button>
              )}
            </div>

            {/* Điều hướng Placeholder [...] an toàn */}
            <div className="flex items-center gap-1">
              {placeholderCount > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onJumpToNextPlaceholder}
                  className="h-7 gap-1.5 text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                  title="Nhảy tới vị trí số liệu chưa nhập [...] tiếp theo để điền thông tin"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span>Còn {placeholderCount} chỗ [...]</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 font-medium">
                  <Check className="h-3.5 w-3.5" />
                  <span>100% Đầy đủ dữ liệu</span>
                </div>
              )}

              {onOpenShareDialog && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenShareDialog}
                  className="h-7 gap-1 text-xs hover:bg-muted ml-1"
                  title="Chia sẻ liên kết"
                >
                  <Share2 className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Chia sẻ</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
