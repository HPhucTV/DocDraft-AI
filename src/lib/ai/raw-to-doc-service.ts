import {
  AIProvider,
  resolveAIKey,
  createDeepSeekClient,
  createGeminiClient,
  DEFAULT_DEEPSEEK_MODEL,
  DEFAULT_GEMINI_MODEL,
} from "./ai-service";

export interface RawExtractionResult {
  documentType: string;
  organization: string;
  recipient: string;
  signatory: string;
  signatoryTitle: string;
  financialFigures: string[];
  datesAndDeadlines: string[];
  legalBasesMentioned: string[];
  keyPoints: string[];
}

export interface RawToDocStreamOptions {
  userId?: string | null;
  rawText: string;
  targetDocType?: string;
  preferredProvider?: AIProvider;
  signal?: AbortSignal;
}

const STEP_1_EXTRACTION_SYSTEM_PROMPT = `BẠN LÀ CHUYÊN GIA TRÍCH XUẤT THỰC THỂ HÀNH CHÍNH (ENTITY & FACT EXTRACTION SPECIALIST).
Nhiệm vụ: Phân tích đoạn văn bản nháp thô, ghi chú, email hoặc biên bản cuộc họp và trích xuất TOÀN BỘ dữ kiện thực tế mà không làm mất hay sai lệch bất kỳ thông tin nào.

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON DUY NHẤT VỚI CÁC TRƯỜNG:
{
  "documentType": "Tên loại văn bản phù hợp (Công văn, Quyết định, Tờ trình, Thông báo, Biên bản, Kế hoạch...)",
  "organization": "Tên cơ quan, tổ chức, công ty ban hành (nếu có hoặc [TÊN CƠ QUAN BAN HÀNH])",
  "recipient": "Nơi nhận / người nhận chính (hoặc [NƠI NHẬN])",
  "signatory": "Họ và tên người ký (nếu có hoặc [HỌ VÀ TÊN NGƯỜI KÝ])",
  "signatoryTitle": "Chức vụ người ký (ví dụ GIÁM ĐỐC, HIỆU TRƯỞNG hoặc [CHỨC VỤ])",
  "financialFigures": ["Danh sách tất cả các số tiền, ngân sách, định mức được nhắc tới (giữ nguyên số và đơn vị tính)"],
  "datesAndDeadlines": ["Danh sách các mốc thời gian, ngày tháng, thời hạn"],
  "legalBasesMentioned": ["Các căn cứ pháp lý, luật, nghị định, thông tư hoặc số văn bản liên quan"],
  "keyPoints": ["Danh sách các ý chính, yêu cầu, đề xuất, phân công công việc cụ thể"]
}

QUY TẮC QUAN TRỌNG:
- Tuyệt đối KHÔNG tự ý bịa đặt số liệu tài chính hoặc ngày tháng. Nếu trong văn bản gốc không có, trả về mảng rỗng [] hoặc giá trị trong dấu ngoặc vuông [...].
- Chỉ trả về JSON hợp lệ, không bọc trong markdown code block, không thêm lời giải thích.`;

const STEP_2_RESTRUCTURING_SYSTEM_PROMPT = `BẠN LÀ CHUYÊN GIA SOẠN THẢO VĂN BẢN QUY PHẠM VÀ HÀNH CHÍNH THEO NGHỊ ĐỊNH 30/2020/NĐ-CP CỦA CHÍNH PHỦ VIỆT NAM.

Nhiệm vụ của bạn là nhận:
1. Dữ kiện đã trích xuất từ nháp thô (Entities & Facts).
2. Toàn văn đoạn nháp thô của người dùng.
Tái cấu trúc và nâng cấp toàn bộ thành một văn bản hành chính hoàn chỉnh, trang trọng, chuẩn mực 100% về thể thức.

QUY TẮC THỂ THỨC NGHỊ ĐỊNH 30/2020/NĐ-CP (BẮT BUỘC):
1. PHẦN ĐẦU VĂN BẢN (TABLE 2 CỘT, BORDER: NONE):
   - Cột 1 (rộng 40%, căn giữa):
     * Dòng 1: TÊN CƠ QUAN CHỦ QUẢN (chữ in hoa, đứng, cỡ vừa).
     * Dòng 2: TÊN CƠ QUAN BAN HÀNH (chữ in hoa, đậm).
     * Dòng 3: Số: .../...-...(chữ thường, đứng).
   - Cột 2 (rộng 60%, căn giữa):
     * CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM (in hoa, đậm).
     * Độc lập - Tự do - Hạnh phúc (chữ in thường, đậm, có gạch chân dưới toàn bộ cụm từ).
     * Địa danh, ngày ... tháng ... năm ... (chữ in nghiêng).

2. TÊN LOẠI VĂN BẢN & TRÍCH YẾU:
   - Tên loại văn bản (QUYẾT ĐỊNH / CÔNG VĂN / TỜ TRÌNH / THÔNG BÁO) in hoa, đậm, căn giữa.
   - Trích yếu nội dung: in thường, đậm hoặc nghiêng, căn giữa.

3. NỘI DUNG VĂN BẢN:
   - Bố cục chặt chẽ: Căn cứ pháp lý (nếu có, kết thúc dòng bằng dấu chấm phẩy ';', căn cứ cuối bằng dấu phẩy ',');
   - Các Điều/Khoản hoặc Mục (1. Mục đích; 2. Nội dung chi tiết; 3. Kinh phí thực hiện; 4. Trách nhiệm thi hành).
   - BẢO TỒN NGUYÊN VẸN 100% các số tiền, ngày tháng, tên người từ nháp thô.

4. PHẦN KẾT THÚC & CHỮ KÝ (TABLE 2 CỘT, BORDER: NONE):
   - Cột 1 (rộng 50%, căn trái): "Nơi nhận:" (in nghiêng, đậm); danh sách nơi nhận; dòng cuối "- Lưu: VT, [ĐƠN VỊ]."
   - Cột 2 (rộng 50%, căn giữa): CHỨC DANH NGƯỜI KÝ (in hoa, đậm); khoảng trống ký; Họ và tên (in đậm).

QUY TẮC CHỐNG ẢO GIÁC:
- Mọi thông tin còn thiếu bắt buộc đặt trong dấu ngoặc vuông viết hoa: [TÊN CƠ QUAN], [SỐ HIỆU], [NGÀY BẮT ĐẦU], [SỐ TIỀN CỤ THỂ].
- Đầu ra CHỈ là mã HTML ngữ nghĩa (<table>, <tr>, <td>, <h2>, <p>, <strong>, <em>, <u>). Không dùng markdown \`\`\`html.`;

/**
 * Bước 1: Trích xuất thực thể và dữ kiện từ nháp thô (Prompt Chaining Bước 1)
 */
export async function extractFactsFromRawText(
  apiKey: string,
  rawText: string,
  targetDocType?: string,
  preferredProvider: AIProvider = "deepseek"
): Promise<RawExtractionResult> {
  const userContent = `ĐOẠN NHÁP THÔ CẦN PHÂN TÍCH:${
    targetDocType ? `\n(Người dùng mong muốn tạo loại văn bản: ${targetDocType})` : ""
  }\n"""\n${rawText}\n"""`;

  try {
    if (preferredProvider === "deepseek") {
      const client = createDeepSeekClient(apiKey);
      const res = await client.chat.completions.create({
        model: DEFAULT_DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: STEP_1_EXTRACTION_SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
      });

      const responseText = res.choices[0]?.message?.content || "{}";
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);
    } else {
      const genAI = createGeminiClient(apiKey);
      const model = genAI.getGenerativeModel({
        model: DEFAULT_GEMINI_MODEL,
        systemInstruction: { role: "system", parts: [{ text: STEP_1_EXTRACTION_SYSTEM_PROMPT }] },
      });
      const res = await model.generateContent(userContent);
      const responseText = res.response.text();
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);
    }
  } catch (error) {
    console.warn("[Raw Extraction Fallback] Lỗi parse JSON từ LLM:", error);
    return {
      documentType: targetDocType || "Công văn",
      organization: "[TÊN CƠ QUAN]",
      recipient: "[NƠI NHẬN]",
      signatory: "[NGƯỜI KÝ]",
      signatoryTitle: "[CHỨC VỤ]",
      financialFigures: [],
      datesAndDeadlines: [],
      legalBasesMentioned: [],
      keyPoints: [rawText.slice(0, 200)],
    };
  }
}

/**
 * Bước 2: Tái cấu trúc thành văn bản Nghị định 30 hoàn chỉnh dạng Stream (TASK-201)
 */
export async function* streamRestructuredDocument(
  options: RawToDocStreamOptions
): AsyncGenerator<{ text: string; reasoning?: string; facts?: RawExtractionResult }, void, unknown> {
  const { userId, rawText, targetDocType, preferredProvider = "deepseek", signal } = options;

  // 1. Xác định API Key
  const keyInfo = await resolveAIKey(userId, preferredProvider);

  // 2. Thực hiện Bước 1: Trích xuất thực thể
  const facts = await extractFactsFromRawText(
    keyInfo.apiKey,
    rawText,
    targetDocType,
    keyInfo.provider
  );

  // Phát tín hiệu facts đã trích xuất về client
  yield { text: "", facts };

  // 3. Thực hiện Bước 2: Tái cấu trúc dạng Stream
  const step2UserPrompt = `DỮ KIỆN ĐÃ ĐƯỢC XÁC THỰC:
- Loại văn bản mục tiêu: ${facts.documentType}
- Cơ quan ban hành: ${facts.organization}
- Nơi nhận: ${facts.recipient}
- Người ký: ${facts.signatory} (${facts.signatoryTitle})
- Số liệu tài chính cần bảo tồn: ${facts.financialFigures.join(", ") || "Không có"}
- Mốc thời gian: ${facts.datesAndDeadlines.join(", ") || "Không có"}
- Căn cứ pháp lý: ${facts.legalBasesMentioned.join("; ") || "Không có"}
- Các điểm chính:
${facts.keyPoints.map((p) => `  * ${p}`).join("\n")}

NỘI DUNG NHÁP THÔ GỐC:
"""
${rawText}
"""

HÃY SOẠN THẢO VĂN BẢN HOÀN CHỈNH CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP.`;

  if (keyInfo.provider === "deepseek") {
    const client = createDeepSeekClient(keyInfo.apiKey);
    const stream = await client.chat.completions.create(
      {
        model: DEFAULT_DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: STEP_2_RESTRUCTURING_SYSTEM_PROMPT },
          { role: "user", content: step2UserPrompt },
        ],
        stream: true,
        temperature: 0.25,
      },
      { signal }
    );

    for await (const chunk of stream) {
      if (signal?.aborted) break;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const delta = chunk.choices[0]?.delta as any;
      const content = delta?.content || "";
      const reasoning = delta?.reasoning_content || "";
      if (content || reasoning) {
        yield { text: content, reasoning };
      }
    }
  } else {
    const genAI = createGeminiClient(keyInfo.apiKey);
    const model = genAI.getGenerativeModel({
      model: DEFAULT_GEMINI_MODEL,
      systemInstruction: {
        role: "system",
        parts: [{ text: STEP_2_RESTRUCTURING_SYSTEM_PROMPT }],
      },
    });

    const responseStream = await model.generateContentStream(step2UserPrompt);
    for await (const chunk of responseStream.stream) {
      if (signal?.aborted) break;
      const text = chunk.text();
      if (text) {
        yield { text };
      }
    }
  }
}
