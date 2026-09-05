import { Mark, mergeAttributes } from "@tiptap/core";
import { type Editor } from "@tiptap/react";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface DocumentSuggestion {
  id: string;
  type: "replace" | "delete" | "insert";
  author: string;
  createdAt: string;
  deletedText?: string;
  insertedText?: string;
  delFrom?: number;
  delTo?: number;
  insFrom?: number;
  insTo?: number;
}

/**
 * Mark đánh dấu đoạn văn bản bị ĐỀ XUẤT XÓA (Gạch ngang đỏ, nền đỏ nhạt)
 */
export const SuggestionDeletion = Mark.create({
  name: "suggestionDeletion",

  addAttributes() {
    return {
      suggestionId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-suggestion-id"),
        renderHTML: (attributes) => ({
          "data-suggestion-id": attributes.suggestionId,
        }),
      },
      author: {
        default: "Người xem",
        parseHTML: (element) => element.getAttribute("data-author"),
        renderHTML: (attributes) => ({
          "data-author": attributes.author,
        }),
      },
      createdAt: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-created-at"),
        renderHTML: (attributes) => ({
          "data-created-at": attributes.createdAt,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "del[data-suggestion-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "del",
      mergeAttributes(
        {
          class:
            "docdraft-suggestion-del bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 line-through decoration-rose-600 decoration-1.5 px-0.5 rounded cursor-pointer select-all mx-0.5",
          title: `Đề xuất xóa bởi ${HTMLAttributes["data-author"] || "người xem"}`,
        },
        HTMLAttributes
      ),
      0,
    ];
  },
});

/**
 * Mark đánh dấu đoạn văn bản được ĐỀ XUẤT THÊM MỚI (Gạch chân xanh, nền xanh nhạt)
 */
export const SuggestionInsertion = Mark.create({
  name: "suggestionInsertion",

  addAttributes() {
    return {
      suggestionId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-suggestion-id"),
        renderHTML: (attributes) => ({
          "data-suggestion-id": attributes.suggestionId,
        }),
      },
      author: {
        default: "Người xem",
        parseHTML: (element) => element.getAttribute("data-author"),
        renderHTML: (attributes) => ({
          "data-author": attributes.author,
        }),
      },
      createdAt: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-created-at"),
        renderHTML: (attributes) => ({
          "data-created-at": attributes.createdAt,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "ins[data-suggestion-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "ins",
      mergeAttributes(
        {
          class:
            "docdraft-suggestion-ins bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 underline decoration-emerald-600 decoration-2 px-0.5 rounded cursor-pointer mx-0.5 font-medium",
          title: `Đề xuất thêm mới bởi ${HTMLAttributes["data-author"] || "người xem"}`,
        },
        HTMLAttributes
      ),
      0,
    ];
  },
});

/**
 * Quét toàn bộ ProseMirror Node để trích xuất danh sách đề xuất
 */
export function extractSuggestions(doc: ProseMirrorNode): DocumentSuggestion[] {
  const map = new Map<string, DocumentSuggestion>();

  doc.descendants((node, pos) => {
    if (node.isText && node.marks) {
      for (const mark of node.marks) {
        if (mark.type.name === "suggestionDeletion" || mark.type.name === "suggestionInsertion") {
          const sugId = mark.attrs.suggestionId as string;
          if (!sugId) continue;

          let item = map.get(sugId);
          if (!item) {
            item = {
              id: sugId,
              type: "replace",
              author: mark.attrs.author || "Người xem",
              createdAt: mark.attrs.createdAt || new Date().toISOString(),
            };
            map.set(sugId, item);
          }

          if (mark.type.name === "suggestionDeletion") {
            item.deletedText = (item.deletedText || "") + (node.text || "");
            if (item.delFrom === undefined) item.delFrom = pos;
            item.delTo = pos + (node.text?.length || 0);
          } else if (mark.type.name === "suggestionInsertion") {
            item.insertedText = (item.insertedText || "") + (node.text || "");
            if (item.insFrom === undefined) item.insFrom = pos;
            item.insTo = pos + (node.text?.length || 0);
          }
        }
      }
    }
  });

  // Xác định chính xác kiểu đề xuất
  for (const item of map.values()) {
    if (item.deletedText && item.insertedText) {
      item.type = "replace";
    } else if (item.deletedText) {
      item.type = "delete";
    } else {
      item.type = "insert";
    }
  }

  return Array.from(map.values());
}

/**
 * Tạo một đề xuất sửa đổi mới trong Editor
 */
export function createSuggestion(
  editor: Editor,
  params: {
    from: number;
    to: number;
    replacementText?: string;
    author?: string;
  }
) {
  const { from, to, replacementText = "", author = "AI Copilot" } = params;
  const suggestionId = "sug_" + Math.random().toString(36).substring(2, 9);
  const createdAt = new Date().toISOString();

  const tr = editor.state.tr;
  const schema = editor.state.schema;

  // 1. Nếu có bôi đen đoạn chữ cần thay thế -> gán Mark suggestionDeletion
  if (to > from) {
    const delMark = schema.marks.suggestionDeletion.create({
      suggestionId,
      author,
      createdAt,
    });
    tr.addMark(from, to, delMark);
  }

  // 2. Nếu có đoạn chữ đề xuất mới -> chèn ngay sau vị trí 'to' kèm Mark suggestionInsertion
  if (replacementText) {
    const insMark = schema.marks.suggestionInsertion.create({
      suggestionId,
      author,
      createdAt,
    });
    const textNode = schema.text(replacementText, [insMark]);
    tr.insert(to, textNode);
  }

  editor.view.dispatch(tr);
  return suggestionId;
}

/**
 * Chấp nhận một đề xuất (Accept Suggestion):
 * - Xóa vĩnh viễn đoạn chữ bị gạch xóa (delMark).
 * - Bỏ gạch chân đoạn chữ đề xuất thêm mới (insMark), chuyển thành chữ văn bản thường.
 */
export function acceptSuggestion(editor: Editor, suggestionId: string) {
  const { doc } = editor.state;
  const tr = editor.state.tr;
  const schema = editor.state.schema;

  const delPositions: Array<{ from: number; to: number }> = [];
  const insPositions: Array<{ from: number; to: number }> = [];

  doc.descendants((node, pos) => {
    if (node.isText && node.marks) {
      for (const mark of node.marks) {
        if (mark.attrs.suggestionId === suggestionId) {
          const from = pos;
          const to = pos + (node.text?.length || 0);
          if (mark.type.name === "suggestionDeletion") {
            delPositions.push({ from, to });
          } else if (mark.type.name === "suggestionInsertion") {
            insPositions.push({ from, to });
          }
        }
      }
    }
  });

  // Xóa các mark insertion (đưa về text thường)
  for (const ins of insPositions) {
    tr.removeMark(ins.from, ins.to, schema.marks.suggestionInsertion);
  }

  // Xóa text bị delete (từ dưới lên để không lệch vị trí index)
  delPositions.sort((a, b) => b.from - a.from);
  for (const del of delPositions) {
    tr.delete(del.from, del.to);
  }

  editor.view.dispatch(tr);
}

/**
 * Từ chối một đề xuất (Reject Suggestion):
 * - Giữ nguyên đoạn chữ bị gạch xóa (bỏ delMark, đưa về chữ thường).
 * - Xóa hoàn toàn đoạn chữ được đề xuất thêm mới (insMark).
 */
export function rejectSuggestion(editor: Editor, suggestionId: string) {
  const { doc } = editor.state;
  const tr = editor.state.tr;
  const schema = editor.state.schema;

  const delPositions: Array<{ from: number; to: number }> = [];
  const insPositions: Array<{ from: number; to: number }> = [];

  doc.descendants((node, pos) => {
    if (node.isText && node.marks) {
      for (const mark of node.marks) {
        if (mark.attrs.suggestionId === suggestionId) {
          const from = pos;
          const to = pos + (node.text?.length || 0);
          if (mark.type.name === "suggestionDeletion") {
            delPositions.push({ from, to });
          } else if (mark.type.name === "suggestionInsertion") {
            insPositions.push({ from, to });
          }
        }
      }
    }
  });

  // Bỏ mark del (giữ nguyên text cũ)
  for (const del of delPositions) {
    tr.removeMark(del.from, del.to, schema.marks.suggestionDeletion);
  }

  // Xóa text mới thêm (từ dưới lên để không lệch index)
  insPositions.sort((a, b) => b.from - a.from);
  for (const ins of insPositions) {
    tr.delete(ins.from, ins.to);
  }

  editor.view.dispatch(tr);
}

/**
 * Chấp nhận tất cả đề xuất trong văn bản
 */
export function acceptAllSuggestions(editor: Editor) {
  const suggestions = extractSuggestions(editor.state.doc);
  for (const sug of suggestions) {
    acceptSuggestion(editor, sug.id);
  }
}

/**
 * Từ chối tất cả đề xuất trong văn bản
 */
export function rejectAllSuggestions(editor: Editor) {
  const suggestions = extractSuggestions(editor.state.doc);
  for (const sug of suggestions) {
    rejectSuggestion(editor, sug.id);
  }
}
