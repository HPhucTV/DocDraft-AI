import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface PlaceholderInfo {
  from: number;
  to: number;
  text: string;
}

/**
 * Quét toàn bộ tài liệu ProseMirror AST để trích xuất danh sách các placeholder `[...]`
 */
export function extractPlaceholders(doc: ProseMirrorNode): PlaceholderInfo[] {
  const placeholders: PlaceholderInfo[] = [];
  const regex = /\[([^\]]+)\]/g;

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(node.text)) !== null) {
        const from = pos + match.index;
        const to = from + match[0].length;
        placeholders.push({
          from,
          to,
          text: match[0],
        });
      }
    }
  });

  return placeholders;
}

export const PlaceholderHighlightPluginKey = new PluginKey("placeholderHighlight");

/**
 * Tiptap Extension tự động nhận diện và làm nổi bật các placeholder an toàn `[...]`
 * dưới dạng Interactive Amber Badges (Chống ảo giác số liệu theo TASK-112).
 */
export const SafePlaceholderHighlight = Extension.create({
  name: "safePlaceholderHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: PlaceholderHighlightPluginKey,
        props: {
          decorations(state) {
            const { doc } = state;
            const decorations: Decoration[] = [];
            const placeholders = extractPlaceholders(doc);

            for (const item of placeholders) {
              const deco = Decoration.inline(item.from, item.to, {
                class:
                  "docdraft-placeholder-badge inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 shadow-xs cursor-pointer hover:bg-amber-500/30 transition-all select-all",
                "data-placeholder": item.text,
                title: "Nhấn để thay thế thông tin còn thiếu này",
              });
              decorations.push(deco);
            }

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
