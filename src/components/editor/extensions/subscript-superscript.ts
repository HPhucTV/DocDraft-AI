import { Mark, mergeAttributes } from "@tiptap/core";

export interface SubSupOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    subscript: {
      /**
       * Bật/tắt chỉ số dưới (Subscript, ví dụ: H2O)
       */
      toggleSubscript: () => ReturnType;
      unsetSubscript: () => ReturnType;
    };
    superscript: {
      /**
       * Bật/tắt chỉ số trên (Superscript, ví dụ: m2, km3)
       */
      toggleSuperscript: () => ReturnType;
      unsetSuperscript: () => ReturnType;
    };
  }
}

export const Subscript = Mark.create<SubSupOptions>({
  name: "subscript",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      { tag: "sub" },
      {
        style: "vertical-align",
        getAttrs: (value) => value === "sub" && null,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["sub", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleSubscript:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetSubscript:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-=": () => this.editor.commands.toggleSubscript(),
    };
  },
});

export const Superscript = Mark.create<SubSupOptions>({
  name: "superscript",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      { tag: "sup" },
      {
        style: "vertical-align",
        getAttrs: (value) => value === "super" && null,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["sup", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleSuperscript:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetSuperscript:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-=": () => this.editor.commands.toggleSuperscript(),
    };
  },
});
