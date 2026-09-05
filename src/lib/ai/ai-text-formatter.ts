/**
 * Bộ chuyển đổi và chuẩn hóa văn bản AI sang HTML chuẩn Nghị định 30/2020/NĐ-CP (TASK-206)
 * - Tự động bóc tách và loại bỏ hoàn toàn phần dư thừa (lời chào, dẫn nhập, lời kết của AI).
 * - Chuyển đổi Markdown thô (**in đậm**, bảng biểu, chữ ký) thành HTML ngữ nghĩa.
 * - Tự động tái cấu trúc Quốc hiệu - Tiêu ngữ và Chữ ký thành Bảng ẩn 2 cột chuẩn NĐ 30.
 * - Bọc các placeholder [...] trong huy hiệu thẻ vàng nhận diện.
 */

/**
 * Loại bỏ các đoạn dẫn nhập trò chuyện thường thấy của mô hình AI ở đầu câu
 */
function stripAiPreamble(text: string): string {
  let cleaned = text.trim();

  // Nếu có dải phân cách '---' ở phần đầu tách biệt lời chào và văn bản
  const dividerIndex = cleaned.indexOf("---");
  if (dividerIndex !== -1 && dividerIndex < 350) {
    const beforeDivider = cleaned.slice(0, dividerIndex).trim();
    // Kiểm tra xem đoạn trước divider có phải là lời chào AI không
    if (
      /dưới đây|sau đây|chào bạn|xin gửi|tôi đã|gửi bạn|mẫu văn bản|theo yêu cầu/i.test(
        beforeDivider
      )
    ) {
      cleaned = cleaned.slice(dividerIndex + 3).trim();
    }
  }

  // Loại bỏ các dòng đầu tiên nếu là lời chào xã giao
  const lines = cleaned.split("\n");
  while (lines.length > 0) {
    const firstLine = lines[0].trim().toLowerCase();
    if (
      firstLine.startsWith("dưới đây là") ||
      firstLine.startsWith("sau đây là") ||
      firstLine.startsWith("chào bạn") ||
      firstLine.startsWith("xin chào") ||
      firstLine.startsWith("tôi xin gửi") ||
      firstLine.startsWith("gửi bạn mẫu") ||
      firstLine.startsWith("đây là mẫu") ||
      firstLine.startsWith("bạn có thể tham khảo") ||
      firstLine.startsWith("theo yêu cầu của bạn")
    ) {
      lines.shift();
      // Nếu dòng tiếp theo là dấu gạch ngang hoặc dòng trống, bỏ tiếp
      if (lines.length > 0 && (lines[0].trim() === "---" || lines[0].trim() === "")) {
        lines.shift();
      }
    } else {
      break;
    }
  }

  return lines.join("\n").trim();
}

/**
 * Loại bỏ các đoạn kết luận, hỏi thăm xã giao ở cuối tin nhắn AI
 */
function stripAiPostamble(text: string): string {
  let cleaned = text.trim();

  // Kiểm tra nếu có dải phân cách '---' ở gần cuối tin nhắn
  const lastDividerIndex = cleaned.lastIndexOf("---");
  if (lastDividerIndex !== -1 && lastDividerIndex > cleaned.length - 400) {
    const afterDivider = cleaned.slice(lastDividerIndex + 3).trim();
    if (
      /nếu bạn|bạn có cần|hy vọng|chúc bạn|lưu ý:|cần hỗ trợ|cần thêm/i.test(
        afterDivider
      )
    ) {
      cleaned = cleaned.slice(0, lastDividerIndex).trim();
    }
  }

  // Cắt bỏ các câu hỏi han thường thấy ở các dòng cuối
  const lines = cleaned.split("\n");
  while (lines.length > 0) {
    const lastLine = lines[lines.length - 1].trim().toLowerCase();
    if (
      lastLine === "" ||
      lastLine === "---" ||
      /^(?:bạn có cần|bạn có muốn|nếu bạn|nếu cần|hy vọng|chúc bạn|lưu ý:|trên đây là|bạn hãy|bạn có thể thay|bạn cần tôi|hãy cho tôi biết)/i.test(
        lastLine
      )
    ) {
      lines.pop();
    } else {
      break;
    }
  }

  return lines.join("\n").trim();
}

/**
 * Bọc placeholder [TÊN_GỌI] thành huy hiệu chuẩn DOCDRAFT
 */
function formatPlaceholders(html: string): string {
  return html.replace(/\[([A-Z0-9_À-Ỹa-z0-9_\s/.\-]+)\]/g, (match) => {
    return `<span class="docdraft-placeholder-badge" data-placeholder="true">${match}</span>`;
  });
}

/**
 * Xử lý định dạng Markdown cơ bản (in đậm, in nghiêng, gạch ngang)
 */
function inlineMarkdownToHtml(text: string): string {
  let res = text;
  // **bold** -> <strong>bold</strong>
  res = res.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // *italic* -> <em>italic</em>
  res = res.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  return res;
}

/**
 * Kiểm tra xem đoạn văn bản có phải là toàn văn văn bản hành chính NĐ 30 không
 * (Có Quốc hiệu - Tiêu ngữ hoặc Cơ quan ban hành + Chữ ký)
 */
function isFullND30Document(text: string): boolean {
  const hasNationalMotto =
    /cộng hòa xã hội chủ nghĩa việt nam/i.test(text) ||
    /độc lập - tự do - hạnh phúc/i.test(text);
  const hasSignatory =
    /nơi nhận/i.test(text) ||
    /hiệu trưởng|giám đốc|chủ tịch|trưởng phòng|người làm đơn|thủ trưởng/i.test(
      text
    ) ||
    /ký, ghi rõ họ/i.test(text);

  return hasNationalMotto && hasSignatory;
}

/**
 * Chuyển đổi toàn văn một văn bản hành chính sang HTML hoàn chỉnh chuẩn NĐ 30
 */
function convertFullDocumentToND30Html(text: string): string {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l !== "---");

  let orgLines: string[] = [];
  let docNumber = "";
  let locationDate = "";
  let title = "";
  let subject = "";
  let recipient = "";
  const bodyParagraphs: string[] = [];
  const recipientsList: string[] = [];
  let signatoryTitle = "";
  let signatoryName = "";

  let parsingStage: "HEADER" | "TITLE" | "BODY" | "SIGNATURE" = "HEADER";

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanLine = rawLine.replace(/\*\*/g, "").trim();

    if (!cleanLine) continue;

    // 1. GIAI ĐOẠN HEADER: Tìm Cơ quan, Số hiệu, Quốc hiệu, Địa danh ngày tháng
    if (parsingStage === "HEADER") {
      if (cleanLine.toLowerCase().startsWith("số:")) {
        docNumber = cleanLine;
        continue;
      }
      if (/cộng hòa xã hội chủ nghĩa việt nam/i.test(cleanLine)) {
        continue;
      }
      if (/độc lập - tự do - hạnh phúc/i.test(cleanLine)) {
        continue;
      }
      if (/ngày.*tháng.*năm/i.test(cleanLine)) {
        locationDate = cleanLine;
        parsingStage = "TITLE";
        continue;
      }

      // Tên cơ quan (thường viết hoa ở các dòng đầu bên trái)
      if (
        orgLines.length < 3 &&
        !cleanLine.toLowerCase().startsWith("số:") &&
        !/ngày.*tháng.*năm/i.test(cleanLine)
      ) {
        orgLines.push(cleanLine);
        continue;
      }
    }

    // 2. GIAI ĐOẠN TITLE: Tên loại văn bản (GIẤY MỜI, QUYẾT ĐỊNH...) & Trích yếu
    if (parsingStage === "TITLE") {
      // Nhận diện Tiêu đề chính (thường in hoa toàn bộ)
      if (!title && (cleanLine === cleanLine.toUpperCase() || /giấy mời|quyết định|thông báo|báo cáo|tờ trình|công văn/i.test(cleanLine))) {
        title = cleanLine;
        continue;
      }

      // Nhận diện Trích yếu (Về việc...)
      if (title && !subject && (cleanLine.toLowerCase().startsWith("về việc") || cleanLine.toLowerCase().startsWith("v/v"))) {
        subject = cleanLine;
        continue;
      }

      // Kính gửi
      if (cleanLine.toLowerCase().startsWith("kính gửi:")) {
        recipient = cleanLine.replace(/^kính gửi:\s*/i, "").trim();
        parsingStage = "BODY";
        continue;
      }

      // Nếu không phải các trường trên, chuyển sang BODY
      parsingStage = "BODY";
    }

    // 3. GIAI ĐOẠN SIGNATURE: Nơi nhận và Người ký
    if (
      cleanLine.toLowerCase().startsWith("nơi nhận:") ||
      /^(hiệu trưởng|giám đốc|chủ tịch|trưởng phòng|người làm đơn|thủ trưởng)/i.test(cleanLine) ||
      cleanLine.toLowerCase().includes("ký, ghi rõ họ")
    ) {
      parsingStage = "SIGNATURE";
    }

    if (parsingStage === "SIGNATURE") {
      if (cleanLine.toLowerCase().startsWith("nơi nhận:")) {
        continue;
      }
      if (cleanLine.startsWith("-") && cleanLine.length < 60) {
        recipientsList.push(cleanLine);
        continue;
      }
      if (cleanLine.toLowerCase().includes("ký, ghi rõ họ")) {
        continue;
      }
      if (!signatoryTitle && (cleanLine === cleanLine.toUpperCase() || cleanLine.length < 35)) {
        signatoryTitle = cleanLine;
        continue;
      }
      if (signatoryTitle && !signatoryName && cleanLine.length < 40) {
        signatoryName = cleanLine;
        continue;
      }
    }

    // 4. GIAI ĐOẠN BODY
    if (parsingStage === "BODY") {
      if (cleanLine.toLowerCase().startsWith("kính gửi:")) {
        recipient = cleanLine.replace(/^kính gửi:\s*/i, "").trim();
        continue;
      }
      bodyParagraphs.push(rawLine);
    }
  }

  // Xây dựng Bảng Header 2 cột chuẩn NĐ 30
  const orgHtml = orgLines.length > 0 
    ? orgLines.map((l) => `<p style="text-align: center; margin: 0; font-size: 12pt; line-height: 1.3;"><strong>${l}</strong></p>`).join("")
    : `<p style="text-align: center; margin: 0; font-size: 12pt; line-height: 1.3;"><strong>[TÊN CƠ QUAN BAN HÀNH]</strong></p>`;

  const numberHtml = docNumber 
    ? `<p style="text-align: center; margin: 4px 0 0 0; font-size: 12pt; line-height: 1.3;">${docNumber}</p>`
    : `<p style="text-align: center; margin: 4px 0 0 0; font-size: 12pt; line-height: 1.3;">Số: [SỐ/KÝ HIỆU]</p>`;

  const dateHtml = locationDate 
    ? `<p style="text-align: center; margin: 6px 0 0 0; font-size: 13pt; font-style: italic; line-height: 1.3;">${locationDate}</p>`
    : `<p style="text-align: center; margin: 6px 0 0 0; font-size: 13pt; font-style: italic; line-height: 1.3;">[ĐỊA DANH], ngày [NGÀY] tháng [THÁNG] năm [NĂM]</p>`;

  const headerTable = `
<table data-nd30-table="true" data-table-type="header" style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 20px;">
  <tbody>
    <tr>
      <td data-col-width="40%" style="width: 40%; text-align: center; vertical-align: top; border: none; padding: 4px;">
        ${orgHtml}
        ${numberHtml}
      </td>
      <td data-col-width="60%" style="width: 60%; text-align: center; vertical-align: top; border: none; padding: 4px;">
        <p style="text-align: center; margin: 0; font-size: 13pt; line-height: 1.3;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
        <p style="text-align: center; margin: 2px 0 0 0; font-size: 14pt; line-height: 1.3;"><strong><u>Độc lập - Tự do - Hạnh phúc</u></strong></p>
        ${dateHtml}
      </td>
    </tr>
  </tbody>
</table>
`;

  // Xây dựng Tiêu đề & Trích yếu
  let titleHtml = "";
  if (title) {
    titleHtml += `<h2 style="text-align: center; font-size: 15pt; font-weight: bold; margin: 18px 0 6px 0; text-transform: uppercase;">${title}</h2>`;
  }
  if (subject) {
    titleHtml += `<p style="text-align: center; font-size: 13pt; font-weight: bold; margin: 0 0 16px 0;">${subject}</p>`;
  }
  if (recipient) {
    titleHtml += `<p style="text-align: center; font-size: 13pt; margin: 0 0 16px 0;"><strong>Kính gửi:</strong> ${recipient}</p>`;
  }

  // Xây dựng Thân văn bản
  const bodyHtml = bodyParagraphs
    .map((p) => {
      let formatted = inlineMarkdownToHtml(p);
      const isListItem = /^\d+\.\s+|-/.test(p);
      const style = isListItem
        ? `margin: 0 0 8px 0; line-height: 1.35; font-size: 13pt; text-align: justify;`
        : `margin: 0 0 8px 0; line-height: 1.35; font-size: 13pt; text-align: justify; text-indent: 1.25cm;`;
      return `<p style="${style}">${formatted}</p>`;
    })
    .join("\n");

  // Xây dựng Bảng Chữ ký 2 cột chuẩn NĐ 30
  const finalSignatoryTitle = signatoryTitle || "[CHỨC DANH NGƯỜI KÝ]";
  const finalSignatoryName = signatoryName || "[HỌ VÀ TÊN]";
  const defaultRecipients = recipientsList.length > 0 
    ? recipientsList.map((r) => `<p style="margin: 0; font-size: 11pt; line-height: 1.2;">${r}</p>`).join("")
    : `<p style="margin: 0; font-size: 11pt; line-height: 1.2;">- Như trên;</p><p style="margin: 0; font-size: 11pt; line-height: 1.2;">- Lưu: VT.</p>`;

  const signatureTable = `
<table data-nd30-table="true" data-table-type="signature" style="width: 100%; border: none; border-collapse: collapse; margin-top: 28px;">
  <tbody>
    <tr>
      <td data-col-width="50%" style="width: 50%; text-align: left; vertical-align: top; border: none; padding: 4px;">
        <p style="margin: 0 0 4px 0; font-size: 12pt; line-height: 1.2;"><strong><em><u>Nơi nhận:</u></em></strong></p>
        ${defaultRecipients}
      </td>
      <td data-col-width="50%" style="width: 50%; text-align: center; vertical-align: top; border: none; padding: 4px;">
        <p style="text-align: center; margin: 0; font-size: 13pt; line-height: 1.2;"><strong>${finalSignatoryTitle}</strong></p>
        <p style="text-align: center; margin: 2px 0 0 0; font-size: 11pt; font-style: italic; line-height: 1.2;">(Ký, ghi rõ họ và tên)</p>
        <p style="text-align: center; margin: 40px 0 0 0; font-size: 13pt; line-height: 1.2;"><strong>${finalSignatoryName}</strong></p>
      </td>
    </tr>
  </tbody>
</table>
`;

  return formatPlaceholders(headerTable + titleHtml + bodyHtml + signatureTable);
}

/**
 * Chuyển đổi một đoạn văn bản hoặc điều khoản lẻ sang HTML sạch sẽ
 */
function convertSnippetToCleanHtml(text: string): string {
  const paragraphs = text
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && p !== "---");

  const html = paragraphs
    .map((p) => {
      const formatted = inlineMarkdownToHtml(p);
      return `<p style="margin-bottom: 8px; line-height: 1.35; font-size: 13pt; text-align: justify;">${formatted}</p>`;
    })
    .join("\n");

  return formatPlaceholders(html);
}

/**
 * HÀM XỬ LÝ CHÍNH: Làm sạch văn bản phản hồi từ AI Copilot và chuyển đổi thành HTML chuẩn TipTap NĐ 30
 */
export function cleanAndFormatAiContentForEditor(rawAiText: string): string {
  if (!rawAiText || !rawAiText.trim()) return "";

  // 1. Tách bỏ lời chào đầu & lời chào đuôi
  const noPreamble = stripAiPreamble(rawAiText);
  const cleanDocumentBody = stripAiPostamble(noPreamble);

  // 2. Nếu là văn bản hành chính hoàn chỉnh (có Quốc hiệu hoặc cơ quan + chữ ký)
  if (isFullND30Document(cleanDocumentBody)) {
    return convertFullDocumentToND30Html(cleanDocumentBody);
  }

  // 3. Nếu là đoạn văn, điều khoản hoặc nội dung bổ sung thông thường
  return convertSnippetToCleanHtml(cleanDocumentBody);
}
