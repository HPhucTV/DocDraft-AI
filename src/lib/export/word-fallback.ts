/**
 * Bộ tạo tệp Microsoft Word chuẩn Nghị định 30/2020/NĐ-CP (Zero-dependency Word Generator).
 * Hoạt động đồng bộ 100% cả ở Server (Node.js/Next.js) và Client (Trình duyệt).
 * Khắc phục dứt điểm mọi lỗi vỡ layout khi xuất file Word từ Web:
 * 1. Triệt tiêu 100% lỗi dãn khoảng cách giữa các từ (Full Justify bug) do thẻ <br> trong <p>.
 * 2. Tự động đóng gói Header & Chữ ký thành Bảng ẩn 2 cột chuẩn NĐ 30 nếu văn bản chưa có bảng.
 * 3. Chuẩn hóa triệt để Bảng ẩn: loại bỏ viền mờ [+] của Word, cưỡng bức mso-border-alt: none.
 * 4. Căn lề trái toàn bộ danh sách (- , 1., 2.), đề mục in hoa để Word không kéo dãn.
 * 5. Tự động chuyển đổi gạch phím thô (_____) thành gạch chân nét liền <u> chuẩn Quốc hiệu/Tiêu ngữ.
 */

import { convertFullDocumentToND30Html, isFullND30Document } from "@/lib/ai/ai-text-formatter";

/**
 * Chuẩn hóa HTML chuyên sâu cho Microsoft Word Rendering Engine (MHTML / WordML)
 */
export function normalizeHtmlForWordDocument(htmlContent: string): string {
  if (!htmlContent || !htmlContent.trim()) return "<p></p>";

  let html = htmlContent.trim();

  // BƯỚC 1: XÓA BỎ CÁC DÒNG GẠCH PHÍM THÔ (_____, -----, .....)
  // Loại bỏ các dòng chỉ chứa dấu gạch dưới hoặc gạch ngang
  html = html.replace(/<p[^>]*>\s*[-_—–\s.]{3,}\s*<\/p>/gi, "");
  html = html.replace(/[-_—–]{4,}/g, "");

  // Đảm bảo "Độc lập - Tự do - Hạnh phúc" có gạch chân nét liền <u> chuẩn NĐ 30
  html = html.replace(
    /<strong>\s*(Độc lập\s*[-–—]\s*Tự do\s*[-–—]\s*Hạnh phúc)\s*<\/strong>(?!\s*<\/u>)/gi,
    "<strong><u>$1</u></strong>"
  );
  // Nếu đã có <u> nhưng chưa in đậm
  html = html.replace(
    /(?<!<strong>)<u>\s*(Độc lập\s*[-–—]\s*Tự do\s*[-–—]\s*Hạnh phúc)\s*<\/u>(?!<\/strong>)/gi,
    "<strong><u>$1</u></strong>"
  );

  // BƯỚC 2: TÁCH CÁC THẺ <br> TRONG <p> THÀNH CÁC THẺ <p> ĐỘC LẬP
  // Cốt lõi của việc sửa lỗi giãn cách từ trong Microsoft Word:
  // Word coi <br> là Manual Line Break (Shift+Enter) trong đoạn justify -> ép kéo dãn toàn bộ dòng trước <br>.
  // Tách thành thẻ <p> riêng sẽ biến mỗi dòng thành kết thúc đoạn văn (Hard Break) -> Word không bao giờ kéo dãn!
  html = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, innerContent) => {
    if (!/<br\s*\/?>/i.test(innerContent)) {
      return match;
    }

    // Tách theo <br>
    const lines = innerContent.split(/<br\s*\/?>/gi).map((l: string) => l.trim());
    
    // Nếu có nhiều hơn 2 thẻ <br> liên tiếp (khoảng trống để ký tên)
    // Thay vì sinh 5 thẻ <p> rỗng, ta gộp lại thành margin-top
    const resultParts: string[] = [];
    let emptyCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) {
        emptyCount++;
        continue;
      }

      let lineAttrs = attrs;
      if (emptyCount > 0) {
        const extraMargin = Math.min(emptyCount * 12, 45);
        if (/style="([^"]*)"/i.test(lineAttrs)) {
          lineAttrs = lineAttrs.replace(/style="([^"]*)"/i, `style="$1; margin-top: ${extraMargin}pt;"`);
        } else {
          lineAttrs += ` style="margin-top: ${extraMargin}pt;"`;
        }
        emptyCount = 0;
      }

      resultParts.push(`<p${lineAttrs}>${line}</p>`);
    }

    return resultParts.join("\n");
  });

  // BƯỚC 3: NẾU VĂN BẢN CHƯA CÓ BẢNG NHƯNG CÓ ĐẦY ĐỦ QUỐC HIỆU VÀ CHỮ KÝ
  // Tự động đóng gói thành Bảng ẩn 2 cột chuẩn Nghị định 30/2020/NĐ-CP
  const hasTable = /<table/i.test(html);
  if (!hasTable) {
    const plainText = html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    if (isFullND30Document(plainText)) {
      const structured = convertFullDocumentToND30Html(plainText);
      if (structured && structured.includes("<table")) {
        html = structured;
      }
    }
  }

  // BƯỚC 4: CHUẨN HÓA THẺ TABLE VÀ TD CHO MICROSOFT WORD ENGINE
  // Microsoft Word không hiểu CSS attribute selector như [data-nd30-table] hay :not()
  // Bắt buộc phải gắn trực tiếp border="0", class="nd30-table", mso-border-alt: none vào style
  html = html.replace(/<table([^>]*)>/gi, (_match, attrs) => {
    const isHiddenTable =
      attrs.includes("data-nd30-table") ||
      attrs.includes("nd30-table") ||
      attrs.includes("header") ||
      attrs.includes("signature") ||
      attrs.includes("border: none");

    if (isHiddenTable) {
      return `<table border="0" cellspacing="0" cellpadding="0" class="nd30-table" style="width: 100%; border-collapse: collapse; border: none !important; mso-border-alt: none !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; table-layout: fixed; margin-bottom: 12pt;">`;
    }
    return `<table border="1" cellspacing="0" cellpadding="4" class="data-table" style="width: 100%; border-collapse: collapse; border: 1pt solid #000000; margin: 8pt 0 12pt 0;">`;
  });

  // Chuẩn hóa thẻ <td> trong bảng ẩn
  html = html.replace(/<td([^>]*)>/gi, (match, attrs) => {
    const isHiddenCell =
      attrs.includes("border: none") ||
      attrs.includes("data-col-width") ||
      attrs.includes("width:") ||
      attrs.includes("text-align");

    if (isHiddenCell) {
      let widthStyle = "";
      const widthMatch = attrs.match(/width:\s*([^;"]+)/i);
      if (widthMatch) {
        widthStyle = `width: ${widthMatch[1].trim()};`;
      }

      let alignStyle = "text-align: center;";
      if (attrs.includes("text-align: left") || attrs.includes("text-align:left")) {
        alignStyle = "text-align: left;";
      }

      return `<td${attrs} style="${widthStyle} ${alignStyle} border: none !important; mso-border-alt: none !important; vertical-align: top; padding: 2pt 4pt;">`;
    }
    return match;
  });

  // BƯỚC 5: PHÂN LOẠI STYLE VÀ CĂN LỀ TỪNG ĐOẠN ĐỂ TRIỆT TIÊU JUSTIFY KÉO DÃN
  html = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, inner) => {
    const cleanText = inner.replace(/<[^>]+>/g, "").trim();

    // 1. Dòng danh sách gạch đầu dòng hoặc số: `- `, `+ `, `* `, `• `, `1. `, `2. `, `a) `
    const isListItem = /^[-+*•]|\d+\.|\b[a-z]\)/i.test(cleanText);
    if (isListItem) {
      return `<p class="list-item" style="font-size: 13pt; line-height: 1.35; margin: 0 0 3pt 0; text-align: left !important; text-justify: none !important; text-indent: 0 !important;">${inner}</p>`;
    }

    // 2. Đề mục in hoa hoặc phần dẫn nhập quan trọng
    const isSectionHeading =
      /^(bên giao|bên nhận|điều \d+|chương \d+|kính gửi:|nơi nhận:)/i.test(cleanText) ||
      (cleanText.toUpperCase() === cleanText &&
        cleanText.length > 4 &&
        cleanText.length < 50 &&
        !cleanText.includes("CỘNG HÒA") &&
        !cleanText.includes("ĐỘC LẬP"));

    if (isSectionHeading) {
      return `<p class="section-heading" style="font-size: 13pt; line-height: 1.35; margin: 8pt 0 3pt 0; text-align: left !important; text-justify: none !important; font-weight: bold; text-indent: 0 !important;">${inner}</p>`;
    }

    // 3. Ghi chú chữ ký: `(Ký, ghi rõ họ tên)`
    const isSignatureNote =
      /ký,\s*ghi rõ họ/i.test(cleanText) ||
      /ký và ghi rõ/i.test(cleanText) ||
      (cleanText.startsWith("(") && cleanText.endsWith(")"));

    if (isSignatureNote) {
      return `<p class="signature-note" style="font-size: 11pt; font-style: italic; line-height: 1.25; margin: 2pt 0 0 0; text-align: center !important; text-justify: none !important; text-indent: 0 !important;">${inner}</p>`;
    }

    // 4. Nếu thẻ <p> đã có căn giữa (Quốc hiệu, Tiêu đề, Cơ quan, Người ký)
    if (attrs.includes("text-align: center") || attrs.includes("text-align:center")) {
      if (/style="([^"]*)"/i.test(attrs)) {
        const newAttrs = attrs.replace(/style="([^"]*)"/i, 'style="$1; text-justify: none !important; text-indent: 0 !important;"');
        return `<p${newAttrs}>${inner}</p>`;
      }
      return `<p${attrs} style="text-align: center !important; text-justify: none !important; text-indent: 0 !important;">${inner}</p>`;
    }

    // 5. Nếu thẻ <p> trong ô Nơi nhận (thường bắt đầu bằng `- ` hoặc có style font-size 11pt)
    if (attrs.includes("11pt") || cleanText.toLowerCase().startsWith("nơi nhận:")) {
      return `<p style="font-size: 11pt; line-height: 1.2; margin: 0 0 2pt 0; text-align: left !important; text-justify: none !important; text-indent: 0 !important;">${inner}</p>`;
    }

    return match;
  });

  return html;
}

/**
 * Đóng gói tệp Microsoft Word (.doc / WordML MHTML) chuẩn thể thức văn bản hành chính Việt Nam.
 * Áp dụng quy chuẩn lề A4 theo Nghị định 30/2020/NĐ-CP:
 * - Lề trên: 20mm
 * - Lề dưới: 20mm
 * - Lề trái: 30mm (để đóng gáy hồ sơ)
 * - Lề phải: 15mm
 */
export function buildWordDocumentHtml(title: string, htmlContent: string): string {
  const cleanTitle = (title || "Van_ban").replace(/[^\w\s.-]/g, "_");
  const normalizedHtml = normalizeHtmlForWordDocument(htmlContent);

  return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${cleanTitle}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
      <w:ValidateAgainstSchemas/>
      <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
      <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
      <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
      <w:Compatibility>
        <w:BreakWrappedTables/>
        <w:SnapToGridInCell/>
        <w:WrapTextWithPunct/>
        <w:UseAsianBreakRules/>
        <w:DontGrowAutofit/>
      </w:Compatibility>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page WordSection1 {
      size: 210mm 297mm; /* Khổ giấy A4 chuẩn */
      margin: 20mm 15mm 20mm 30mm; /* Chuẩn NĐ 30: Trên 20mm, Dưới 20mm, Phải 15mm, Trái 30mm */
      mso-header-margin: 35.4pt;
      mso-footer-margin: 35.4pt;
      mso-paper-source: 0;
    }
    div.WordSection1 {
      page: WordSection1;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.35;
      color: #000000;
      background-color: #ffffff;
      mso-line-break-override: none;
    }
    h1, h2, h3, h4 {
      font-family: 'Times New Roman', Times, serif;
      color: #000000;
      page-break-after: avoid;
    }
    h1 {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      margin: 14pt 0 6pt 0;
      text-transform: uppercase;
      text-justify: none;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      margin: 12pt 0 4pt 0;
      text-transform: uppercase;
      text-justify: none;
    }
    h3 {
      font-size: 13pt;
      font-weight: bold;
      margin: 8pt 0 3pt 0;
      text-justify: none;
    }
    p {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.35;
      margin: 0 0 6pt 0;
      text-align: justify;
      text-justify: inter-word;
      mso-line-break-override: none;
    }
    /* Các quy tắc chống kéo dãn từ (Full Justify bug) cho danh sách và đề mục */
    p.list-item {
      text-align: left !important;
      text-justify: none !important;
      margin: 0 0 3pt 0 !important;
      text-indent: 0 !important;
    }
    p.section-heading {
      text-align: left !important;
      text-justify: none !important;
      font-weight: bold !important;
      margin: 8pt 0 3pt 0 !important;
      text-indent: 0 !important;
    }
    p.signature-note {
      font-size: 11pt !important;
      font-style: italic !important;
      line-height: 1.25 !important;
      margin: 2pt 0 0 0 !important;
      text-align: center !important;
      text-justify: none !important;
      text-indent: 0 !important;
    }
    p.text-center, .text-center {
      text-align: center !important;
      text-justify: none !important;
      text-indent: 0 !important;
    }
    p.text-left, .text-left {
      text-align: left !important;
      text-justify: none !important;
      text-indent: 0 !important;
    }
    /* Bảng ẩn Tiêu ngữ & Chữ ký chuẩn Nghị định 30/2020/NĐ-CP */
    table.nd30-table {
      width: 100% !important;
      border-collapse: collapse !important;
      border: none !important;
      mso-border-alt: none !important;
      margin: 0 0 12pt 0 !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
      table-layout: fixed !important;
      page-break-inside: avoid;
    }
    table.nd30-table td {
      border: none !important;
      mso-border-alt: none !important;
      padding: 2pt 4pt !important;
      vertical-align: top !important;
      line-height: 1.25 !important;
    }
    table.nd30-table td p {
      margin: 0 0 2pt 0 !important;
      line-height: 1.25 !important;
      text-indent: 0 !important;
    }
    /* Bảng dữ liệu nội dung thông thường */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      border: 1pt solid #000000;
      margin: 8pt 0 12pt 0;
      page-break-inside: avoid;
    }
    table.data-table td, table.data-table th {
      border: 1pt solid #000000;
      padding: 4pt 6pt;
      vertical-align: top;
      font-size: 13pt;
      line-height: 1.25;
    }
    table.data-table th {
      background-color: #f2f2f2;
      font-weight: bold;
      text-align: center;
    }
    /* Thẻ huy hiệu placeholder [...] */
    .docdraft-placeholder-badge {
      background-color: #fef08a;
      color: #854d0e;
      padding: 1pt 3pt;
      border-radius: 2pt;
    }
    /* Khối ký */
    .signature-section {
      page-break-inside: avoid;
      margin-top: 14pt;
    }
    /* Dấu ngắt trang */
    hr.page-break {
      page-break-after: always;
      border: none;
      visibility: hidden;
      height: 0;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="WordSection1">
    ${normalizedHtml}
  </div>
</body>
</html>`;
}
