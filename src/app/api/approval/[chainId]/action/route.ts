import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { ApprovalStateMachine } from "@/lib/workflow/approval-state-machine";

const actionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES"]),
  comments: z.string().max(2000).optional(),
  applySignature: z.boolean().optional().default(false),
});

/**
 * POST /api/approval/:chainId/action
 * Thực hiện phê duyệt, từ chối hoặc yêu cầu sửa đổi văn bản (TASK-402, API-004).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chainId } = await params;

  try {
    const body = await req.json();
    const validated = actionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { action, comments, applySignature } = validated.data;

    const result = await ApprovalStateMachine.processAction({
      chainId,
      approverId: session.user.id,
      action,
      comments,
      applySignature,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    console.error("Lỗi thực hiện hành động phê duyệt:", error);
    const message = error instanceof Error ? error.message : "Lỗi xử lý phê duyệt";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
