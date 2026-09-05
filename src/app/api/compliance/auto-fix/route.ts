import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { autoFixComplianceAST } from "@/lib/compliance/compliance-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/compliance/auto-fix
 * Tự động sửa lỗi thể thức văn bản 1-Click trên cây Tiptap AST (TASK-302).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { contentJson } = body as { contentJson?: unknown };

    if (!contentJson) {
      return NextResponse.json(
        { error: "Thiếu cây cấu trúc AST (contentJson) cần sửa lỗi" },
        { status: 400 }
      );
    }

    const result = autoFixComplianceAST(contentJson);

    return NextResponse.json({
      success: true,
      fixedAst: result.fixedAst,
      fixesApplied: result.fixesApplied,
      initialScore: result.initialScore,
      newScore: result.newScore,
    });
  } catch (error: unknown) {
    console.error("Lỗi tự động sửa thể thức AST:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Không thể tự động sửa thể thức: ${msg}` },
      { status: 500 }
    );
  }
}
