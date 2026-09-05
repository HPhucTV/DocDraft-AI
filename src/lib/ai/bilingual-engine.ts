import { z } from "zod";
import {
  resolveAIKey,
  createDeepSeekClient,
  createGeminiClient,
  DEFAULT_DEEPSEEK_MODEL,
  DEFAULT_GEMINI_MODEL,
  AIProvider,
} from "./ai-service";

export const bilingualPartySchema = z.object({
  nameVi: z.string().min(1, "Tên bên (tiếng Việt) không được để trống"),
  nameEn: z.string().min(1, "Tên bên (tiếng Anh) không được để trống"),
  addressVi: z.string().optional(),
  addressEn: z.string().optional(),
  representativeVi: z.string().min(1, "Người đại diện (tiếng Việt) không được để trống"),
  representativeEn: z.string().min(1, "Người đại diện (tiếng Anh) không được để trống"),
  positionVi: z.string().optional(),
  positionEn: z.string().optional(),
  taxCode: z.string().optional(),
});

export const bilingualGenerateSchema = z.object({
  contractType: z.enum([
    "COMMERCIAL_CONTRACT",
    "NDA",
    "SERVICE_AGREEMENT",
    "MOU",
    "CUSTOM",
  ]),
  titleVi: z.string().min(1, "Tiêu đề tiếng Việt không được để trống"),
  titleEn: z.string().min(1, "Tiêu đề tiếng Anh không được để trống"),
  partyA: bilingualPartySchema,
  partyB: bilingualPartySchema,
  scopeVi: z.string().min(1, "Phạm vi hợp đồng tiếng Việt không được để trống"),
  scopeEn: z.string().min(1, "Phạm vi hợp đồng tiếng Anh không được để trống"),
  effectiveDate: z.string().min(1, "Ngày hiệu lực không được để trống"),
  durationMonths: z.number().optional(),
  prevailingLanguage: z
    .enum(["VIETNAMESE", "ENGLISH", "EQUAL"])
    .default("VIETNAMESE"),
  disputeResolutionVi: z.string().optional(),
  disputeResolutionEn: z.string().optional(),
  preferredProvider: z.enum(["deepseek", "gemini"]).optional().default("deepseek"),
});

export type BilingualGenerateInput = z.infer<typeof bilingualGenerateSchema>;
export type BilingualParty = z.infer<typeof bilingualPartySchema>;

export interface BilingualClause {
  articleNumber: number;
  titleVi: string;
  titleEn: string;
  contentVi: string;
  contentEn: string;
}

export const BILINGUAL_SYSTEM_PROMPT = `BẠN LÀ LUẬT SƯ PHÁP CHẾ QUỐC TẾ CHUYÊN SOẠN THẢO HỢP ĐỒNG THƯƠNG MẠI SONG NGỮ VIỆT - ANH (BILINGUAL COMMERCIAL CONTRACTS).

Nhiệm vụ: Tiếp nhận dữ liệu biến số hợp đồng từ người dùng, sinh ra văn bản hợp đồng song ngữ song song 2 cột (Dual-column table) hoàn chỉnh, chuẩn xác pháp lý theo Bộ luật Dân sự, Luật Thương mại Việt Nam và thông lệ thương mại quốc tế (Incoterms, UNIDROIT).

QUY TẮC ĐỊNH DẠNG BẮT BUỘC:
1. TIÊU ĐỀ CHÍNH & MỞ ĐẦU:
   - Dùng bảng 2 cột không viền (border:none):
     * Cột 1 (50%): Tên văn bản tiếng Việt in hoa, in đậm (Vd: HỢP ĐỒNG DỊCH VỤ THƯƠNG MẠI).
     * Cột 2 (50%): Tên văn bản tiếng Anh in hoa, in đậm (Vd: COMMERCIAL SERVICE AGREEMENT).
   - Địa điểm, ngày tháng ký kết hiển thị cả 2 ngôn ngữ.

2. THÔNG TIN CÁC BÊN (PARTIES):
   - Trình bày dạng bảng 2 cột đối ứng từng thông tin:
     * Cột 1: BÊN A (Tên, địa chỉ, người đại diện, chức vụ, mã số thuế).
     * Cột 2: PARTY A (Name, address, representative, title, tax code).

3. CÁC ĐIỀU KHOẢN HỢP ĐỒNG (ARTICLES & CLAUSES):
   - BẮT BUỘC đặt trong bảng: <table class="bilingual-table" style="width:100%; border-collapse:collapse; margin: 15px 0;">
   - Mỗi Điều khoản là một hàng (<tr>) với 2 cột (<td>), mỗi cột rộng 50%, có đường kẻ phân cách mỏng giữa các điều khoản:
     * Cột trái (width:50%; vertical-align:top; padding:8px 12px; text-align:justify; border:1px solid #cbd5e1;): Bản tiếng Việt.
     * Cột phải (width:50%; vertical-align:top; padding:8px 12px; text-align:justify; border:1px solid #cbd5e1;): Bản tiếng Anh đối ứng chính xác từng câu chữ.
   - Các điều khoản cơ bản gồm:
     * Điều 1 / Article 1: Phạm vi công việc / Scope of Work
     * Điều 2 / Article 2: Phí dịch vụ & Thanh toán / Fees and Payment Terms
     * Điều 3 / Article 3: Quyền và Nghĩa vụ các bên / Rights and Obligations of Parties
     * Điều 4 / Article 4: Bảo mật thông tin / Confidentiality
     * Điều 5 / Article 5: Bất khả kháng / Force Majeure
     * Điều 6 / Article 6: Luật áp dụng & Giải quyết tranh chấp / Governing Law and Dispute Resolution
     * Điều 7 / Article 7: Hiệu lực và Ngôn ngữ ưu tiên / Validity and Prevailing Language

4. ĐIỀU KHOẢN NGÔN NGỮ ƯU TIÊN (PREVAILING LANGUAGE CLAUSE):
   - Nếu prevailingLanguage là "VIETNAMESE": Nêu rõ "Hợp đồng được lập bằng tiếng Việt và tiếng Anh. Trong trường hợp có sự mâu thuẫn giữa hai bản, bản tiếng Việt sẽ được ưu tiên áp dụng."
   - Nếu prevailingLanguage là "ENGLISH": "This Agreement is made in Vietnamese and English. In case of any discrepancies between the two versions, the English version shall prevail."
   - Nếu "EQUAL": "Both language versions have equal legal validity."

5. KHỐI KÝ TÊN (SIGNATURE BLOCK):
   - Dùng bảng 2 cột đối ứng cho ĐẠI DIỆN BÊN A / FOR PARTY A và ĐẠI DIỆN BÊN B / FOR PARTY B.

QUY TẮC CHỐNG ẢO GIÁC:
- Mọi dữ liệu chưa được người dùng cung cấp phải đặt dưới dạng: [THÔNG TIN CHƯA CUNG CẤP / INFORMATION NOT PROVIDED]
- Tuyệt đối không tự bịa đặt tài khoản ngân hàng, số tiền nếu không có trong input.

OUTPUT ENFORCEMENT:
- Chỉ trả về mã HTML ngữ nghĩa hoàn chỉnh (table, tr, td, th, h2, p, strong, em).
- Không bọc markdown \`\`\`html, không thêm lời giải thích.`;

export class BilingualEngine {
  /**
   * Tạo prompt yêu cầu AI sinh văn bản song ngữ
   */
  static buildPrompt(input: BilingualGenerateInput): string {
    const languageNote =
      input.prevailingLanguage === "ENGLISH"
        ? "Ngôn ngữ tiếng Anh được ưu tiên áp dụng khi có mâu thuẫn (English prevails)."
        : input.prevailingLanguage === "EQUAL"
        ? "Hai ngôn ngữ có giá trị pháp lý ngang nhau (Both versions have equal validity)."
        : "Ngôn ngữ tiếng Việt được ưu tiên áp dụng khi có mâu thuẫn (Vietnamese prevails).";

    return `Hãy soạn thảo hợp đồng song ngữ Anh - Việt theo thông tin sau:
1. LOẠI VĂN BẢN: ${input.contractType}
- Tiêu đề Tiếng Việt: ${input.titleVi}
- Tiêu đề Tiếng Anh: ${input.titleEn}
- Ngày ký kết / hiệu lực: ${input.effectiveDate}
- Thời hạn hiệu lực: ${input.durationMonths ? `${input.durationMonths} tháng` : "Theo thỏa thuận"}
- Ngôn ngữ ưu tiên: ${languageNote}

2. THÔNG TIN BÊN A (PARTY A):
- Tên tiếng Việt: ${input.partyA.nameVi} | Tên tiếng Anh: ${input.partyA.nameEn}
- Địa chỉ tiếng Việt: ${input.partyA.addressVi || "[ĐỊA CHỈ BÊN A]"} | Tiếng Anh: ${input.partyA.addressEn || "[PARTY A ADDRESS]"}
- Đại diện tiếng Việt: ${input.partyA.representativeVi} (${input.partyA.positionVi || "Đại diện theo pháp luật"})
- Đại diện tiếng Anh: ${input.partyA.representativeEn} (${input.partyA.positionEn || "Legal Representative"})
- Mã số thuế: ${input.partyA.taxCode || "[MÃ SỐ THUẾ BÊN A]"}

3. THÔNG TIN BÊN B (PARTY B):
- Tên tiếng Việt: ${input.partyB.nameVi} | Tên tiếng Anh: ${input.partyB.nameEn}
- Địa chỉ tiếng Việt: ${input.partyB.addressVi || "[ĐỊA CHỈ BÊN B]"} | Tiếng Anh: ${input.partyB.addressEn || "[PARTY B ADDRESS]"}
- Đại diện tiếng Việt: ${input.partyB.representativeVi} (${input.partyB.positionVi || "Đại diện theo pháp luật"})
- Đại diện tiếng Anh: ${input.partyB.representativeEn} (${input.partyB.positionEn || "Legal Representative"})
- Mã số thuế: ${input.partyB.taxCode || "[MÃ SỐ THUẾ BÊN B]"}

4. PHẠM VI HỢP ĐỒNG (SCOPE OF WORK):
- Nội dung tiếng Việt: ${input.scopeVi}
- Nội dung tiếng Anh: ${input.scopeEn}

5. GIẢI QUYẾT TRANH CHẤP (DISPUTE RESOLUTION):
- Tiếng Việt: ${input.disputeResolutionVi || "Tại Trung tâm Trọng tài Quốc tế Việt Nam (VIAC) theo Quy tắc tố tụng trọng tài của Trung tâm này."}
- Tiếng Anh: ${input.disputeResolutionEn || "At Vietnam International Arbitration Centre (VIAC) in accordance with its Arbitration Rules."}`;
  }

  /**
   * Tạo cấu trúc bảng HTML song ngữ 2 cột song song chuẩn
   */
  static renderBilingualTable(clauses: BilingualClause[]): string {
    const rows = clauses
      .map(
        (c) => `
  <tr>
    <td style="width:50%; vertical-align:top; padding:12px; border:1px solid #cbd5e1; text-align:justify; line-height:1.6;">
      <p style="margin:0 0 6px 0;"><strong>Điều ${c.articleNumber}. ${c.titleVi}</strong></p>
      <p style="margin:0;">${c.contentVi}</p>
    </td>
    <td style="width:50%; vertical-align:top; padding:12px; border:1px solid #cbd5e1; text-align:justify; line-height:1.6;">
      <p style="margin:0 0 6px 0;"><strong>Article ${c.articleNumber}. ${c.titleEn}</strong></p>
      <p style="margin:0;">${c.contentEn}</p>
    </td>
  </tr>`
      )
      .join("\n");

    return `<table class="bilingual-table" style="width:100%; border-collapse:collapse; margin:20px 0; font-family:'Times New Roman', serif; font-size:13pt;">
  <thead>
    <tr style="background-color:#f1f5f9; border:1px solid #cbd5e1;">
      <th style="width:50%; text-align:center; padding:10px; font-weight:bold; border:1px solid #cbd5e1;">TIẾNG VIỆT (VIETNAMESE)</th>
      <th style="width:50%; text-align:center; padding:10px; font-weight:bold; border:1px solid #cbd5e1;">TIẾNG ANH (ENGLISH)</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>`;
  }

  /**
   * Chuyển đổi mã HTML song ngữ sang cấu trúc Tiptap / ProseMirror AST Node
   */
  static generateTiptapAstFromClauses(
    titleVi: string,
    titleEn: string,
    clauses: BilingualClause[]
  ) {
    return {
      type: "doc",
      content: [
        // Heading Title
        {
          type: "heading",
          attrs: { level: 2, textAlign: "center" },
          content: [
            {
              type: "text",
              text: `${titleVi.toUpperCase()} / ${titleEn.toUpperCase()}`,
            },
          ],
        },
        // Bilingual Table
        {
          type: "table",
          attrs: { isBilingual: true },
          content: [
            // Header row
            {
              type: "tableRow",
              content: [
                {
                  type: "tableHeader",
                  attrs: { colspan: 1, rowspan: 1, colwidth: [350] },
                  content: [
                    {
                      type: "paragraph",
                      attrs: { textAlign: "center" },
                      content: [
                        {
                          type: "text",
                          marks: [{ type: "bold" }],
                          text: "TIẾNG VIỆT (VIETNAMESE)",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "tableHeader",
                  attrs: { colspan: 1, rowspan: 1, colwidth: [350] },
                  content: [
                    {
                      type: "paragraph",
                      attrs: { textAlign: "center" },
                      content: [
                        {
                          type: "text",
                          marks: [{ type: "bold" }],
                          text: "TIẾNG ANH (ENGLISH)",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            // Clause rows
            ...clauses.map((c) => ({
              type: "tableRow",
              content: [
                {
                  type: "tableCell",
                  attrs: { colspan: 1, rowspan: 1, colwidth: [350] },
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          marks: [{ type: "bold" }],
                          text: `Điều ${c.articleNumber}. ${c.titleVi}`,
                        },
                      ],
                    },
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: c.contentVi }],
                    },
                  ],
                },
                {
                  type: "tableCell",
                  attrs: { colspan: 1, rowspan: 1, colwidth: [350] },
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          marks: [{ type: "bold" }],
                          text: `Article ${c.articleNumber}. ${c.titleEn}`,
                        },
                      ],
                    },
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: c.contentEn }],
                    },
                  ],
                },
              ],
            })),
          ],
        },
      ],
    };
  }

  /**
   * Sinh văn bản song ngữ hoàn chỉnh bằng AI (DeepSeek v4 Flash + Gemini 3.7 Flash fallback)
   */
  static async generateBilingual(
    userId: string | null,
    input: BilingualGenerateInput
  ): Promise<{ html: string; ast: unknown; provider: AIProvider }> {
    const validated = bilingualGenerateSchema.parse(input);
    const resolvedKey = await resolveAIKey(userId, validated.preferredProvider);

    const userPrompt = this.buildPrompt(validated);

    const messages = [
      {
        role: "system" as const,
        content: BILINGUAL_SYSTEM_PROMPT,
      },
      {
        role: "user" as const,
        content: userPrompt,
      },
    ];

    let responseContent = "";
    let finalProvider: AIProvider = resolvedKey.provider;

    if (resolvedKey.provider === "deepseek") {
      try {
        const client = createDeepSeekClient(resolvedKey.apiKey);
        const res = await client.chat.completions.create({
          model: DEFAULT_DEEPSEEK_MODEL,
          messages,
          temperature: 0.2,
        });
        responseContent = res.choices[0]?.message?.content || "";
      } catch (deepseekErr) {
        console.warn(
          "[BilingualEngine] DeepSeek gặp lỗi, đang kích hoạt fallback sang Gemini 3.7 Flash:",
          deepseekErr
        );
        const geminiKey = await resolveAIKey(userId, "gemini");
        const genAI = createGeminiClient(geminiKey.apiKey);
        const model = genAI.getGenerativeModel({
          model: DEFAULT_GEMINI_MODEL,
          systemInstruction: {
            role: "system",
            parts: [{ text: BILINGUAL_SYSTEM_PROMPT }],
          },
        });
        const res = await model.generateContent(userPrompt);
        responseContent = res.response.text();
        finalProvider = "gemini";
      }
    } else {
      const genAI = createGeminiClient(resolvedKey.apiKey);
      const model = genAI.getGenerativeModel({
        model: DEFAULT_GEMINI_MODEL,
        systemInstruction: {
          role: "system",
          parts: [{ text: BILINGUAL_SYSTEM_PROMPT }],
        },
      });
      const res = await model.generateContent(userPrompt);
      responseContent = res.response.text();
      finalProvider = "gemini";
    }

    // Extract HTML content
    let cleanHtml = responseContent.trim();
    if (cleanHtml.startsWith("```html")) {
      cleanHtml = cleanHtml.replace(/^```html\s*/i, "").replace(/\s*```$/, "");
    } else if (cleanHtml.startsWith("```")) {
      cleanHtml = cleanHtml.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Generate basic AST
    const defaultAst = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `${validated.titleVi} / ${validated.titleEn}`,
            },
          ],
        },
      ],
    };

    return {
      html: cleanHtml,
      ast: defaultAst,
      provider: finalProvider,
    };
  }
}
