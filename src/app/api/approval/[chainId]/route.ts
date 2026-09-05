import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/approval/:chainId
 * Chi tiết tiến độ chuỗi trình ký và các bước duyệt (TASK-401, TASK-402).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chainId } = await params;

  try {
    const chain = await prisma.approvalChain.findUnique({
      where: { id: chainId },
      include: {
        draft: {
          select: {
            id: true,
            title: true,
            status: true,
            qrVerifyCode: true,
            updatedAt: true,
          },
        },
        submitter: {
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            organization: true,
            avatarUrl: true,
          },
        },
        steps: {
          orderBy: { stepNumber: "asc" },
          include: {
            approver: {
              select: {
                id: true,
                fullName: true,
                jobTitle: true,
                avatarUrl: true,
                signatureImageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!chain) {
      return NextResponse.json({ error: "Không tìm thấy chuỗi trình ký" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      chain,
    });
  } catch (error: unknown) {
    console.error("Lỗi lấy chi tiết chuỗi trình ký:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
