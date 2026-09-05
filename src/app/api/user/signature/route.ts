import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const signatureSchema = z.object({
  signatureImageUrl: z.string().min(10, "Đường dẫn hoặc mã ảnh chữ ký không hợp lệ"),
});

/**
 * GET /api/user/signature
 * Lấy thông tin chữ ký điện tử của người dùng hiện tại (TASK-404).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        organization: true,
        signatureImageUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: unknown) {
    console.error("Lỗi lấy chữ ký người dùng:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}

/**
 * POST /api/user/signature
 * Cập nhật ảnh chữ ký cá nhân (PNG tách nền / Base64) (TASK-404).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = signatureSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu ảnh chữ ký không hợp lệ", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { signatureImageUrl } = validated.data;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { signatureImageUrl },
      select: {
        id: true,
        fullName: true,
        signatureImageUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật chữ ký điện tử cá nhân thành công",
      user: updated,
    });
  } catch (error: unknown) {
    console.error("Lỗi cập nhật chữ ký:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
