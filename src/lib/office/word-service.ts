/**
 * TIỆN ÍCH TƯƠNG TÁC OFFICE.JS MICROSOFT WORD (TASK-303, TASK-304)
 * Tài liệu tham chiếu: docs/adr/ADR-004-office-js-taskpane.md
 */

export interface WordSection {
  pageSetup: {
    topMargin: number;
    bottomMargin: number;
    leftMargin: number;
    rightMargin: number;
  };
}

export interface WordParagraph {
  load: (fields: string) => void;
  text?: string;
  alignment?: string;
}

export interface WordTable {
  load: (fields: string) => void;
  font: {
    name?: string;
    size?: number;
  };
}

export interface WordRange {
  load: (fields: string) => void;
  text?: string;
  insertText: (text: string, location: string) => void;
}

export interface WordContext {
  document: {
    sections: {
      load: (fields: string) => void;
      items: WordSection[];
    };
    body: {
      font: {
        name?: string;
        size?: number;
        color?: string;
      };
      paragraphs: {
        load: (fields: string) => void;
        items: WordParagraph[];
      };
      insertTable: (
        rows: number,
        columns: number,
        location: string,
        data: string[][]
      ) => WordTable;
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

export interface FormatND30Result {
  success: boolean;
  message: string;
  appliedSettings: {
    margins: { top: number; bottom: number; left: number; right: number };
    font: string;
    fontSize: number;
  };
}

/**
 * TASK-304: Tính năng 1-Click "Chuẩn hóa theo Nghị định 30/2020/NĐ-CP" trong Word
 * Tự động thiết lập lề in chuẩn (30/15/20/20mm), đổi font Times New Roman 13pt và căn lề.
 */
export async function formatDocumentND30(): Promise<FormatND30Result> {
  const topPt = mmToPoints(20);
  const bottomPt = mmToPoints(20);
  const leftPt = mmToPoints(30);
  const rightPt = mmToPoints(15);

  const appliedSettings = {
    margins: { top: 20, bottom: 20, left: 30, right: 15 },
    font: "Times New Roman",
    fontSize: 13,
  };

  const word = getWordApi();
  if (!word) {
    return {
      success: true,
      message: "Chế độ mô phỏng (Demo Mode): Đã áp dụng quy chuẩn lề 30/15/20/20mm và font Times New Roman 13pt.",
      appliedSettings,
    };
  }

  await word.run(async (context) => {
    // 1. Căn lề in trang theo NĐ 30 trên toàn bộ Section của tài liệu
    const sections = context.document.sections;
    sections.load("items");
    await context.sync();

    sections.items.forEach((section) => {
      section.pageSetup.topMargin = topPt;
      section.pageSetup.bottomMargin = bottomPt;
      section.pageSetup.leftMargin = leftPt;
      section.pageSetup.rightMargin = rightPt;
    });

    // 2. Định dạng font chữ toàn bộ văn bản về Times New Roman 13pt
    const body = context.document.body;
    body.font.name = "Times New Roman";
    body.font.size = 13;
    body.font.color = "#000000";

    // 3. Căn đều 2 bên (Justify) cho các đoạn thân văn bản
    const paragraphs = body.paragraphs;
    paragraphs.load("items");
    await context.sync();

    paragraphs.items.forEach((p) => {
      p.load("text");
    });
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
        p.alignment = "Justified";
      }
    });

    await context.sync();
  });

  return {
    success: true,
    message: "Đã chuẩn hóa thành công lề in 30/15/20/20mm và font Times New Roman theo NĐ 30!",
    appliedSettings,
  };
}

/**
 * TASK-304: Chèn bảng Quốc hiệu & Tiêu ngữ chuẩn (Bảng ẩn 2 cột không viền) vào đầu tài liệu
 */
export async function insertNationalHeaderTable(): Promise<{ success: boolean; message: string }> {
  const word = getWordApi();
  if (!word) {
    return {
      success: true,
      message: "Chế độ mô phỏng: Đã chèn khối Quốc hiệu & Tiêu ngữ chuẩn NĐ 30 vào đầu văn bản.",
    };
  }

  await word.run(async (context) => {
    const body = context.document.body;
    const tableData = [
      [
        "CƠ QUAN CHỦ QUẢN\nTÊN CƠ QUAN BAN HÀNH\nSố: .../QĐ-...",
        "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n-------------------",
      ],
    ];

    const table = body.insertTable(1, 2, "Start", tableData);
    table.load("rows");
    await context.sync();

    // Thiết lập font cho bảng
    table.font.name = "Times New Roman";
    table.font.size = 12;

    await context.sync();
  });

  return {
    success: true,
    message: "Đã chèn khối Quốc hiệu & Tiêu ngữ chuẩn NĐ 30 vào đầu tài liệu.",
  };
}

/**
 * TASK-304: Chèn khối Nơi nhận & Ký tên chuẩn vào cuối tài liệu
 */
export async function insertSignatureFooterTable(): Promise<{ success: boolean; message: string }> {
  const word = getWordApi();
  if (!word) {
    return {
      success: true,
      message: "Chế độ mô phỏng: Đã chèn khối Nơi nhận & Chữ ký chuẩn NĐ 30 vào cuối văn bản.",
    };
  }

  await word.run(async (context) => {
    const body = context.document.body;
    const tableData = [
      [
        "Nơi nhận:\n- Như Điều ...;\n- Lưu: VT, VP.",
        "CHỨC VỤ NGƯỜI KÝ\n\n\n\n(Chữ ký, họ và tên)",
      ],
    ];

    const table = body.insertTable(1, 2, "End", tableData);
    table.font.name = "Times New Roman";
    table.font.size = 12;

    await context.sync();
  });

  return {
    success: true,
    message: "Đã chèn khối Nơi nhận & Ký tên chuẩn vào chân tài liệu Word.",
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
  if (!word) {
    return true;
  }

  await word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.insertText(newText, "Replace");
    await context.sync();
  });

  return true;
}
