import { Extension } from "@tiptap/core";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

/**
 * Tùy biến Table của Tiptap để hỗ trợ bảng 2 cột không viền (border: none)
 * chuẩn thể thức Nghị định 30/2020/NĐ-CP (Khối Quốc hiệu - Tiêu ngữ và Nơi nhận - Chữ ký).
 */
export const ND30Table = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      isND30Table: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-nd30-table") === "true",
        renderHTML: (attributes) => {
          if (!attributes.isND30Table) {
            return {};
          }
          return {
            "data-nd30-table": "true",
            style: "width: 100%; border: none; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px;",
          };
        },
      },
      tableType: {
        default: "general", // "header" (40/60) | "signature" (50/50) | "general"
        parseHTML: (element) => element.getAttribute("data-table-type") || "general",
        renderHTML: (attributes) => ({
          "data-table-type": attributes.tableType,
        }),
      },
    };
  },
});

export const ND30TableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    };
  },
});

export const ND30TableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colWidth: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-col-width"),
        renderHTML: (attributes) => {
          if (!attributes.colWidth) return {};
          return {
            "data-col-width": attributes.colWidth,
            style: `width: ${attributes.colWidth}; border: none; vertical-align: top; padding: 4px 8px;`,
          };
        },
      },
    };
  },
});

export const ND30TableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colWidth: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-col-width"),
        renderHTML: (attributes) => {
          if (!attributes.colWidth) return {};
          return {
            "data-col-width": attributes.colWidth,
            style: `width: ${attributes.colWidth}; border: none; vertical-align: top; padding: 4px 8px;`,
          };
        },
      },
    };
  },
});

export interface ND30TableCommands {
  insertND30HeaderTable: () => boolean;
  insertND30SignatureTable: () => boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    nd30Table: {
      insertND30HeaderTable: () => ReturnType;
      insertND30SignatureTable: () => ReturnType;
    };
  }
}

export const ND30TableHelpers = Extension.create({
  name: "nd30TableHelpers",

  addCommands() {
    return {
      insertND30HeaderTable:
        () =>
        ({ commands }) => {
          const html = `
            <table data-nd30-table="true" data-table-type="header" style="width: 100%; border: none; border-collapse: collapse;">
              <tbody>
                <tr>
                  <td data-col-width="40%" style="width: 40%; text-align: center; vertical-align: top; border: none; padding: 4px;">
                    <p style="text-align: center; margin: 0; font-size: 12pt;"><strong>[TÊN CƠ QUAN CHỦ QUẢN]</strong></p>
                    <p style="text-align: center; margin: 0; font-size: 13pt;"><strong>[TÊN ĐƠN VỊ SOẠN THẢO]</strong></p>
                    <p style="text-align: center; margin: 2px 0 4px 0;">───────────</p>
                    <p style="text-align: center; margin: 0; font-size: 12pt;">Số: [SỐ KÝ HIỆU]/[LOẠI VĂN BẢN]</p>
                  </td>
                  <td data-col-width="60%" style="width: 60%; text-align: center; vertical-align: top; border: none; padding: 4px;">
                    <p style="text-align: center; margin: 0; font-size: 13pt;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
                    <p style="text-align: center; margin: 0; font-size: 14pt;"><strong><u>Độc lập - Tự do - Hạnh phúc</u></strong></p>
                    <p style="text-align: center; margin: 2px 0 4px 0;">─────────────────</p>
                    <p style="text-align: center; margin: 0; font-size: 13pt; font-style: italic;">[ĐỊA DANH], ngày [NGÀY] tháng [THÁNG] năm [NĂM]</p>
                  </td>
                </tr>
              </tbody>
            </table>
            <p></p>
          `;
          return commands.insertContent(html);
        },

      insertND30SignatureTable:
        () =>
        ({ commands }) => {
          const html = `
            <table data-nd30-table="true" data-table-type="signature" style="width: 100%; border: none; border-collapse: collapse; margin-top: 24px;">
              <tbody>
                <tr>
                  <td data-col-width="50%" style="width: 50%; text-align: left; vertical-align: top; border: none; padding: 4px;">
                    <p style="margin: 0; font-size: 12pt;"><strong><em><u>Nơi nhận:</u></em></strong></p>
                    <p style="margin: 0; font-size: 11pt;">- Như Điều [...];</p>
                    <p style="margin: 0; font-size: 11pt;">- Ban Giám đốc (để b/c);</p>
                    <p style="margin: 0; font-size: 11pt;">- Lưu: VT, [ĐƠN VỊ].</p>
                  </td>
                  <td data-col-width="50%" style="width: 50%; text-align: center; vertical-align: top; border: none; padding: 4px;">
                    <p style="text-align: center; margin: 0; font-size: 13pt;"><strong>[CHỨC DANH NGƯỜI KÝ]</strong></p>
                    <p style="text-align: center; margin: 0; font-size: 11pt; font-style: italic;">(Ký, ghi rõ họ tên và đóng dấu)</p>
                    <p style="text-align: center; margin: 35px 0 0 0; font-size: 13pt;"><strong>[HỌ VÀ TÊN NGƯỜI KÝ]</strong></p>
                  </td>
                </tr>
              </tbody>
            </table>
            <p></p>
          `;
          return commands.insertContent(html);
        },
    };
  },
});
