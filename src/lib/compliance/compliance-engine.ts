/**
 * BỘ LUẬT KIỂM TRA & TỰ ĐỘNG SỬA THỂ THỨC NGHỊ ĐỊNH 30/2020/NĐ-CP (TASK-301 & TASK-302)
 * Tài liệu tham chiếu: docs/ai-prompts/compliance-rules-engine.md
 */

export interface ComplianceIssue {
  id: string;
  ruleId: "RULE_01" | "RULE_02" | "RULE_03" | "RULE_04" | "RULE_05" | "RULE_06" | "RULE_07";
  title: string;
  description: string;
  severity: "error" | "warning" | "info";
  autoFixable: boolean;
  recommendation: string;
  snippet?: string;
}

export interface ComplianceReport {
  score: number;
  level: "EXCELLENT" | "GOOD" | "FAILED";
  issues: ComplianceIssue[];
  stats: {
    errors: number;
    warnings: number;
    infos: number;
  };
  checkedAt: string;
}

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
}

export interface AutoFixResult {
  fixedAst: TiptapNode;
  fixesApplied: string[];
  initialScore: number;
  newScore: number;
}

// Helper đệ quy trích xuất toàn bộ text từ một node AST Tiptap
export function extractTextFromAst(node: unknown): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node === "object") {
    const tNode = node as TiptapNode;
    if (tNode.text) return tNode.text;
    if (Array.isArray(tNode.content)) {
      return tNode.content.map(extractTextFromAst).join(" ");
    }
  }
  return "";
}

// Helper lấy toàn bộ danh sách paragraph nodes từ cây AST
export function getAllParagraphNodes(ast: unknown): TiptapNode[] {
  const paragraphs: TiptapNode[] = [];
  function traverse(node: unknown) {
    if (!node || typeof node !== "object") return;
    const tNode = node as TiptapNode;
    if (tNode.type === "paragraph") {
      paragraphs.push(tNode);
    }
    if (Array.isArray(tNode.content)) {
      tNode.content.forEach(traverse);
    }
  }
  traverse(ast);
  return paragraphs;
}

/**
 * TẦNG 1: BỘ SOÁT LỖI QUY TẮC CỐ ĐỊNH (RULE-BASED ENGINE) - TASK-301
 * Thực thi kiểm tra 7 tiêu chí thể thức theo NĐ 30/2020/NĐ-CP với độ trễ < 30ms.
 */
export function checkCompliance(astOrHtml: unknown): ComplianceReport {
  const issues: ComplianceIssue[] = [];

  let fullText = "";
  let htmlString = "";

  if (typeof astOrHtml === "string") {
    htmlString = astOrHtml;
    fullText = astOrHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  } else if (astOrHtml && typeof astOrHtml === "object") {
    fullText = extractTextFromAst(astOrHtml).replace(/\s+/g, " ");
  }

  // ---------------------------------------------------------------------------
  // RULE_01: Quốc hiệu & Tiêu ngữ
  // ---------------------------------------------------------------------------
  const hasQuocHieu =
    fullText.includes("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM") ||
    fullText.toUpperCase().includes("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM");
  const hasTieuNgu =
    fullText.includes("Độc lập - Tự do - Hạnh phúc") ||
    fullText.includes("Độc lập – Tự do – Hạnh phúc");

  if (!hasQuocHieu || !hasTieuNgu) {
    issues.push({
      id: "issue_rule_01",
      ruleId: "RULE_01",
      title: "Thiếu hoặc sai thể thức Quốc hiệu & Tiêu ngữ",
      description:
        'Văn bản bắt buộc phải có Quốc hiệu "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" (in hoa đậm) và Tiêu ngữ "Độc lập - Tự do - Hạnh phúc" (đậm, nối bằng dấu gạch ngang).',
      severity: "error",
      autoFixable: true,
      recommendation: "Bổ sung khối Quốc hiệu, Tiêu ngữ chuẩn ở góc trên bên phải trang 1.",
    });
  }

  // ---------------------------------------------------------------------------
  // RULE_02: Tên cơ quan & Số ký hiệu
  // ---------------------------------------------------------------------------
  // Định dạng chuẩn: Số: 123/QĐ-UBND, Số: 45/TTr-SXD, v.v.
  const soKyHieuRegex = /Số:\s*[0-9]+(\/[A-ZĐa-z0-9_-]+)+/i;
  const hasSoKyHieu = soKyHieuRegex.test(fullText);

  // Không áp dụng cho Thư báo giá hoặc Hợp đồng/Thỏa thuận cá nhân nếu không có số
  const isHopDongOrBaoGia =
    fullText.includes("HỢP ĐỒNG") ||
    fullText.includes("THƯ BÁO GIÁ") ||
    fullText.includes("THỎA THUẬN");

  if (!hasSoKyHieu && !isHopDongOrBaoGia) {
    issues.push({
      id: "issue_rule_02",
      ruleId: "RULE_02",
      title: "Thiếu hoặc sai quy cách Số, ký hiệu văn bản",
      description:
        'Văn bản hành chính phải có Số và ký hiệu cơ quan ban hành theo định dạng: "Số: [Số]/[Ký hiệu loại VB]-[Ký hiệu CQBH]" (ví dụ: Số: 12/QĐ-UBND).',
      severity: "error",
      autoFixable: false,
      recommendation: 'Điền đầy đủ số ký hiệu văn bản hợp lệ (ví dụ: "Số: 01/TTr-BGD").',
    });
  }

  // ---------------------------------------------------------------------------
  // RULE_03: Trích yếu nội dung văn bản
  // ---------------------------------------------------------------------------
  const hasTrichYeu =
    fullText.includes("V/v") ||
    fullText.includes("Về việc") ||
    fullText.includes("về việc") ||
    fullText.includes("Quyết định về việc") ||
    fullText.includes("Tờ trình về việc");

  if (!hasTrichYeu && !isHopDongOrBaoGia) {
    issues.push({
      id: "issue_rule_03",
      ruleId: "RULE_03",
      title: "Thiếu dòng Trích yếu nội dung (V/v...)",
      description:
        "Văn bản hành chính cần có trích yếu tóm tắt nội dung chính bắt đầu bằng 'V/v' hoặc 'Về việc', in nghiêng và căn giữa bên dưới tiêu đề văn bản.",
      severity: "warning",
      autoFixable: true,
      recommendation: 'Thêm dòng trích yếu nội dung ngắn gọn (ví dụ: "V/v phê duyệt dự toán kinh phí").',
    });
  }

  // ---------------------------------------------------------------------------
  // RULE_04: Cú pháp Căn cứ pháp lý (Dấu chấm phẩy ";" và dấu phẩy ",")
  // ---------------------------------------------------------------------------
  const canCuRegex = /Căn cứ\s+[^;,\n]+([;,\.])/g;
  const canCuMatches = Array.from(fullText.matchAll(canCuRegex));

  if (canCuMatches.length > 0) {
    // Kiểm tra dòng căn cứ cuối cùng có kết thúc bằng dấu phẩy ',' không
    const lastMatch = canCuMatches[canCuMatches.length - 1];
    const lastPunctuation = lastMatch[1];
    const intermediateWrong = canCuMatches
      .slice(0, -1)
      .filter((m) => m[1] !== ";");

    if (lastPunctuation !== "," || intermediateWrong.length > 0) {
      issues.push({
        id: "issue_rule_04",
        ruleId: "RULE_04",
        title: "Sai dấu câu kết thúc các dòng Căn cứ pháp lý",
        description:
          'Theo NĐ 30/2020: Các dòng "Căn cứ..." ở giữa phải kết thúc bằng dấu chấm phẩy (;), và dòng "Căn cứ..." cuối cùng kết thúc bằng dấu phẩy (,).',
        severity: "warning",
        autoFixable: true,
        recommendation:
          "Sử dụng tính năng 1-Click Auto-fix để tự động chuyển đổi dấu câu đúng quy định.",
      });
    }
  }

  // ---------------------------------------------------------------------------
  // RULE_05: Khối Nơi nhận & Chữ ký
  // ---------------------------------------------------------------------------
  const hasNoiNhan = fullText.includes("Nơi nhận:") || fullText.includes("Nơi nhận :");
  const hasLuuVT =
    fullText.includes("Lưu: VT") ||
    fullText.includes("Lưu VT") ||
    fullText.includes("Lưu: văn thư");

  if (!hasNoiNhan && !isHopDongOrBaoGia) {
    issues.push({
      id: "issue_rule_05_noinhan",
      ruleId: "RULE_05",
      title: "Thiếu mục Nơi nhận",
      description:
        'Văn bản hành chính cần có mục "Nơi nhận:" in đậm nghiêng ở chân trang bên trái kèm danh sách cơ quan, phòng ban tiếp nhận.',
      severity: "error",
      autoFixable: true,
      recommendation: 'Bổ sung khối "Nơi nhận:" theo thể thức chuẩn.',
    });
  } else if (hasNoiNhan && !hasLuuVT && !isHopDongOrBaoGia) {
    issues.push({
      id: "issue_rule_05_luuvt",
      ruleId: "RULE_05",
      title: "Thiếu ký hiệu lưu trữ hồ sơ (- Lưu: VT...)",
      description:
        'Mục Nơi nhận theo Nghị định 30 bắt buộc phải có dòng cuối cùng là "- Lưu: VT, [Đơn vị soạn thảo]".',
      severity: "warning",
      autoFixable: true,
      recommendation: 'Thêm dòng "- Lưu: VT, [đơn vị]..." vào cuối mục Nơi nhận.',
    });
  }

  // ---------------------------------------------------------------------------
  // RULE_06: Placeholder chưa điền tồn đọng ([...])
  // ---------------------------------------------------------------------------
  const placeholderMatches = fullText.match(/\[[A-ZÀ-Ỹ0-9\s_–-]{3,}\]/g);
  if (placeholderMatches && placeholderMatches.length > 0) {
    issues.push({
      id: "issue_rule_06",
      ruleId: "RULE_06",
      title: `Còn ${placeholderMatches.length} vị trí dữ liệu mẫu chưa điền`,
      description: `Phát hiện các ô giữ chỗ chưa được người dùng bổ sung thông tin cụ thể: ${placeholderMatches.slice(0, 3).join(", ")}${placeholderMatches.length > 3 ? "..." : ""}`,
      severity: "error",
      autoFixable: false,
      recommendation: "Bấm vào các ô màu hổ phách trên màn hình soạn thảo để nhập thông tin thực tế.",
      snippet: placeholderMatches.slice(0, 5).join(", "),
    });
  }

  // ---------------------------------------------------------------------------
  // RULE_07: Quy chuẩn Font & Căn lề
  // ---------------------------------------------------------------------------
  if (htmlString && !htmlString.includes("text-align: justify") && !htmlString.includes('align="justify"')) {
    issues.push({
      id: "issue_rule_07",
      ruleId: "RULE_07",
      title: "Đoạn văn chưa được căn đều hai bên (Justify)",
      description:
        "Theo NĐ 30/2020: Toàn bộ phần nội dung điều khoản, thông báo phải được căn đều hai bên (justify) để văn bản trang trọng và liền mạch.",
      severity: "info",
      autoFixable: true,
      recommendation: "Căn đều hai bên cho các đoạn văn bản nội dung.",
    });
  }

  // ---------------------------------------------------------------------------
  // TÍNH ĐIỂM TUÂN THỦ (COMPLIANCE SCORE)
  // Score = 100 - (Errors * 20) - (Warnings * 10) - (Infos * 5)
  // ---------------------------------------------------------------------------
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const infos = issues.filter((i) => i.severity === "info").length;

  const rawScore = 100 - errors * 20 - warnings * 10 - infos * 5;
  const score = Math.max(0, Math.min(100, rawScore));

  let level: "EXCELLENT" | "GOOD" | "FAILED" = "FAILED";
  if (score >= 90) {
    level = "EXCELLENT";
  } else if (score >= 70) {
    level = "GOOD";
  }

  return {
    score,
    level,
    issues,
    stats: {
      errors,
      warnings,
      infos,
    },
    checkedAt: new Date().toISOString(),
  };
}

/**
 * THUẬT TOÁN TỰ ĐỘNG SỬA LỖI 1-CLICK (AUTO-FIX AST ENGINE) - TASK-302
 * Nhận cây Tiptap JSON AST và tự động nắn chỉnh:
 * 1. Sửa dấu kết thúc của các dòng "Căn cứ..." (dòng giữa thành ';', dòng cuối thành ',')
 * 2. Căn giữa và in nghiêng dòng trích yếu
 * 3. Bổ sung "- Lưu: VT." vào mục nơi nhận nếu thiếu
 * 4. Căn đều (justify) các đoạn nội dung
 */
export function autoFixComplianceAST(ast: unknown): AutoFixResult {
  if (!ast || typeof ast !== "object") {
    return {
      fixedAst: { type: "doc", content: [] },
      fixesApplied: [],
      initialScore: 0,
      newScore: 0,
    };
  }

  const initialReport = checkCompliance(ast);
  const fixesApplied: string[] = [];

  // Deep clone cây AST để không làm đột biến dữ liệu gốc ngoài ý muốn
  const clonedAst: TiptapNode = JSON.parse(JSON.stringify(ast));
  const paragraphs = getAllParagraphNodes(clonedAst);

  // 1. Tự động sửa dấu câu các dòng "Căn cứ..."
  const canCuNodes: TiptapNode[] = [];
  paragraphs.forEach((p) => {
    const text = extractTextFromAst(p).trim();
    if (text.startsWith("Căn cứ") || text.startsWith("Căn cứ:")) {
      canCuNodes.push(p);
    }
  });

  if (canCuNodes.length > 0) {
    canCuNodes.forEach((node, idx) => {
      const isLast = idx === canCuNodes.length - 1;
      const originalText = extractTextFromAst(node).trim();

      const expectedEnd = isLast ? "," : ";";
      if (!originalText.endsWith(expectedEnd)) {
        // Cập nhật text bên trong node
        if (Array.isArray(node.content) && node.content.length > 0) {
          const lastTextItem = node.content[node.content.length - 1];
          if (lastTextItem && lastTextItem.text) {
            lastTextItem.text = lastTextItem.text.replace(/[;,\.]$/, "") + expectedEnd;
          }
        }
        fixesApplied.push(
          `Đã chuẩn hóa dấu kết thúc dòng căn cứ ${idx + 1} thành dấu '${expectedEnd}'`
        );
      }
    });
  }

  // 2. Tự động căn giữa và in nghiêng dòng Trích yếu nội dung
  paragraphs.forEach((p) => {
    const text = extractTextFromAst(p).trim();
    if (
      (text.startsWith("V/v") || text.startsWith("Về việc")) &&
      text.length < 150
    ) {
      if (!p.attrs) p.attrs = {};
      p.attrs.textAlign = "center";

      // Bổ sung mark italic nếu chưa có
      if (Array.isArray(p.content)) {
        p.content.forEach((c) => {
          if (!c.marks) c.marks = [];
          if (!c.marks.some((m) => m.type === "italic")) {
            c.marks.push({ type: "italic" });
          }
        });
      }
      fixesApplied.push("Đã căn giữa và in nghiêng dòng trích yếu nội dung văn bản.");
    }
  });

  // 3. Tự động bổ sung dòng "- Lưu: VT." vào mục Nơi nhận nếu thiếu
  let noiNhanFound = false;
  let hasLuuVt = false;
  let noiNhanParagraph: TiptapNode | null = null;

  paragraphs.forEach((p) => {
    const text = extractTextFromAst(p);
    if (text.includes("Nơi nhận:")) {
      noiNhanFound = true;
      noiNhanParagraph = p;
    }
    if (text.includes("Lưu: VT") || text.includes("Lưu VT")) {
      hasLuuVt = true;
    }
  });

  if (noiNhanFound && !hasLuuVt && noiNhanParagraph) {
    // Thêm dòng lưu VT vào node nơi nhận
    if (Array.isArray(clonedAst.content)) {
      const pIdx = clonedAst.content.indexOf(noiNhanParagraph);
      const luuVtNode: TiptapNode = {
        type: "paragraph",
        attrs: { textAlign: "left" },
        content: [
          {
            type: "text",
            marks: [{ type: "italic" }],
            text: "- Lưu: VT, VP.",
          },
        ],
      };
      if (pIdx !== -1) {
        clonedAst.content.splice(pIdx + 1, 0, luuVtNode);
      } else {
        clonedAst.content.push(luuVtNode);
      }
      fixesApplied.push('Đã bổ sung dòng "- Lưu: VT, VP." vào chân mục Nơi nhận.');
    }
  }

  // 4. Căn đều 2 bên (Justify) cho các đoạn thân văn bản dài
  paragraphs.forEach((p) => {
    const text = extractTextFromAst(p).trim();
    if (
      text.length > 80 &&
      !text.startsWith("CỘNG HÒA") &&
      !text.startsWith("Độc lập") &&
      !text.startsWith("Nơi nhận") &&
      !text.startsWith("Số:") &&
      !text.startsWith("V/v")
    ) {
      if (!p.attrs) p.attrs = {};
      if (!p.attrs.textAlign || p.attrs.textAlign === "left") {
        p.attrs.textAlign = "justify";
      }
    }
  });

  const finalReport = checkCompliance(clonedAst);

  return {
    fixedAst: clonedAst,
    fixesApplied,
    initialScore: initialReport.score,
    newScore: finalReport.score,
  };
}
