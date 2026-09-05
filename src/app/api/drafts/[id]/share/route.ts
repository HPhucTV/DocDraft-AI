import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * POST /api/drafts/[id]/share
 * Tạo liên kết chia sẻ bảo mật (TASK-305).
 * Hỗ trợ: mật khẩu bảo vệ (bcrypt), phân quyền VIEW/COMMENT/EDIT, và hạn sử dụng.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: draftId } = await params;

  try {
    // 1. Kiểm tra quyền sở hữu bản nháp
    const draft = await prisma.documentDraft.findUnique({
      where: { id: draftId },
      select: { id: true, userId: true, title: true },
    });

    if (!draft || draft.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Bản nháp không tồn tại hoặc bạn không có quyền chia sẻ" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      permission = "VIEW",
      password,
      expiresInDays,
    } = body as {
      permission?: "VIEW" | "COMMENT" | "EDIT";
      password?: string;
      expiresInDays?: number;
    };

    // 2. Tạo share_token ngẫu nhiên 64 ký tự hex
    const shareToken = crypto.randomBytes(32).toString("hex");

    // 3. Mã hóa mật khẩu nếu có
    let passwordHash: string | null = null;
    if (password && password.trim().length > 0) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    // 4. Tính thời hạn hết hạn
    let expiresAt: Date | null = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }

    // 5. Lưu vào bảng shared_links
    const sharedLink = await prisma.sharedLink.create({
      data: {
        draftId,
        sharedBy: session.user.id,
        shareToken,
        permission,
        passwordHash,
        expiresAt,
      },
      select: {
        id: true,
        shareToken: true,
        permission: true,
        expiresAt: true,
        useCount: true,
        createdAt: true,
      },
    });

    const origin = req.nextUrl.origin;
    const shareUrl = `${origin}/share/${sharedLink.shareToken}`;

    return NextResponse.json({
      success: true,
      sharedLink: {
        ...sharedLink,
        hasPassword: !!passwordHash,
        shareUrl,
      },
    });
  } catch (error: unknown) {
    console.error("Lỗi tạo liên kết chia sẻ:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: `Không thể tạo liên kết chia sẻ: ${msg}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/drafts/[id]/share
 * Lấy danh sách các liên kết chia sẻ đang hoạt động của bản nháp
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: draftId } = await params;

  try {
    const draft = await prisma.documentDraft.findUnique({
      where: { id: draftId },
      select: { id: true, userId: true },
    });

    if (!draft || draft.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const links = await prisma.sharedLink.findMany({
      where: { draftId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        shareToken: true,
        permission: true,
        passwordHash: true,
        expiresAt: true,
        useCount: true,
        createdAt: true,
      },
    });

    const origin = req.nextUrl.origin;
    const formattedLinks = links.map((link) => ({
      id: link.id,
      shareToken: link.shareToken,
      shareUrl: `${origin}/share/${link.shareToken}`,
      permission: link.permission,
      hasPassword: !!link.passwordHash,
      expiresAt: link.expiresAt,
      useCount: link.useCount,
      createdAt: link.createdAt,
      isExpired: link.expiresAt ? new Date(link.expiresAt) < new Date() : false,
    }));

    return NextResponse.json({
      success: true,
      links: formattedLinks,
    });
  } catch (error: unknown) {
    console.error("Lỗi lấy danh sách liên kết chia sẻ:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách liên kết chia sẻ" },
      { status: 500 }
    );
  }
}
