import { Mark, mergeAttributes } from "@tiptap/core";

export interface TextColorOptions {
  types: string[];
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textColor: {
      /**
       * Đặt màu chữ (HEX, RGB)
       */
      setTextColor: (color: string) => ReturnType;
      /**
       * Bỏ màu chữ tùy chỉnh, trở về mặc định
       */
      unsetTextColor: () => ReturnType;
    };
  }
}

export const TextColor = Mark.create<TextColorOptions>({
  name: "textColor",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style.color,
        renderHTML: (attributes) => {
          if (!attributes.color) {
            return {};
          }
          return {
            style: `color: ${attributes.color}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        style: "color",
        getAttrs: (value) => {
          if (typeof value !== "string") return false;
          return { color: value };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setTextColor:
        (color) =>
        ({ chain }) => {
          return chain().setMark(this.name, { color }).run();
        },
      unsetTextColor:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },
});
