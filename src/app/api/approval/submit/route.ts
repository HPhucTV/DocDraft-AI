import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { ApprovalStateMachine } from "@/lib/workflow/approval-state-machine";

const submitSchema = z.object({
  draftId: z.string().uuid(),
  note: z.string().max(1000).optional(),
  approvers: z
    .array(
      z.object({
        stepNumber: z.number().int().min(1),
        approverId: z.string().uuid(),
      })
    )
    .min(1, "Quy trình trình ký phải có ít nhất 1 người duyệt"),
});

/**
 * POST /api/approval/submit
 * Khởi tạo luồng trình ký tuần tự cho bản nháp (TASK-401, TASK-402, API-004).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = submitSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { draftId, note, approvers } = validated.data;

    const chain = await ApprovalStateMachine.submitDraft({
      draftId,
      submitterId: session.user.id,
      note,
      approvers,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Đã gửi trình ký văn bản thành công",
        chainId: chain.id,
        currentStep: chain.currentStep,
        totalSteps: chain.steps.length,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Lỗi gửi trình ký:", error);
    const message = error instanceof Error ? error.message : "Lỗi xử lý luồng trình ký";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
