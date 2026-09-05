import { Mark, mergeAttributes } from "@tiptap/core";

export interface FontFamilyOptions {
  types: string[];
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontFamily: {
      /**
       * Đặt phông chữ cho đoạn bôi đen (ví dụ: 'Times New Roman', 'Arial', 'Calibri')
       */
      setFontFamily: (fontFamily: string) => ReturnType;
      /**
       * Hủy đặt phông chữ, trở về phông mặc định
       */
      unsetFontFamily: () => ReturnType;
    };
  }
}

export const FontFamily = Mark.create<FontFamilyOptions>({
  name: "fontFamily",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily?.replace(/['"]/g, ""),
        renderHTML: (attributes) => {
          if (!attributes.fontFamily) {
            return {};
          }
          return {
            style: `font-family: "${attributes.fontFamily}", Times, serif`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        style: "font-family",
        getAttrs: (value) => {
          if (typeof value !== "string") return false;
          return { fontFamily: value.replace(/['"]/g, "") };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily) =>
        ({ chain }) => {
          return chain().setMark(this.name, { fontFamily }).run();
        },
      unsetFontFamily:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },
});
