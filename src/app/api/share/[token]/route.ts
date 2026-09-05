import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * GET /api/share/[token]
 * Lấy thông tin cơ bản về liên kết chia sẻ (kiểm tra có mật khẩu không, còn hạn không)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const link = await prisma.sharedLink.findUnique({
      where: { shareToken: token },
      include: {
        draft: {
          select: {
            title: true,
            templateId: true,
            mode: true,
            updatedAt: true,
          },
        },
        sharer: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Liên kết chia sẻ không tồn tại hoặc đã bị thu hồi" },
        { status: 404 }
      );
    }

    const isExpired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false;
    if (isExpired) {
      return NextResponse.json(
        { error: "Liên kết chia sẻ này đã hết hạn truy cập" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      requiresPassword: !!link.passwordHash,
      title: link.draft.title,
      docType: link.draft.templateId || link.draft.mode || "FORM",
      sharerName: link.sharer.fullName || "Người dùng DocDraft",
      permission: link.permission,
      createdAt: link.createdAt,
    });
  } catch (error: unknown) {
    console.error("Lỗi lấy thông tin liên kết chia sẻ:", error);
    return NextResponse.json(
      { error: "Không thể lấy thông tin liên kết chia sẻ" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/share/[token]
 * Mở khóa và tải toàn bộ nội dung văn bản (yêu cầu mật khẩu nếu có bảo vệ)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const link = await prisma.sharedLink.findUnique({
      where: { shareToken: token },
      include: {
        draft: true,
        sharer: {
          select: { fullName: true, email: true },
        },
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Liên kết chia sẻ không tồn tại hoặc đã bị thu hồi" },
        { status: 404 }
      );
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Liên kết chia sẻ này đã hết hạn truy cập" },
        { status: 410 }
      );
    }

    // Nếu có mật khẩu bảo vệ, kiểm tra mật khẩu
    if (link.passwordHash) {
      const body = await req.json().catch(() => ({}));
      const { password } = body as { password?: string };

      if (!password) {
        return NextResponse.json(
          { error: "Tài liệu này được bảo vệ bằng mật khẩu. Vui lòng nhập mật khẩu để mở khóa.", requiresPassword: true },
          { status: 401 }
        );
      }

      const isValidPassword = await bcrypt.compare(password, link.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Mật khẩu không chính xác. Vui lòng thử lại.", requiresPassword: true },
          { status: 403 }
        );
      }
    }

    // Tăng useCount
    await prisma.sharedLink.update({
      where: { id: link.id },
      data: { useCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      permission: link.permission,
      draft: {
        id: link.draft.id,
        title: link.draft.title,
        docType: link.draft.templateId || link.draft.mode || "FORM",
        contentJson: link.draft.contentJson,
        updatedAt: link.draft.updatedAt,
        sharerName: link.sharer.fullName || "Người dùng DocDraft",
      },
    });
  } catch (error: unknown) {
    console.error("Lỗi xác thực liên kết chia sẻ:", error);
    return NextResponse.json(
      { error: "Không thể mở khóa tài liệu chia sẻ" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/share/[token]
 * Cho phép chỉnh sửa và lưu văn bản nếu liên kết có quyền 'EDIT'
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const link = await prisma.sharedLink.findUnique({
      where: { shareToken: token },
      select: {
        id: true,
        draftId: true,
        permission: true,
        expiresAt: true,
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Liên kết không tồn tại" }, { status: 404 });
    }

    if (link.permission !== "EDIT") {
      return NextResponse.json(
        { error: "Bạn chỉ có quyền xem hoặc bình luận trên liên kết này" },
        { status: 403 }
      );
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Liên kết đã hết hạn" }, { status: 410 });
    }

    const body = await req.json();
    const { title, contentJson } = body as { title?: string; contentJson?: unknown };

    const updated = await prisma.documentDraft.update({
      where: { id: link.draftId },
      data: {
        ...(title ? { title } : {}),
        ...(contentJson ? { contentJson: contentJson as Prisma.InputJsonValue } : {}),
        currentVersion: { increment: 1 },
      },
      select: {
        id: true,
        title: true,
        currentVersion: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      updated,
    });
  } catch (error: unknown) {
    console.error("Lỗi cập nhật tài liệu qua liên kết chia sẻ:", error);
    return NextResponse.json({ error: "Không thể lưu tài liệu" }, { status: 500 });
  }
}
