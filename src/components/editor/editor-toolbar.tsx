"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface EditorToolbarProps {
  editor: Editor | null;
  placeholderCount: number;
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
}

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
}: EditorToolbarProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!editor) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportDocx?.(file);
      // Reset input value so same file can be selected again
      e.target.value = "";
    }
  };

  return (
    <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-1.5 border-b bg-background/95 px-4 py-2 backdrop-blur shadow-xs">
      {/* Group 1: History Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Hoàn tác (Ctrl+Z)"
          className="h-8 w-8"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Làm lại (Ctrl+Y)"
          className="h-8 w-8"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-5 w-px bg-border mx-0.5" />

      {/* Group 2: Headings & Paragraph */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={editor.isActive("paragraph") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className="h-8 text-xs font-serif px-2.5"
          title="Đoạn văn thông thường"
        >
          Văn bản
        </Button>

        <Button
          type="button"
          variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="h-8 text-xs font-bold px-2"
          title="Tiêu đề cấp 1"
        >
          H1
        </Button>

        <Button
          type="button"
          variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="h-8 text-xs font-bold px-2"
          title="Tiêu đề cấp 2 (Tên loại văn bản)"
        >
          H2
        </Button>
      </div>

      <div className="h-5 w-px bg-border mx-0.5" />

      {/* Group 3: Text Formatting */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8"
          title="In đậm (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8"
          title="In nghiêng (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-8 w-8"
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="h-8 w-8"
          title="Gạch ngang chữ"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-5 w-px bg-border mx-0.5" />

      {/* Group 4: Text Align */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className="h-8 w-8"
          title="Căn lề trái"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className="h-8 w-8"
          title="Căn giữa"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className="h-8 w-8"
          title="Căn lề phải"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: "justify" }) ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className="h-8 w-8"
          title="Căn đều hai bên (Justify)"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-5 w-px bg-border mx-0.5" />

      {/* Group 5: Lists */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8"
          title="Danh sách gạch đầu dòng"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8"
          title="Danh sách đánh số"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-5 w-px bg-border mx-0.5" />

      {/* Group 6: ND30 & Table Menu */}
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <TableIcon className="h-3.5 w-3.5" />
              <span>Bảng & NĐ 30</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem
              onClick={() => editor.commands.insertND30HeaderTable()}
              className="gap-2 cursor-pointer"
            >
              <Columns2 className="h-4 w-4 text-primary" />
              <div>
                <div className="font-semibold text-xs">Bảng Tiêu ngữ (40/60)</div>
                <div className="text-[10px] text-muted-foreground">Quốc hiệu, Tiêu ngữ chuẩn NĐ 30</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => editor.commands.insertND30SignatureTable()}
              className="gap-2 cursor-pointer"
            >
              <Columns2 className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="font-semibold text-xs">Bảng Chữ ký (50/50)</div>
                <div className="text-[10px] text-muted-foreground">Nơi nhận & Chữ ký người có thẩm quyền</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
              className="gap-2 cursor-pointer text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Chèn bảng dữ liệu (3x3)</span>
            </DropdownMenuItem>

            {editor.can().deleteTable() && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="text-xs gap-2"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm hàng dưới
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="text-xs gap-2"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm cột phải
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className="text-xs gap-2 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa hàng
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  className="text-xs gap-2 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa cột
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="text-xs gap-2 text-destructive font-semibold"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa toàn bộ bảng
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Group 7: Import .docx (TASK-207) */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".docx"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isImportingDocx}
        className="h-8 text-xs gap-1.5 text-primary hover:bg-primary/10"
        title="Tải lên tệp Word (.docx) để bóc tách thành văn bản (Nghị định 30)"
      >
        {isImportingDocx ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : (
          <Upload className="h-3.5 w-3.5 text-primary" />
        )}
        <span className="hidden sm:inline">
          {isImportingDocx ? "Đang đọc Word..." : "Nhập Word (.docx)"}
        </span>
      </Button>

      {/* Group 8: Legal RAG Autocomplete (TASK-210, TASK-211) */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onOpenLegalDialog}
        className="h-8 text-xs gap-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
        title="Tra cứu & Gợi ý Căn cứ Pháp lý (Nghị định 30, Luật, Thông tư)"
      >
        <Scale className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="hidden sm:inline">Căn cứ pháp lý</span>
      </Button>

      {/* Group 9: Compliance Rules Engine NĐ 30 (TASK-301, TASK-302) */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onOpenComplianceDialog}
        className="h-8 text-xs gap-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
        title="Soát lỗi Thể thức & Tự động sửa 1-Click theo Nghị định 30/2020/NĐ-CP"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="hidden sm:inline">Soát lỗi NĐ 30</span>
        {typeof complianceScore === "number" && (
          <span className="ml-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
            {complianceScore}đ
          </span>
        )}
      </Button>

      {/* Group 10: Shared Links (TASK-305) */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onOpenShareDialog}
        className="h-8 text-xs gap-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 font-semibold"
        title="Tạo liên kết chia sẻ bảo mật có mật khẩu & phân quyền"
      >
        <Share2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span className="hidden sm:inline">Chia sẻ</span>
      </Button>

      {/* Group 11: In-context Comments (TASK-306) */}
      <Button
        type="button"
        variant={isCommentsOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={onToggleComments}
        className="h-8 text-xs gap-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-semibold"
        title="Bình luận theo ngữ cảnh & cộng tác trao đổi (TASK-306)"
      >
        <MessageSquare className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="hidden sm:inline">Bình luận</span>
        {typeof commentsCount === "number" && commentsCount > 0 && (
          <span className="ml-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:text-amber-300">
            {commentsCount}
          </span>
        )}
      </Button>

      {/* Group 12: Suggestion Mode (TASK-307) */}
      <Button
        type="button"
        variant={isSuggestionsPanelOpen || isSuggestionMode ? "secondary" : "ghost"}
        size="sm"
        onClick={onOpenSuggestionsPanel}
        className="h-8 text-xs gap-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-semibold"
        title="Bảng Đề xuất chỉnh sửa & Theo dõi sửa đổi Track Changes (TASK-307)"
      >
        <GitPullRequest className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
        <span className="hidden sm:inline">Đề xuất</span>
        {typeof suggestionsCount === "number" && suggestionsCount > 0 && (
          <span className="ml-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 px-1.5 py-0.2 text-[10px] font-bold text-purple-800 dark:text-purple-300">
            {suggestionsCount}
          </span>
        )}
      </Button>

      {/* Group 13: Safe Placeholders [...] Navigator (TASK-112) */}
      <div className="ml-auto flex items-center gap-2">
        {placeholderCount > 0 ? (
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="font-medium">
              Còn <strong>{placeholderCount}</strong> trường [...]
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onJumpToNextPlaceholder}
              className="h-6 px-1.5 text-xs text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 gap-1"
              title="Đi tới trường [...] tiếp theo"
            >
              <span>Điền</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Đầy đủ 100% dữ liệu</span>
          </div>
        )}
      </div>
    </div>
  );
}
