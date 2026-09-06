import { FormField, FormSchema } from "@/types/form-schema";

/**
 * Chuẩn hóa tên biến từ chuỗi text trong ngoặc [...] thành identifier hợp lệ
 * Ví dụ: "TÊN DOANH NGHIỆP" -> "ten_doanh_nghiep"
 */
export function slugifyVariableName(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "field";
}

/**
 * Trích xuất toàn bộ biến số dạng [BIẾN SỐ] từ chuỗi text/HTML
 */
export function extractPlaceholders(content: string): string[] {
  if (!content) return [];
  // Regex tìm các khối trong ngoặc vuông, từ 2 đến 60 ký tự, có dấu tiếng Việt
  const regex = /\[([A-Z0-9_\s\u00C0-\u1EF9/.-]{2,60})\]/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(content)) !== null) {
    const rawTag = match[1].trim();
    // Bỏ qua các tag HTML hoặc ký hiệu không phải biến số
    if (!rawTag.startsWith("<") && !rawTag.includes("http")) {
      matches.add(rawTag);
    }
  }
  return Array.from(matches);
}

/**
 * Tự động tạo FormSchema từ danh sách placeholders
 */
export function generateFormSchemaFromPlaceholders(placeholders: string[]): FormSchema {
  const fields: FormField[] = [];
  const usedNames = new Set<string>();

  for (const placeholder of placeholders) {
    let name = slugifyVariableName(placeholder);
    let counter = 1;
    while (usedNames.has(name)) {
      name = `${slugifyVariableName(placeholder)}_${counter++}`;
    }
    usedNames.add(name);

    const upper = placeholder.toUpperCase();
    let type: FormField["type"] = "text";

    if (upper.includes("NGÀY") || upper.includes("THÁNG") || upper.includes("NĂM") || upper.includes("DATE")) {
      type = "date";
    } else if (upper.includes("TIỀN") || upper.includes("KINH PHÍ") || upper.includes("CHI PHÍ") || upper.includes("VNĐ") || upper.includes("VND")) {
      type = "currency";
    } else if (upper.includes("SỐ LƯỢNG") || upper.includes("TỔNG SỐ") || upper.includes("MÃ SỐ")) {
      type = "text";
    } else if (upper.includes("NỘI DUNG") || upper.includes("LÝ DO") || upper.includes("MÔ TẢ") || upper.includes("Ý KIẾN")) {
      type = "textarea";
    }

    fields.push({
      name,
      label: placeholder,
      type,
      required: true,
      placeholder: `Nhập ${placeholder.toLowerCase()}...`,
    });
  }

  return { fields };
}

/**
 * Chuyển đổi văn bản plain text (.txt, .md) thành HTML có cấu trúc chuẩn cho Tiptap
 */
export function convertPlainTextToHtml(text: string): string {
  const lines = text.split(/\r?\n/);
  const htmlParts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    // Tiêu đề Markdown H1-H3
    if (trimmed.startsWith("### ")) {
      htmlParts.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      htmlParts.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      htmlParts.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
    } else {
      htmlParts.push(`<p>${escapeHtml(trimmed)}</p>`);
    }
  }

  return htmlParts.join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
