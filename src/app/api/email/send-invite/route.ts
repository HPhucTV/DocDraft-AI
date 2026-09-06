import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendCollaboratorInviteEmail } from "@/lib/email/email-service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const {
      email,
      documentTitle = "Văn bản dự thảo",
      draftId = "draft-temp",
      permission = "EDIT",
      customMessage,
    } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Địa chỉ email không hợp lệ" },
        { status: 400 }
      );
    }

    const inviterName = session?.user?.name || "Người dùng DocDraft";

    const result = await sendCollaboratorInviteEmail({
      toEmail: email.trim(),
      inviterName,
      documentTitle,
      draftId,
      permission,
      customMessage,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Lỗi khi gửi email mời cộng tác:", error);
    return NextResponse.json(
      { error: "Không thể gửi email mời cộng tác lúc này" },
      { status: 500 }
    );
  }
}
