"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
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

export interface TiptapEditorProps {
  initialContent?: string;
  onChange?: (html: string, json: object) => void;
  editable?: boolean;
  className?: string;
}

/**
 * Trình soạn thảo A4 Canvas Editor chuẩn Nghị định 30/2020/NĐ-CP (TASK-110, TASK-111, TASK-112).
 * Kích thước trang A4 thực tế (210mm x 297mm), viền lề chuẩn (trên 20mm, dưới 20mm, trái 30mm, phải 15mm),
 * Font chữ chuẩn Times New Roman, hỗ trợ bảng ẩn 2 cột và nhận diện placeholder an toàn [...].
 */
export function TiptapEditor({
  initialContent = "",
  onChange,
  editable = true,
  className = "",
}: TiptapEditorProps) {
  const [placeholderCount, setPlaceholderCount] = useState(0);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);

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
    },
  });

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

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {/* Thanh công cụ Rich Toolbar */}
      <EditorToolbar
        editor={editor}
        placeholderCount={placeholderCount}
        onJumpToNextPlaceholder={handleJumpToNextPlaceholder}
      />

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
    </div>
  );
}
