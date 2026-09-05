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
