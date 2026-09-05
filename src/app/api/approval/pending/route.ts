import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/approval/pending
 * Danh sách các văn bản đang chờ người dùng hiện tại duyệt (TASK-402, API-004).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Tìm các chuỗi đang PENDING mà bước hiện tại được phân công cho userId
    const chains = await prisma.approvalChain.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        draft: {
          select: {
            id: true,
            title: true,
            wordCount: true,
            status: true,
            updatedAt: true,
          },
        },
        submitter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            jobTitle: true,
            organization: true,
          },
        },
        steps: {
          orderBy: { stepNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Lọc ra các chuỗi mà bước currentStep có approverId trùng với userId
    const pendingForUser = chains
      .filter((chain) => {
        const currentStep = chain.steps.find((s) => s.stepNumber === chain.currentStep);
        return currentStep && currentStep.approverId === userId && currentStep.status === "WAITING";
      })
      .map((chain) => ({
        chainId: chain.id,
        draftId: chain.draftId,
        title: chain.draft.title,
        status: chain.draft.status,
        submittedBy: {
          name: chain.submitter.fullName,
          jobTitle: chain.submitter.jobTitle || "Chuyên viên",
          email: chain.submitter.email,
        },
        stepNumber: chain.currentStep,
        totalSteps: chain.steps.length,
        note: chain.note,
        submittedAt: chain.createdAt,
      }));

    return NextResponse.json({
      success: true,
      count: pendingForUser.length,
      items: pendingForUser,
    });
  } catch (error: unknown) {
    console.error("Lỗi lấy danh sách chờ duyệt:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
