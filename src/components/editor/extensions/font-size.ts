import { Mark, mergeAttributes } from "@tiptap/core";

export interface FontSizeOptions {
  types: string[];
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      /**
       * Đặt kích thước chữ (ví dụ: '13pt', '14pt', '12pt', '16pt')
       */
      setFontSize: (fontSize: string) => ReturnType;
      /**
       * Xóa kích thước chữ tùy chỉnh, trở về mặc định 13pt
       */
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Mark.create<FontSizeOptions>({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        style: "font-size",
        getAttrs: (value) => {
          if (typeof value !== "string") return false;
          return { fontSize: value };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark(this.name, { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },
});
