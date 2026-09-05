import { Node, mergeAttributes } from "@tiptap/core";

export interface PageBreakOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      /**
       * Chèn một điểm ngắt trang mới (Page Break)
       */
      insertPageBreak: () => ReturnType;
    };
  }
}

/**
 * Extension Ngắt trang (Page Break) chuẩn Microsoft Word & Nghị định 30/2020/NĐ-CP.
 * Sử dụng thẻ <hr data-page-break="true" /> chuẩn HTML để đảm bảo an toàn tuyệt đối,
 * không bao giờ gây lỗi phân tích AST và không làm mất nội dung tài liệu.
 */
export const PageBreak = Node.create<PageBreakOptions>({
  name: "pageBreak",

  group: "block",

  atom: true,

  selectable: true,

  draggable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      { tag: 'hr[data-page-break="true"]' },
      { tag: "hr.nd30-page-break" },
      { tag: 'div[data-page-break="true"]' },
      { tag: "div.nd30-page-break" },
      { tag: "div.page-break" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "hr",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-page-break": "true",
        class: "nd30-page-break",
      }),
    ];
  },

  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ state, chain }) => {
          const { selection } = state;
          // Chèn ngắt trang ngay sau vị trí con trỏ hiện tại, không xóa nội dung cũ
          const pos = selection.$to.pos;
          return chain()
            .insertContentAt(pos, [
              { type: this.name },
              { type: "paragraph", content: [] },
            ])
            .focus(pos + 2)
            .scrollIntoView()
            .run();
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.insertPageBreak(),
    };
  },
});
