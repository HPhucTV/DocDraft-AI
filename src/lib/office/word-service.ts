/**
 * TIỆN ÍCH TƯƠNG TÁC OFFICE.JS MICROSOFT WORD (TASK-303, TASK-304, TASK-FORMAT-ENHANCE)
 * Tài liệu tham chiếu: docs/adr/ADR-004-office-js-taskpane.md
 * Hỗ trợ chuẩn hóa định dạng, triệt tiêu lỗi bể format, chống ngắt trang bảng biểu,
 * và tích hợp bộ cấu hình Thể thức Đa dạng (Nghị định 30, Doanh nghiệp SME, Trường học).
 */

import {
  DocDraftFormatConfig,
  MarginsConfig,
  getStoredFormatConfig,
} from "./format-config";
import {
  isFullND30Document,
  convertFullDocumentToND30Html,
} from "../ai/ai-text-formatter";

export interface WordSection {
  pageSetup: {
    topMargin: number;
    bottomMargin: number;
    leftMargin: number;
    rightMargin: number;
  };
}

export interface WordParagraph {
  load: (fields: string | string[]) => void;
  text?: string;
  alignment?: string;
  lineSpacing?: number;
  spaceAfter?: number;
  spaceBefore?: number;
  font?: {
    name?: string;
    size?: number;
    color?: string;
    bold?: boolean;
  };
}

export interface WordTableRow {
  cantSplit?: boolean;
}

export interface WordTable {
  load: (fields: string | string[]) => void;
  font: {
    name?: string;
    size?: number;
  };
  rows: {
    load: (fields: string | string[]) => void;
    items: WordTableRow[];
  };
}

export interface WordRange {
  load: (fields: string | string[]) => void;
  text?: string;
  insertText: (text: string, location: string) => void;
  insertHtml?: (html: string, location: string) => void;
  select: (selectionMode?: string) => void;
  font: {
    name?: string;
    size?: number;
    color?: string;
  };
  paragraphs: {
    load: (fields: string | string[]) => void;
    items: WordParagraph[];
  };
  tables: {
    load: (fields: string | string[]) => void;
    items: WordTable[];
  };
}

export interface WordContext {
  document: {
    sections: {
      load: (fields: string | string[]) => void;
      items: WordSection[];
    };
    body: {
      font: {
        name?: string;
        size?: number;
        color?: string;
      };
      paragraphs: {
        load: (fields: string | string[]) => void;
        items: WordParagraph[];
      };
      insertTable: (
        rows: number,
        columns: number,
        location: string,
        data: string[][]
      ) => WordTable;
      insertText?: (text: string, location: string) => void;
      insertHtml?: (html: string, location: string) => void;
    };
    getSelection: () => WordRange;
  };
  sync: () => Promise<void>;
}

export interface WordNamespace {
  run: (batch: (context: WordContext) => Promise<void>) => Promise<void>;
}

// Chuyển đổi milimét sang point trong hệ đo lường của Microsoft Word (1 mm = 72 / 25.4 pt)
export function mmToPoints(mm: number): number {
  return (mm * 72) / 25.4;
}

// Helper lấy đối tượng Word từ window
function getWordApi(): WordNamespace | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as { Word?: WordNamespace };
  return win.Word || null;
}

// Kiểm tra xem Add-in có đang chạy trong môi trường Microsoft Word thực tế hay không
export function isWordEnvironment(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as unknown as { Office?: { context?: unknown } }).Office !== "undefined" &&
    getWordApi() !== null
  );
}

/**
 * Làm sạch mã HTML thô trước khi nạp vào Word
 */
export function cleanHtmlForWord(raw: string): string {
  if (!raw) return "";
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:html)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  // Lọc sạch toàn bộ các đoạn paragraph chỉ chứa dấu gạch nối bàn phím (-------------, --------, __________)
  cleaned = cleaned.replace(/<p[^>]*>\s*[-_—–\s.]{2,}\s*<\/p>/gi, "");
  cleaned = cleaned.replace(/^[-_—–\s.]{2,}$/gm, "");
  return cleaned.trim();
}

/**
 * BỘ CHUYỂN ĐỔI MARKDOWN SANG WORD HTML NGỮ NGHĨA (TASK-MARKDOWN-WORD)
 * Biến các cú pháp Markdown từ Copilot AI (**in đậm**, bảng biểu, danh sách)
 * thành mã HTML chuẩn mực có CSS inline, loại bỏ hoàn toàn dấu hoa thị và khoảng cách thừa.
 */
export function formatMarkdownToWordHtml(
  rawMarkdown: string,
  config?: DocDraftFormatConfig
): string {
  const currentConfig = config || getStoredFormatConfig();
  if (!rawMarkdown || !rawMarkdown.trim()) return "";

  const text = cleanHtmlForWord(rawMarkdown);

  // Nếu text là toàn văn văn bản NĐ 30 chưa có bảng ẩn 2 cột -> Tự động đóng gói vào Bảng 2 cột chuẩn NĐ 30
  if (isFullND30Document(text) && !text.includes("data-nd30-table")) {
    const nd30Html = convertFullDocumentToND30Html(text);
    return wrapHtmlWithWordStyles(nd30Html, currentConfig);
  }

  // Nếu text đã là HTML đầy đủ có chứa thẻ <table hoặc <p>, bọc style trực tiếp
  if (/<(table|div|p|h1|h2|h3)[^>]*>/i.test(text)) {
    return wrapHtmlWithWordStyles(text, currentConfig);
  }

  const lines = text.split("\n");
  const htmlParts: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      const rowsHtml = tableRows
        .map((row, idx) => {
          const isHeader = idx === 0;
          const cellTag = isHeader ? "th" : "td";
          const bg = isHeader ? "background-color: #f1f5f9; font-weight: bold;" : "";
          const cells = row
            .map(
              (c) =>
                `<${cellTag} style="border: 0.5pt solid #94a3b8; padding: 4pt 6pt; font-size: ${
                  currentConfig.fontSize
                }pt; text-align: left; ${bg}">${inlineMarkdown(c)}</${cellTag}>`
            )
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      htmlParts.push(`
        <table style="width: 100%; border-collapse: collapse; margin: 8pt 0; border: 0.5pt solid #94a3b8;">
          <tbody>${rowsHtml}</tbody>
        </table>
      `);
      tableRows = [];
    }
    inTable = false;
  };

  const inlineMarkdown = (str: string): string => {
    return str
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code style='background:#f1f5f9;padding:1pt 3pt;'>$1</code>");
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (inTable) flushTable();
      continue;
    }

    // 1. Nhận diện Bảng Markdown (| col 1 | col 2 |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      // Bỏ qua dòng separator |---|---|
      if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(trimmed)) {
        continue;
      }
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // 2. Nhận diện Tiêu đề Markdown (#, ##, ###)
    if (trimmed.startsWith("### ")) {
      htmlParts.push(
        `<h3 style="margin: 8pt 0 3pt 0; font-size: ${
          currentConfig.fontSize + 1
        }pt; font-weight: bold; font-family: '${currentConfig.fontFamily}', serif;">${inlineMarkdown(
          trimmed.slice(4)
        )}</h3>`
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      htmlParts.push(
        `<h2 style="margin: 10pt 0 4pt 0; font-size: ${
          currentConfig.fontSize + 2
        }pt; font-weight: bold; text-align: center; text-transform: uppercase; font-family: '${
          currentConfig.fontFamily
        }', serif;">${inlineMarkdown(trimmed.slice(3))}</h2>`
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      htmlParts.push(
        `<h1 style="margin: 12pt 0 6pt 0; font-size: ${
          currentConfig.fontSize + 3
        }pt; font-weight: bold; text-align: center; text-transform: uppercase; font-family: '${
          currentConfig.fontFamily
        }', serif;">${inlineMarkdown(trimmed.slice(2))}</h1>`
      );
      continue;
    }

    // 3. Nhận diện Gạch đầu dòng (- hoặc *)
    if (/^[-*]\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[-*]\s+/, "");
      htmlParts.push(
        `<p style="margin: 0 0 2pt 18pt; line-height: ${
          currentConfig.lineSpacing
        }; font-size: ${currentConfig.fontSize}pt; font-family: '${
          currentConfig.fontFamily
        }', serif;">• ${inlineMarkdown(content)}</p>`
      );
      continue;
    }

    // 4. Nhận diện Danh sách số (1. hoặc 2.)
    const numMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
    if (numMatch) {
      htmlParts.push(
        `<p style="margin: 0 0 2pt 18pt; line-height: ${
          currentConfig.lineSpacing
        }; font-size: ${currentConfig.fontSize}pt; font-family: '${
          currentConfig.fontFamily
        }', serif;">${numMatch[1]} ${inlineMarkdown(numMatch[2])}</p>`
      );
      continue;
    }

    // 5. Đoạn văn thường
    let formatted = inlineMarkdown(trimmed);

    // Chuẩn hóa đường kẻ Tiêu ngữ: Luôn có gạch chân liền nét trang trọng
    if (/độc lập\s*[-–—]\s*tự do\s*[-–—]\s*hạnh phúc/i.test(formatted) && !formatted.includes("<u>")) {
      formatted = formatted.replace(
        /(?:<strong>)?(độc lập\s*[-–—]\s*tự do\s*[-–—]\s*hạnh phúc)(?:<\/strong>)?/gi,
        "<strong><u>$1</u></strong>"
      );
    }

    const isCentered =
      /^(CỘNG HÒA|Độc lập|GIẤY MỜI|THÔNG BÁO|QUYẾT ĐỊNH|TỜ TRÌNH|BIÊN BẢN)/i.test(trimmed);
    const textAlign = isCentered ? "center" : currentConfig.alignment.toLowerCase();
    const textIndent = !isCentered && currentConfig.indentFirstLine ? "text-indent: 1.27cm;" : "";

    htmlParts.push(
      `<p style="margin: 0 0 ${currentConfig.spaceAfter}pt 0; line-height: ${
        currentConfig.lineSpacing
      }; font-size: ${currentConfig.fontSize}pt; text-align: ${textAlign}; ${textIndent} font-family: '${
        currentConfig.fontFamily
      }', serif;">${formatted}</p>`
    );
  }

  if (inTable) flushTable();

  return wrapHtmlWithWordStyles(htmlParts.join("\n"), currentConfig);
}

/**
 * BỌC HTML VỚI BỘ CSS RESET CHUYÊN BIỆT CHO MICROSOFT WORD
 * Khóa cứng khoảng cách dòng, lề đoạn văn và triệt tiêu khoảng trống thừa trong các bảng.
 */
export function wrapHtmlWithWordStyles(
  htmlContent: string,
  config?: DocDraftFormatConfig
): string {
  const currentConfig = config || getStoredFormatConfig();
  let cleaned = cleanHtmlForWord(htmlContent);

  // 1. Dọn dẹp triệt để các đoạn văn rỗng liên tiếp do Word hoặc AI sinh ra
  cleaned = cleaned.replace(/(?:<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*){2,}/gi, '<p style="margin:0 0 2pt 0;">&nbsp;</p>');
  cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, "");

  // Dọn dẹp các đoạn paragraph chỉ chứa dấu gạch rời rạc (-------------)
  cleaned = cleaned.replace(/<p[^>]*>\s*[-_—–\s.]{2,}\s*<\/p>/gi, "");

  // Chuẩn hóa dòng Tiêu ngữ luôn có gạch chân liền nét trang trọng
  cleaned = cleaned.replace(
    /(?:<strong>)?(Độc lập\s*[-–—]\s*Tự do\s*[-–—]\s*Hạnh phúc)(?:<\/strong>)?/gi,
    (match, pText) => `<strong><u>${pText}</u></strong>`
  );

  // 2. Chuẩn hóa các bảng 2 cột (Quốc hiệu, Chữ ký): Đảm bảo table-layout fixed, không bị viền và padding cực nhỏ gọn
  cleaned = cleaned.replace(/<table\b([^>]*)>/gi, (match, attrs) => {
    if (
      /data-nd30-table|header|signature/i.test(attrs) ||
      /border:\s*none/i.test(attrs)
    ) {
      return `<table ${attrs} data-nd30-table="true" style="width: 100%; table-layout: fixed !important; border: none !important; border-collapse: collapse !important; margin: 4pt 0 10pt 0;">`;
    }
    return `<table ${attrs} style="width: 100%; border-collapse: collapse; margin: 6pt 0;">`;
  });

  // 3. Giảm thiểu padding ô và ép paragraph trong bảng có margin-bottom: 2pt (chống phình to)
  cleaned = cleaned.replace(/<td\b([^>]*)>/gi, (match, attrs) => {
    if (/border:\s*none/i.test(attrs) || !attrs.includes("style")) {
      return `<td ${attrs} style="border: none !important; padding: 2pt 4pt !important; vertical-align: top;">`;
    }
    return match;
  });

  return `
<div style="font-family: '${currentConfig.fontFamily}', 'Times New Roman', serif; font-size: ${
    currentConfig.fontSize
  }pt; line-height: ${currentConfig.lineSpacing}; color: #000000;">
  <style>
    p { 
      margin: 0 0 ${currentConfig.spaceAfter}pt 0; 
      line-height: ${currentConfig.lineSpacing}; 
      font-size: ${currentConfig.fontSize}pt; 
      font-family: '${currentConfig.fontFamily}', 'Times New Roman', serif; 
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 6pt 0; 
      page-break-inside: avoid;
    }
    table thead tr, table tr:first-child {
      page-break-inside: avoid;
    }
    table th {
      background-color: #f8fafc;
      font-weight: bold;
      padding: 4pt 6pt;
      border: 0.5pt solid #94a3b8;
      text-align: center;
    }
    table td { 
      padding: 3pt 5pt; 
      vertical-align: top; 
    }
    table[data-table-type="header"], table[data-table-type="signature"], table[data-nd30-table="true"] { 
      border: none !important; 
      margin-bottom: 8pt !important; 
      table-layout: fixed !important;
    }
    table[data-table-type="header"] td, table[data-table-type="signature"] td, table[data-nd30-table="true"] td { 
      border: none !important; 
      padding: 1.5pt 3pt !important; 
      vertical-align: top !important; 
    }
    table[data-table-type="header"] p, table[data-table-type="signature"] p, table[data-nd30-table="true"] p { 
      margin: 0 0 2pt 0 !important; 
      line-height: 1.15 !important; 
    }
    h1, h2, h3 { 
      font-family: '${currentConfig.fontFamily}', 'Times New Roman', serif; 
    }
  </style>
  ${cleaned}
</div>
`.trim();
}

/**
 * ÁP DỤNG LỀ IN TRANG TRÊN TOÀN BỘ TÀI LIỆU WORD (THEO MM)
 */
export async function applyDocumentMargins(margins: MarginsConfig): Promise<boolean> {
  const word = getWordApi();
  if (!word) return true;

  const topPt = mmToPoints(margins.top);
  const bottomPt = mmToPoints(margins.bottom);
  const leftPt = mmToPoints(margins.left);
  const rightPt = mmToPoints(margins.right);

  await word.run(async (context) => {
    const sections = context.document.sections;
    sections.load("items");
    await context.sync();

    sections.items.forEach((section) => {
      section.pageSetup.topMargin = topPt;
      section.pageSetup.bottomMargin = bottomPt;
      section.pageSetup.leftMargin = leftPt;
      section.pageSetup.rightMargin = rightPt;
    });

    await context.sync();
  });

  return true;
}

/**
 * CHUẨN HÓA VĂN BẢN WORD THEO CẤU HÌNH THỂ THỨC (FORMAT PRESET HOẶC CUSTOM)
 */
export async function formatDocumentWithConfig(
  config?: DocDraftFormatConfig
): Promise<{ success: boolean; message: string }> {
  const currentConfig = config || getStoredFormatConfig();
  const word = getWordApi();

  if (!word) {
    return {
      success: true,
      message: `Chế độ mô phỏng: Đã chuẩn hóa theo thể thức "${currentConfig.name}".`,
    };
  }

  // 1. Áp dụng lề trang
  await applyDocumentMargins(currentConfig.margins);

  // 2. Áp dụng font và định dạng cho body
  await word.run(async (context) => {
    const body = context.document.body;
    body.font.name = currentConfig.fontFamily;
    body.font.size = currentConfig.fontSize;
    body.font.color = "#000000";

    const paragraphs = body.paragraphs;
    paragraphs.load(["items", "text"]);
    await context.sync();

    paragraphs.items.forEach((p) => {
      const txt = (p.text || "").trim();
      if (
        txt.length > 80 &&
        !txt.startsWith("CỘNG HÒA") &&
        !txt.startsWith("Độc lập") &&
        !txt.startsWith("Nơi nhận") &&
        !txt.startsWith("Số:")
      ) {
        p.alignment = currentConfig.alignment;
        p.lineSpacing = currentConfig.lineSpacing;
        p.spaceAfter = currentConfig.spaceAfter;
        p.spaceBefore = 0;
      }
    });

    await context.sync();
  });

  return {
    success: true,
    message: `Đã chuẩn hóa thành công thể thức văn bản theo cấu hình "${currentConfig.name}"!`,
  };
}

/**
 * Chức năng 1-Click Chuẩn hóa Nghị định 30 (Kế thừa tương thích)
 */
export async function formatDocumentND30(): Promise<{
  success: boolean;
  message: string;
  appliedSettings: {
    margins: MarginsConfig;
    font: string;
    fontSize: number;
  };
}> {
  const res = await formatDocumentWithConfig();
  return {
    success: res.success,
    message: res.message,
    appliedSettings: {
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      font: "Times New Roman",
      fontSize: 13,
    },
  };
}

/**
 * Đọc đoạn văn bản hiện đang được người dùng bôi đen trong Microsoft Word
 */
export async function getSelectedWordText(): Promise<string> {
  const word = getWordApi();
  if (!word) {
    return "Đoạn văn bản mẫu đang được bôi đen trong Microsoft Word.";
  }

  let selectedText = "";
  await word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.load("text");
    await context.sync();
    selectedText = selection.text || "";
  });

  return selectedText;
}

/**
 * Thay thế đoạn văn bản đang được bôi đen bằng nội dung mới từ AI Copilot
 */
export async function replaceSelectedWordText(newText: string): Promise<boolean> {
  const word = getWordApi();
  if (!word) return true;

  await word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.insertText(newText, "Replace");
    await context.sync();
  });

  return true;
}

/**
 * CHÈN CÂU TRẢ LỜI / ĐOẠN VĂN TỪ COPILOT VÀO WORD (TASK-501, TASK-MARKDOWN)
 * Tự động chuyển đổi Markdown thành HTML chuẩn, bọc CSS reset và áp dụng font định dạng.
 */
export async function insertSnippetAtCursor(
  text: string,
  config?: DocDraftFormatConfig
): Promise<{ success: boolean; message: string }> {
  const currentConfig = config || getStoredFormatConfig();
  const word = getWordApi();

  if (!word) {
    return {
      success: true,
      message: "Chế độ mô phỏng: Đã chèn đoạn văn bản tại vị trí con trỏ.",
    };
  }

  // Chuyển đổi Markdown sang Word HTML có CSS inline
  const styledHtml = formatMarkdownToWordHtml(text, currentConfig);

  try {
    await word.run(async (context) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selection = context.document.getSelection() as any;
      if (typeof selection.insertHtml === "function") {
        selection.insertHtml(styledHtml, "After");
      } else {
        const plainText = text.replace(/\*\*/g, "").replace(/\*/g, "");
        selection.insertText(plainText, "After");
      }
      await context.sync();

      // Cuộn con trỏ đến vị trí mới chèn
      selection.select("End");
      await context.sync();
    });

    return {
      success: true,
      message: "Đã chèn nội dung vào văn bản Word chuẩn format thành công.",
    };
  } catch {
    return {
      success: false,
      message: "Không thể chèn nội dung vào vị trí con trỏ.",
    };
  }
}

/**
 * CHÈN TOÀN BỘ VĂN BẢN ĐÃ SINH VÀO WORD KÈM OFFICE.JS POST-PROCESSOR
 * Triệt tiêu lỗi tràn bảng sang trang 2, khóa cantSplit cho hàng bảng, dọn dẹp đoạn văn rỗng.
 */
export async function insertDocumentContent(
  htmlContent: string,
  config?: DocDraftFormatConfig
): Promise<{ success: boolean; message: string }> {
  const currentConfig = config || getStoredFormatConfig();
  const word = getWordApi();

  if (!word) {
    return {
      success: true,
      message: "Chế độ mô phỏng: Đã chèn tài liệu vào văn bản Word thành công.",
    };
  }

  // Tự động kiểm tra: Nếu tài liệu chứa Quốc hiệu + Cơ quan/Chữ ký mà chưa có bảng 2 cột
  // -> Tự động chuyển đổi sang Bảng ẩn 2 cột chuẩn NĐ 30 trước khi chèn vào Word
  let contentToInsert = htmlContent;
  if (isFullND30Document(htmlContent) && !htmlContent.includes("data-nd30-table")) {
    contentToInsert = convertFullDocumentToND30Html(htmlContent);
  }

  const styledHtml = wrapHtmlWithWordStyles(contentToInsert, currentConfig);

  try {
    await word.run(async (context) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selection = context.document.getSelection() as any;
      if (typeof selection.insertHtml === "function") {
        selection.insertHtml(styledHtml, "Replace");
      } else {
        const plainText = styledHtml.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n");
        selection.insertText(plainText, "Replace");
      }
      await context.sync();

      // === OFFICE.JS POST-PROCESSOR ===
      try {
        // 1. Áp dụng font và màu sắc
        selection.font.name = currentConfig.fontFamily;
        selection.font.size = currentConfig.fontSize;
        selection.font.color = "#000000";

        // 2. Khóa toàn bộ các bảng để không bị cắt đôi hàng sang trang thứ 2
        const tables = selection.tables;
        tables.load(["items"]);
        await context.sync();

        for (const table of tables.items) {
          table.rows.load(["items"]);
        }
        await context.sync();

        for (const table of tables.items) {
          for (const row of table.rows.items) {
            row.cantSplit = true; // KHÓA HÀNG: Ngăn bảng chữ ký bị chia đôi sang trang 2!
          }
        }

        // 3. Cuộn trang Word và đưa con trỏ đến vị trí mới chèn
        selection.select("End");
        await context.sync();
      } catch (postErr) {
        console.warn("Post-processor warning (non-fatal):", postErr);
      }
    });

    return {
      success: true,
      message: "Đã chèn toàn bộ văn bản vào tệp Word với định dạng chuẩn mực.",
    };
  } catch {
    // Fallback qua body.insertText
    await word.run(async (context) => {
      const plainText = styledHtml.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n");
      if (context.document.body.insertText) {
        context.document.body.insertText(plainText, "End");
      }
      await context.sync();
    });

    return {
      success: true,
      message: "Đã chèn văn bản vào Word (chế độ tương thích).",
    };
  }
}

/**
 * Chèn bảng Quốc hiệu & Tiêu ngữ chuẩn (Bảng ẩn 2 cột không viền) vào đầu tài liệu
 */
export async function insertNationalHeaderTable(): Promise<{ success: boolean; message: string }> {
  const config = getStoredFormatConfig();
  const headerHtml = `
<table data-nd30-table="true" data-table-type="header" style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 12pt;">
  <tbody>
    <tr>
      <td style="width: 40%; text-align: center; vertical-align: top; border: none; padding: 2pt 4pt;">
        <p style="margin: 0; font-size: ${config.fontSize - 1}pt; line-height: 1.2;"><strong>[TÊN CƠ QUAN CHỦ QUẢN]</strong></p>
        <p style="margin: 1pt 0 0 0; font-size: ${config.fontSize - 1}pt; line-height: 1.2;"><strong>[TÊN CƠ QUAN BAN HÀNH]</strong></p>
        <p style="margin: 4pt 0 0 0; font-size: ${config.fontSize - 1}pt; line-height: 1.2;">Số: .../QĐ-...</p>
      </td>
      <td style="width: 60%; text-align: center; vertical-align: top; border: none; padding: 2pt 4pt;">
        <p style="margin: 0; font-size: ${config.fontSize}pt; line-height: 1.2;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
        <p style="margin: 2pt 0 0 0; font-size: ${config.fontSize + 1}pt; line-height: 1.2;"><strong><u>Độc lập - Tự do - Hạnh phúc</u></strong></p>
        <p style="margin: 6pt 0 0 0; font-size: ${config.fontSize}pt; font-style: italic; line-height: 1.2;">[Địa danh], ngày ... tháng ... năm ...</p>
      </td>
    </tr>
  </tbody>
</table>
`;
  return insertDocumentContent(headerHtml, config);
}

/**
 * Chèn khối Nơi nhận & Ký tên chuẩn vào cuối tài liệu
 */
export async function insertSignatureFooterTable(): Promise<{ success: boolean; message: string }> {
  const config = getStoredFormatConfig();
  const signatureHtml = `
<table data-nd30-table="true" data-table-type="signature" style="width: 100%; border: none; border-collapse: collapse; margin-top: 18pt;">
  <tbody>
    <tr>
      <td style="width: 50%; text-align: left; vertical-align: top; border: none; padding: 2pt 4pt;">
        <p style="margin: 0 0 3pt 0; font-size: ${config.fontSize - 1}pt; line-height: 1.2;"><strong><em><u>Nơi nhận:</u></em></strong></p>
        <p style="margin: 0; font-size: ${config.fontSize - 2}pt; line-height: 1.2;">- Như Điều ...;</p>
        <p style="margin: 0; font-size: ${config.fontSize - 2}pt; line-height: 1.2;">- Lưu: VT, VP.</p>
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top; border: none; padding: 2pt 4pt;">
        <p style="margin: 0; font-size: ${config.fontSize}pt; line-height: 1.2;"><strong>[CHỨC DANH NGƯỜI KÝ]</strong></p>
        <p style="margin: 2pt 0 0 0; font-size: ${config.fontSize - 2}pt; font-style: italic; line-height: 1.2;">(Ký, ghi rõ họ và tên)</p>
        <p style="margin: 40pt 0 0 0; font-size: ${config.fontSize}pt; font-weight: bold; line-height: 1.2;">[HỌ VÀ TÊN]</p>
      </td>
    </tr>
  </tbody>
</table>
`;
  return insertDocumentContent(signatureHtml, config);
}
