/**
 * ==============================================================================
 * DOCDRAFT AI — GOOGLE DOCS WORKSPACE ADD-ON (TASK-502)
 * Chuẩn hóa thể thức văn bản hành chính theo Nghị định 30/2020/NĐ-CP & Trợ lý AI
 * ==============================================================================
 */

/**
 * Tạo menu "DocDraft AI" trên thanh công cụ của Google Docs khi mở tệp
 */
function onOpen(e) {
  var ui = DocumentApp.getUi();
  ui.createMenu("DocDraft AI (Nghị định 30)")
    .addItem("Mở bảng điều khiển (Sidebar)", "showSidebar")
    .addSeparator()
    .addItem("⚡ 1-Click: Căn lề 30/15 & Times 13pt", "formatND30GoogleDocs")
    .addItem("➕ Chèn Quốc hiệu & Tiêu ngữ chuẩn", "insertNationalHeaderGoogleDocs")
    .addItem("➕ Chèn Nơi nhận & Chữ ký chuẩn", "insertSignatureGoogleDocs")
    .addToUi();
}

/**
 * Trigger cho Google Workspace Add-on Homepage
 */
function onHomepage(e) {
  return createWorkspaceCard();
}

/**
 * Hiển thị thanh Task Pane Sidebar trong Google Docs
 */
function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("Sidebar")
    .setTitle("DocDraft AI — Trợ lý Nghị định 30")
    .setWidth(360);
  DocumentApp.getUi().showSidebar(html);
}

/**
 * TASK-502: 1-Click Chuẩn hóa thể thức Nghị định 30/2020/NĐ-CP trong Google Docs
 * - Lề trái: 30 mm (~85.04 pt)
 * - Lề phải: 15 mm (~42.52 pt)
 * - Lề trên: 20 mm (~56.7 pt)
 * - Lề dưới: 20 mm (~56.7 pt)
 * - Phông chữ: Times New Roman, cỡ 13pt
 * - Giãn dòng: 1.25x - 1.35x, căn đều 2 bên (Justified)
 */
function formatND30GoogleDocs() {
  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();

  // 1. Thiết lập lề in chuẩn Nghị định 30 (1 mm ≈ 2.83465 pt)
  body.setMarginTop(56.7);      // 20mm
  body.setMarginBottom(56.7);   // 20mm
  body.setMarginLeft(85.04);    // 30mm
  body.setMarginRight(42.52);   // 15mm

  // 2. Thiết lập phông chữ Times New Roman và cỡ chữ 13pt
  var paragraphs = body.getParagraphs();
  for (var i = 0; i < paragraphs.length; i++) {
    var p = paragraphs[i];
    var text = p.getText().trim();

    // Không can thiệp nếu là đoạn trống hoàn toàn
    if (text.length > 0) {
      p.setFontFamily("Times New Roman");
      p.setFontSize(13);
      p.setLineSpacing(1.25);

      // Căn đều hai bên cho các đoạn văn nội dung
      if (
        text.length > 60 &&
        !text.startsWith("CỘNG HÒA") &&
        !text.startsWith("Độc lập") &&
        !text.startsWith("Số:") &&
        !text.startsWith("Nơi nhận:")
      ) {
        p.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
      }
    }
  }

  return {
    success: true,
    message: "Đã chuẩn hóa thành công: Lề 30/15/20/20mm, Font Times New Roman 13pt và căn đều 2 bên."
  };
}

/**
 * TASK-502: Chèn bảng Quốc hiệu & Tiêu ngữ chuẩn (Bảng ẩn 2 cột không viền) vào đầu Google Docs
 */
function insertNationalHeaderGoogleDocs() {
  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();

  var tableData = [
    [
      "CƠ QUAN CHỦ QUẢN\nTÊN CƠ QUAN BAN HÀNH\nSố: .../QĐ-...",
      "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n---------------"
    ]
  ];

  // Chèn bảng vào đầu tài liệu
  var table = body.insertTable(0, tableData);
  
  // Tùy chỉnh bảng ẩn không viền chuẩn NĐ 30
  table.setBorderWidth(0);
  
  // Căn chỉnh ô trái (Cơ quan ban hành)
  var cellLeft = table.getCell(0, 0);
  cellLeft.setWidth(215); // ~75mm
  var pLeft = cellLeft.getChild(0).asParagraph();
  pLeft.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  pLeft.setFontFamily("Times New Roman");
  pLeft.setFontSize(12);

  // Căn chỉnh ô phải (Quốc hiệu & Tiêu ngữ)
  var cellRight = table.getCell(0, 1);
  cellRight.setWidth(270); // ~95mm
  var pRight = cellRight.getChild(0).asParagraph();
  pRight.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  pRight.setFontFamily("Times New Roman");
  pRight.setFontSize(12);

  return {
    success: true,
    message: "Đã chèn khối Quốc hiệu & Tiêu ngữ chuẩn NĐ 30 vào đầu tài liệu."
  };
}

/**
 * TASK-502: Chèn khối Nơi nhận & Ký tên chuẩn (Bảng ẩn 2 cột 50/50) vào cuối Google Docs
 */
function insertSignatureGoogleDocs() {
  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();

  var tableData = [
    [
      "Nơi nhận:\n- Như Điều ...;\n- Lưu: VT, VP.",
      "CHỨC VỤ NGƯỜI KÝ\n\n\n\n(Chữ ký, họ và tên)"
    ]
  ];

  var table = body.appendTable(tableData);
  table.setBorderWidth(0);

  // Ô trái: Nơi nhận (chữ nghiêng, cỡ 11)
  var cellLeft = table.getCell(0, 0);
  cellLeft.setWidth(230);
  var pLeft = cellLeft.getChild(0).asParagraph();
  pLeft.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
  pLeft.setFontFamily("Times New Roman");
  pLeft.setFontSize(11);

  // Ô phải: Chức vụ & Ký tên (chữ in hoa đậm, cỡ 13)
  var cellRight = table.getCell(0, 1);
  cellRight.setWidth(255);
  var pRight = cellRight.getChild(0).asParagraph();
  pRight.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  pRight.setFontFamily("Times New Roman");
  pRight.setFontSize(13);

  return {
    success: true,
    message: "Đã chèn khối Nơi nhận & Ký tên chuẩn vào cuối tài liệu."
  };
}

/**
 * Đọc văn bản đang được bôi đen trong Google Docs
 */
function getSelectedTextGoogleDocs() {
  var selection = DocumentApp.getActiveDocument().getSelection();
  if (!selection) return "";

  var textElements = [];
  var elements = selection.getSelectedElements();

  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    if (element.isPartial()) {
      var text = element.getElement().asText().getText();
      var start = element.getStartOffset();
      var end = element.getEndOffsetInclusive();
      textElements.push(text.substring(start, end + 1));
    } else if (element.getElement().asText) {
      textElements.push(element.getElement().asText().getText());
    }
  }

  return textElements.join("\n");
}

/**
 * Thay thế đoạn văn bản đang bôi đen bằng văn bản mới từ AI
 */
function replaceSelectedTextGoogleDocs(newText) {
  var selection = DocumentApp.getActiveDocument().getSelection();
  if (!selection) return false;

  var elements = selection.getSelectedElements();
  if (elements.length > 0) {
    var firstEl = elements[0];
    if (firstEl.getElement().asText) {
      var asText = firstEl.getElement().asText();
      if (firstEl.isPartial()) {
        asText.deleteText(firstEl.getStartOffset(), firstEl.getEndOffsetInclusive());
        asText.insertText(firstEl.getStartOffset(), newText);
      } else {
        asText.setText(newText);
      }
      return true;
    }
  }
  return false;
}

/**
 * Chèn đoạn văn bản tại con trỏ hoặc cuối tài liệu
 */
function insertTextAtCursorGoogleDocs(text) {
  var doc = DocumentApp.getActiveDocument();
  var cursor = doc.getCursor();
  if (cursor) {
    cursor.insertText(text);
  } else {
    doc.getBody().appendParagraph(text);
  }
  return true;
}

/**
 * Xây dựng Card UI cho Google Workspace Add-on Home Card
 */
function createWorkspaceCard() {
  var card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("DocDraft AI")
        .setSubtitle("Trợ lý Văn bản Hành chính NĐ 30")
        .setImageUrl("https://docdraft.vn/favicon.ico")
    );

  var section = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph().setText(
        "Chuẩn hóa thể thức theo Nghị định 30/2020/NĐ-CP và trợ lý AI sinh văn bản thông minh ngay trong Google Docs."
      )
    )
    .addWidget(
      CardService.newTextButton()
        .setText("Mở Thanh công cụ DocDraft AI")
        .setOnClickAction(
          CardService.newAction().setFunctionName("showSidebar")
        )
    );

  card.addSection(section);
  return card.build();
}
