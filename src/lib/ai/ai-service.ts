import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../prisma";
import { decryptApiKey, UserCustomApiKeys } from "../encryption";

export type AIProvider = "deepseek" | "gemini";

export interface ResolvedAIKey {
  apiKey: string;
  isBYOK: boolean;
  provider: AIProvider;
}

export interface PromptCompileOptions {
  systemPrompt: string;
  userPromptTemplate: string;
  variables: Record<string, unknown>;
  fewShotExamples?: Array<{
    input: Record<string, unknown>;
    output_html: string;
  }>;
}

/**
 * Xác định khóa API nào được sử dụng:
 * Ưu tiên 1: Khóa BYOK cá nhân của User (giải mã AES-256-GCM từ DB).
 * Ưu tiên 2: Khóa mặc định của hệ thống (.env).
 */
export async function resolveAIKey(
  userId?: string | null,
  preferredProvider: AIProvider = "deepseek"
): Promise<ResolvedAIKey> {
  // 1. Kiểm tra khóa cá nhân của người dùng (BYOK)
  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { customApiKeys: true },
      });

      if (user?.customApiKeys) {
        const customKeys = user.customApiKeys as unknown as UserCustomApiKeys;
        const targetPayload = customKeys[preferredProvider];

        if (targetPayload?.ciphertext && targetPayload?.iv && targetPayload?.auth_tag) {
          const decryptedKey = decryptApiKey(targetPayload);
          if (decryptedKey && decryptedKey.trim().length > 0) {
            return {
              apiKey: decryptedKey.trim(),
              isBYOK: true,
              provider: preferredProvider,
            };
          }
        }
      }
    } catch (err) {
      console.warn("Lỗi khi giải mã khóa BYOK của người dùng, chuyển sang khóa hệ thống:", err);
    }
  }

  // 2. Khóa mặc định của hệ thống
  if (preferredProvider === "deepseek") {
    const sysKey = process.env.DEEPSEEK_API_KEY;
    if (sysKey && sysKey.trim().length > 0) {
      return {
        apiKey: sysKey.trim(),
        isBYOK: false,
        provider: "deepseek",
      };
    }
  }

  // Nếu là gemini hoặc fallback sang gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim().length > 0) {
    return {
      apiKey: geminiKey.trim(),
      isBYOK: false,
      provider: "gemini",
    };
  }

  // Nếu DeepSeek không có và Gemini cũng không có
  if (preferredProvider === "deepseek") {
    throw new Error(
      "Chưa cấu hình DEEPSEEK_API_KEY trên hệ thống và người dùng chưa nhập khóa BYOK."
    );
  } else {
    throw new Error(
      "Chưa cấu hình GEMINI_API_KEY trên hệ thống và người dùng chưa nhập khóa BYOK."
    );
  }
}

export const DEFAULT_DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.7-flash";

/**
 * Khởi tạo OpenAI Client kết nối tới DeepSeek API endpoint.
 */
export function createDeepSeekClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
  });
}

/**
 * Khởi tạo Google Generative AI Client.
 */
export function createGeminiClient(apiKey: string): GoogleGenerativeAI {
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Kiểm tra tính hợp lệ của API Key (dùng cho chức năng Test Key trên UI).
 */
export async function testApiKey(
  provider: AIProvider,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    return { success: false, message: "API Key không được để trống" };
  }

  try {
    if (provider === "deepseek") {
      const client = createDeepSeekClient(trimmedKey);
      await client.models.list();
      return { success: true, message: "Kết nối thành công đến DeepSeek API!" };
    } else if (provider === "gemini") {
      const genAI = createGeminiClient(trimmedKey);
      const modelName = process.env.GEMINI_MODEL || "gemini-3.7-flash";
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.countTokens("Xin chào kiểm tra kết nối");
      if (result && typeof result.totalTokens === "number") {
        return { success: true, message: "Kết nối thành công đến Google Gemini API!" };
      }
    }

    return { success: true, message: "Xác thực API Key thành công!" };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Xác thực thất bại: ${errMsg}`,
    };
  }
}

/**
 * Biên dịch Prompt với biến số người dùng và tiêm ví dụ Few-Shot (Few-shot In-context Learning).
 */
export function compilePromptMessages(options: PromptCompileOptions): Array<{
  role: "system" | "user" | "assistant";
  content: string;
}> {
  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [];

  // 1. System Prompt
  messages.push({
    role: "system",
    content: options.systemPrompt,
  });

  // 2. Few-shot In-context Examples (nếu có)
  if (options.fewShotExamples && options.fewShotExamples.length > 0) {
    for (const ex of options.fewShotExamples) {
      messages.push({
        role: "user",
        content: `Dữ liệu biến số đầu vào:\n${JSON.stringify(ex.input, null, 2)}`,
      });
      messages.push({
        role: "assistant",
        content: ex.output_html,
      });
    }
  }

  // 3. User Prompt từ Template và Variables
  let compiledUserPrompt = options.userPromptTemplate;
  for (const [key, val] of Object.entries(options.variables)) {
    const formattedVal = val === null || val === undefined ? `[${key.toUpperCase()}]` : String(val);
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    compiledUserPrompt = compiledUserPrompt.replace(regex, formattedVal);
  }

  // Tự động thay thế mọi thẻ {{...}} còn sót lại thành placeholder chống ảo giác [TEN_BIEN]
  compiledUserPrompt = compiledUserPrompt.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, tag) => `[${tag.toUpperCase()}]`);

  // Bổ sung raw JSON variables bên dưới để AI nắm bắt cấu trúc hoàn chỉnh
  compiledUserPrompt += `\n\n--- DỮ LIỆU ĐẦU VÀO ĐẦY ĐỦ (JSON) ---\n${JSON.stringify(
    options.variables,
    null,
    2
  )}`;

  messages.push({
    role: "user",
    content: compiledUserPrompt,
  });

  return messages;
}

/**
 * Master System Prompt chuẩn thể thức Nghị định 30/2020/NĐ-CP
 */
export const MASTER_SYSTEM_PROMPT = `BẠN LÀ CHUYÊN GIA PHÁP CHẾ VÀ TRƯỞNG PHÒNG HÀNH CHÍNH CÓ 15 NĂM KINH NGHIỆM TẠI VIỆT NAM.

Nhiệm vụ: Tiếp nhận dữ liệu biến số (JSON) hoặc bản nháp thô từ người dùng, tạo ra văn bản hoàn chỉnh chuẩn 100% theo Nghị định số 30/2020/NĐ-CP của Chính phủ về công tác văn thư.

QUY TẮC BỐ CỤC BẮT BUỘC (THEO NGHỊ ĐỊNH 30/2020/NĐ-CP):

1. TIÊU NGỮ & QUỐC HIỆU (Bắt buộc dùng layout table 2 cột, border:none):
   - Cột 1 (rộng 40%, căn giữa):
     * Dòng 1: TÊN CƠ QUAN CHỦ QUẢN (in hoa, đứng, cỡ chữ 12pt).
     * Dòng 2: TÊN ĐƠN VỊ SOẠN THẢO (in hoa, đậm, cỡ chữ 12-13pt).
     * Dòng 3: Đường kẻ ngang nét liền dưới tên đơn vị.
     * Dòng 4: Số và ký hiệu văn bản (Vd: "Số: [SỐ KÝ HIỆU]/TTr-HCNS" hoặc "Số: [SỐ KÝ HIỆU]/CV-CTY").
   - Cột 2 (rộng 60%, căn giữa):
     * Dòng 1: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" (in hoa, đậm, 12-13pt).
     * Dòng 2: "Độc lập - Tự do - Hạnh phúc" (in thường, chữ cái đầu in hoa, đậm, 13-14pt).
     * Dòng 3: Đường gạch ngang nét liền dài bằng dòng chữ tiêu ngữ.
     * Dòng 4: Địa danh, ngày... tháng... năm... (in nghiêng).

2. TÊN LOẠI VĂN BẢN VÀ TRÍCH YẾU:
   - Tên loại văn bản in hoa, căn giữa, in đậm (Vd: TỜ TRÌNH, QUYẾT ĐỊNH, THÔNG BÁO, CÔNG VĂN).
   - Trích yếu nội dung đặt ngay bên dưới tên loại văn bản, in thường, căn giữa.

3. KÍNH GỬI / NƠI NHẬN ĐẦU VĂN BẢN:
   - Căn lề trái: "Kính gửi: [Tên đối tượng tiếp nhận]".

4. CĂN CỨ PHÁP LÝ:
   - Mỗi căn cứ viết một dòng riêng biệt, mở đầu bằng "Căn cứ...", kết thúc bằng dấu chấm phẩy (;).
   - Dòng căn cứ cuối cùng kết thúc bằng dấu phẩy (,).

5. NỘI DUNG VĂN BẢN:
   - Trình bày mạch lạc, chia mục rõ ràng (1. Mục đích; 2. Nội dung chi tiết; 3. Dự toán kinh phí; 4. Đề xuất kiến nghị).
   - Sử dụng đại từ nhân xưng trang trọng, hành chính công vụ.

6. PHẦN KẾT THÚC & CHỮ KÝ (Bắt buộc dùng layout table 2 cột, border:none):
   - Cột 1 (rộng 50%, căn trái, lề trên):
     * "Nơi nhận:" (in nghiêng, đậm, gạch chân).
     * Danh sách các đơn vị nhận kèm gạch đầu dòng.
     * Dòng cuối cùng bắt buộc là "- Lưu: VT, [ĐƠN VỊ SOẠN THẢO]."
   - Cột 2 (rộng 50%, căn giữa):
     * CHỨC DANH NGƯỜI KÝ (in hoa, đậm).
     * Khoảng trống 4 dòng để ký tên hoặc chèn chữ ký.
     * Họ và tên người ký (in đậm).

QUY TẮC CHỐNG ẢO GIÁC (ANTI-HALLUCINATION GUARDRAILS):
- Tuyệt đối KHÔNG tự ý bịa đặt số tiền, ngày tháng, tên người, mã số hợp đồng, tài khoản ngân hàng khi chưa có trong input.
- Mọi thông tin còn thiếu BẮT BUỘC phải đặt trong dấu ngoặc vuông viết hoa: [TÊN NGƯỜI NHẬN], [SỐ TIỀN CỤ THỂ], [NGÀY BẮT ĐẦU], [ĐỊA ĐIỂM TỔ CHỨC], [CĂN CỨ PHÁP LÝ LIÊN QUAN].

OUTPUT ENFORCEMENT:
- Chỉ trả về chuỗi HTML ngữ nghĩa (<table>, <tr>, <td>, <h2>, <p>, <strong>, <em>, <u>).
- Không thêm markdown code block (\`\`\`html), không thêm lời chào, không giải thích.`;

export interface StreamGenerationOptions {
  userId?: string | null;
  preferredProvider?: AIProvider;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  signal?: AbortSignal;
}

export interface StreamChunkResult {
  text: string;
  reasoning?: string;
  model: string;
  provider: AIProvider;
}

/**
 * Stream DeepSeek với xử lý ngắt và hỗ trợ reasoning_content (DeepSeek-V4-Flash)
 */
async function* streamFromDeepSeek(
  apiKey: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  signal?: AbortSignal
): AsyncGenerator<{ text: string; reasoning?: string }, void, unknown> {
  const client = createDeepSeekClient(apiKey);
  const stream = await client.chat.completions.create(
    {
      model: DEFAULT_DEEPSEEK_MODEL,
      messages,
      stream: true,
      temperature: 0.3,
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
}

/**
 * Stream Google Gemini 3.7 Flash
 */
async function* streamFromGemini(
  apiKey: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const genAI = createGeminiClient(apiKey);

  const systemMsg = messages.find((m) => m.role === "system");
  const nonSystemMsgs = messages.filter((m) => m.role !== "system");

  const model = genAI.getGenerativeModel({
    model: DEFAULT_GEMINI_MODEL,
    systemInstruction: systemMsg ? { role: "system", parts: [{ text: systemMsg.content }] } : undefined,
  });

  const contents = nonSystemMsgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const responseStream = await model.generateContentStream({
    contents,
  });

  for await (const chunk of responseStream.stream) {
    if (signal?.aborted) break;
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}

/**
 * Sinh văn bản dạng Stream với cơ chế tự động Thử lại (Retry) và Dự phòng (Fallback) sang Gemini 3.7 Flash (TASK-108 & TASK-109)
 */
export async function* generateDocumentStream(
  options: StreamGenerationOptions
): AsyncGenerator<StreamChunkResult, void, unknown> {
  const { userId, preferredProvider = "deepseek", messages, signal } = options;

  let keyInfo: ResolvedAIKey;
  try {
    keyInfo = await resolveAIKey(userId, preferredProvider);
  } catch {
    // Nếu provider ưu tiên không lấy được, thử fallback sang provider còn lại
    const altProvider = preferredProvider === "deepseek" ? "gemini" : "deepseek";
    keyInfo = await resolveAIKey(userId, altProvider);
  }

  // 1. Thử gọi DeepSeek trước nếu là provider được chọn
  if (keyInfo.provider === "deepseek") {
    let attempts = 0;
    const maxAttempts = 3;
    let deepseekSuccess = false;

    while (attempts < maxAttempts && !deepseekSuccess) {
      if (signal?.aborted) return;
      attempts++;
      try {
        const generator = streamFromDeepSeek(keyInfo.apiKey, messages, signal);

        for await (const item of generator) {
          deepseekSuccess = true;
          yield {
            text: item.text,
            reasoning: item.reasoning,
            model: DEFAULT_DEEPSEEK_MODEL,
            provider: "deepseek",
          };
        }

        if (deepseekSuccess) return;
      } catch (err: unknown) {
        console.warn(`[AI Engine] Lỗi khi gọi DeepSeek lần ${attempts}/${maxAttempts}:`, err);
        if (signal?.aborted) return;

        // Nếu đã sinh được ít nhất 1 token mà lỗi thì không fallback để tránh trùng lặp nội dung
        if (attempts >= maxAttempts) {
          break;
        }

        // Chờ Exponential Backoff: 1s, 2s
        const backoffMs = attempts === 1 ? 1000 : 2000;
        await new Promise((res) => setTimeout(res, backoffMs));
      }
    }

    // 2. Tự động chuyển đổi Fallback sang Google Gemini 3.7 Flash (TASK-109)
    console.warn(
      "[AI Engine] DeepSeek không phản hồi hoặc gặp sự cố mạng/5xx. Đang kích hoạt dự phòng (Fallback) sang Gemini 3.7 Flash..."
    );

    try {
      const geminiKey = await resolveAIKey(userId, "gemini");
      const generator = streamFromGemini(geminiKey.apiKey, messages, signal);

      for await (const text of generator) {
        if (signal?.aborted) return;
        yield {
          text,
          model: DEFAULT_GEMINI_MODEL,
          provider: "gemini",
        };
      }
      return;
    } catch (fallbackErr) {
      console.error("[AI Engine] Cả DeepSeek và Gemini Fallback đều thất bại:", fallbackErr);
      throw new Error(
        "Không thể kết nối đến cả DeepSeek-V3 và Google Gemini 3.7 Flash. Vui lòng kiểm tra API Key hoặc kết nối mạng."
      );
    }
  }

  // 3. Nếu người dùng chọn trực tiếp Gemini
  const generator = streamFromGemini(keyInfo.apiKey, messages, signal);
  for await (const text of generator) {
    if (signal?.aborted) return;
    yield {
      text,
      model: DEFAULT_GEMINI_MODEL,
      provider: "gemini",
    };
  }
}

