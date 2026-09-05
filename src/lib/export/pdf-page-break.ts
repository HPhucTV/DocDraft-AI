/**
 * Động cơ tối ưu hóa ngắt trang thông minh khi xuất PDF (TASK-311).
 * Tuân thủ Nghị định 30/2020/NĐ-CP:
 * - Tránh cắt ngang dòng chữ hoặc hàng bảng
 * - Giữ nguyên vẹn toàn bộ khối chữ ký và nơi nhận trên cùng một trang
 * - Tự động ngăn tiêu đề mục bị rớt lại đáy trang (Orphan Heading Prevention)
 */

export interface PageBreakOptimizationOptions {
  preserveSignatures?: boolean;
  preventOrphanHeadings?: boolean;
  avoidTableBreaks?: boolean;
}

/**
 * Tiền xử lý mã nguồn HTML trước khi gửi sang Document Service để render PDF vector.
 * Bổ sung các chỉ thị ngắt trang thông minh, thuộc tính ngữ nghĩa và inline style phòng ngừa vỡ trang.
 */
export function optimizeHtmlForPdfPageBreak(
  rawHtml: string,
  options: PageBreakOptimizationOptions = {}
): string {
  const {
    preserveSignatures = true,
    preventOrphanHeadings = true,
    avoidTableBreaks = true,
  } = options;

  let optimized = rawHtml;

  // 1. Tối ưu tiêu đề: tránh ngắt trang ngay sau tiêu đề (break-after: avoid)
  if (preventOrphanHeadings) {
    optimized = optimized.replace(
      /<(h[1-4])([^>]*)>/gi,
      (match, tag, attrs) => {
        if (/style=["'][^"']*break-after/i.test(attrs)) {
          return match;
        }
        if (/style=["']/i.test(attrs)) {
          return `<${tag}${attrs.replace(/style=["']([^"']*)["']/i, 'style="$1; break-after: avoid; page-break-after: avoid;"')}>`;
        }
        return `<${tag} style="break-after: avoid; page-break-after: avoid;"${attrs}>`;
      }
    );
  }

  // 2. Bảo vệ bảng dữ liệu: tránh xé đôi hàng bảng (break-inside: avoid)
  if (avoidTableBreaks) {
    optimized = optimized.replace(
      /<table([^>]*)>/gi,
      (match, attrs) => {
        if (/style=["'][^"']*break-inside/i.test(attrs)) {
          return match;
        }
        if (/style=["']/i.test(attrs)) {
          return `<table${attrs.replace(/style=["']([^"']*)["']/i, 'style="$1; break-inside: avoid; page-break-inside: avoid;"')}>`;
        }
        return `<table style="break-inside: avoid; page-break-inside: avoid;"${attrs}>`;
      }
    );
  }

  // 3. Bảo vệ khối chữ ký & Nơi nhận: đánh dấu data-table-type="signature" và class="signature-section"
  if (preserveSignatures) {
    // Tìm các bảng chứa "Nơi nhận" hoặc các chức danh ký kết
    optimized = optimized.replace(
      /<table([^>]*)>([\s\S]*?)<\/table>/gi,
      (match, attrs, content) => {
        const lower = content.toLowerCase();
        const isSignature =
          lower.includes("nơi nhận") ||
          lower.includes("thủ trưởng") ||
          lower.includes("giám đốc") ||
          lower.includes("chủ tịch") ||
          lower.includes("hiệu trưởng") ||
          lower.includes("người lập biểu") ||
          lower.includes("kế toán trưởng");

        if (isSignature) {
          let updatedAttrs = attrs;
          if (!/data-table-type=/i.test(updatedAttrs)) {
            updatedAttrs += ' data-table-type="signature"';
          }
          if (!/class=["'][^"']*signature-section/i.test(updatedAttrs)) {
            if (/class=["']/i.test(updatedAttrs)) {
              updatedAttrs = updatedAttrs.replace(/class=["']([^"']*)["']/i, 'class="$1 signature-section"');
            } else {
              updatedAttrs += ' class="signature-section"';
            }
          }
          return `<table${updatedAttrs}>${content}</table>`;
        }
        return match;
      }
    );
  }

  return optimized;
}
