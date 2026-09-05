import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
  UserCustomApiKeys,
} from "@/lib/encryption";
import { AIProvider } from "@/lib/ai/ai-service";

/**
 * GET /api/user/keys
 * Lấy trạng thái cấu hình và masked API key của người dùng hiện tại.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { customApiKeys: true },
    });

    const customKeys = (user?.customApiKeys as unknown as UserCustomApiKeys) || {};

    let deepseekMasked: string | null = null;
    let geminiMasked: string | null = null;

    if (customKeys.deepseek?.ciphertext) {
      try {
        const dec = decryptApiKey(customKeys.deepseek);
        deepseekMasked = maskApiKey(dec);
      } catch {
        deepseekMasked = "••••••••";
      }
    }

    if (customKeys.gemini?.ciphertext) {
      try {
        const dec = decryptApiKey(customKeys.gemini);
        geminiMasked = maskApiKey(dec);
      } catch {
        geminiMasked = "••••••••";
      }
    }

    return NextResponse.json({
      deepseek: {
        configured: Boolean(customKeys.deepseek?.ciphertext),
        maskedKey: deepseekMasked,
        updatedAt: customKeys.deepseek?.updated_at || null,
      },
      gemini: {
        configured: Boolean(customKeys.gemini?.ciphertext),
        maskedKey: geminiMasked,
        updatedAt: customKeys.gemini?.updated_at || null,
      },
    });
  } catch (error: unknown) {
    console.error("Lỗi khi đọc custom API keys:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/user/keys
 * Lưu hoặc xóa khóa API cá nhân (BYOK) được mã hóa AES-256-GCM.
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
      apiKey?: string | null;
    };

    if (provider !== "deepseek" && provider !== "gemini") {
      return NextResponse.json(
        { error: "Provider không hợp lệ (chỉ hỗ trợ 'deepseek' hoặc 'gemini')" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { customApiKeys: true },
    });

    const currentKeys: UserCustomApiKeys =
      (user?.customApiKeys as unknown as UserCustomApiKeys) || {};

    if (!apiKey || apiKey.trim() === "") {
      // Xóa khóa
      delete currentKeys[provider];
    } else {
      // Mã hóa khóa mới bằng AES-256-GCM
      currentKeys[provider] = encryptApiKey(apiKey.trim());
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        customApiKeys: currentKeys as unknown as object,
      },
    });

    return NextResponse.json({
      success: true,
      message: apiKey ? `Đã lưu khóa ${provider} thành công!` : `Đã xóa khóa ${provider}!`,
      configured: Boolean(apiKey && apiKey.trim().length > 0),
    });
  } catch (error: unknown) {
    console.error("Lỗi khi cập nhật custom API keys:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật khóa API" },
      { status: 500 }
    );
  }
}
