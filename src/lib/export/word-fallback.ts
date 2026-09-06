/**
 * Bộ tạo tệp Microsoft Word dự phòng độc lập (Zero-dependency Word Generator).
 * Hoạt động cả ở Server (Node.js/Next.js) và Client (Trình duyệt).
 * Cho phép xuất tài liệu Word (.doc / WordML) chuẩn xác khi Document Service (FastAPI) không khả dụng.
 */

export function buildWordDocumentHtml(title: string, htmlContent: string): string {
  const cleanTitle = (title || "Van_ban").replace(/[^\w\s.-]/g, "_");

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
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page WordSection1 {
      size: 210mm 297mm;
      margin: 20mm 15mm 20mm 30mm;
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
    }
    h1, h2, h3, h4 {
      font-family: 'Times New Roman', Times, serif;
      color: #000000;
      page-break-after: avoid;
    }
    h1 { font-size: 14pt; font-weight: bold; text-align: center; margin: 12pt 0 6pt 0; }
    h2 { font-size: 13pt; font-weight: bold; margin: 10pt 0 4pt 0; }
    h3 { font-size: 13pt; font-weight: bold; font-style: italic; margin: 8pt 0 4pt 0; }
    p {
      font-size: 13pt;
      line-height: 1.35;
      margin: 0 0 6pt 0;
      text-align: justify;
      text-justify: inter-word;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 6pt 0 12pt 0;
      page-break-inside: avoid;
    }
    td, th {
      vertical-align: top;
      padding: 3pt 5pt;
      font-size: 13pt;
      line-height: 1.25;
    }
    /* Bảng ẩn Tiêu ngữ & Chữ ký */
    table[data-nd30-table="true"],
    table.nd30-table {
      border: none !important;
    }
    table[data-nd30-table="true"] td,
    table.nd30-table td {
      border: none !important;
      padding: 2pt 4pt;
    }
    /* Bảng dữ liệu thông thường */
    table:not([data-nd30-table="true"]):not(.nd30-table) td,
    table:not([data-nd30-table="true"]):not(.nd30-table) th {
      border: 1pt solid #000000;
    }
    table:not([data-nd30-table="true"]):not(.nd30-table) th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .signature-section {
      page-break-inside: avoid;
      margin-top: 12pt;
    }
    hr {
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
    ${htmlContent}
  </div>
</body>
</html>`;
}
