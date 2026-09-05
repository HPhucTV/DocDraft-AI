import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { testApiKey, AIProvider } from "@/lib/ai/ai-service";

/**
 * POST /api/user/keys/test
 * Kiểm tra tính hợp lệ và kết nối tới provider (DeepSeek hoặc Gemini) với API key do người dùng nhập
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { provider, apiKey } = body as {
      provider: AIProvider;
      apiKey: string;
    };

    if (provider !== "deepseek" && provider !== "gemini") {
      return NextResponse.json(
        { error: "Provider không hợp lệ (chỉ hỗ trợ 'deepseek' hoặc 'gemini')" },
        { status: 400 }
      );
    }

    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: "Vui lòng nhập API Key để kiểm tra" },
        { status: 400 }
      );
    }

    const testResult = await testApiKey(provider, apiKey.trim());

    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: testResult.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: testResult.message,
    });
  } catch (error: unknown) {
    console.error("Lỗi khi kiểm tra API key:", error);
    const errMsg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
