import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/users/approvers
 * Danh sách cán bộ, lãnh đạo có thẩm quyền phê duyệt văn bản (TASK-401, TASK-402).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const approvers = await prisma.user.findMany({
      where: {
        role: { in: ["APPROVER", "ADMIN", "USER"] },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        jobTitle: true,
        organization: true,
        role: true,
        avatarUrl: true,
      },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
    });

    return NextResponse.json({
      success: true,
      approvers,
    });
  } catch (error: unknown) {
    console.error("Lỗi lấy danh sách cán bộ duyệt:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
