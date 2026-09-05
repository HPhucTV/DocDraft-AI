import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/verify/:qrCode
 * Endpoint tra cứu công khai xác thực bản gốc văn bản (TASK-403, API-004).
 * KHÔNG YÊU CẦU ĐĂNG NHẬP (Public Endpoint dành cho người nhận quét mã QR).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  const { qrCode } = await params;

  if (!qrCode || qrCode.trim().length < 8) {
    return NextResponse.json(
      { is_valid: false, error: "Mã QR xác thực không hợp lệ hoặc bị thiếu" },
      { status: 400 }
    );
  }

  try {
    const draft = await prisma.documentDraft.findUnique({
      where: { qrVerifyCode: qrCode },
      include: {
        template: true,
        user: {
          select: {
            fullName: true,
            organization: true,
            jobTitle: true,
          },
        },
        approvalChains: {
          where: { status: "APPROVED" },
          orderBy: { completedAt: "desc" },
          take: 1,
          include: {
            steps: {
              where: { status: "APPROVED" },
              orderBy: { stepNumber: "desc" },
              take: 1,
              include: {
                approver: {
                  select: {
                    fullName: true,
                    jobTitle: true,
                    organization: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!draft || (draft.status !== "APPROVED" && draft.status !== "EXPORTED")) {
      return NextResponse.json(
        {
          is_valid: false,
          error: "Văn bản không tồn tại trên hệ thống hoặc chưa được cấp thẩm quyền ký duyệt chính thức",
        },
        { status: 404 }
      );
    }

    // Lấy thông tin người ký duyệt cuối cùng
    const approvedChain = draft.approvalChains[0];
    const finalStep = approvedChain?.steps[0];

    const approvedBy =
      finalStep?.approver?.fullName || draft.user?.fullName || "Thủ trưởng cơ quan";
    const approverTitle =
      finalStep?.approver?.jobTitle || draft.user?.jobTitle || "Lãnh đạo phê duyệt";
    const issuingOrg =
      finalStep?.approver?.organization || draft.user?.organization || "Cơ quan / Tổ chức ban hành";
    const approvalTimestamp =
      finalStep?.actionAt || approvedChain?.completedAt || draft.updatedAt;

    // Tính mã băm toàn vẹn SHA-256 của nội dung Tiptap AST
    const contentString = JSON.stringify(draft.contentJson);
    const integrityHash = crypto.createHash("sha256").update(contentString).digest("hex");

    return NextResponse.json({
      is_valid: true,
      document_title: draft.title,
      document_type: draft.template?.title || "Văn bản hành chính",
      issuing_organization: issuingOrg,
      approved_by: approvedBy,
      approver_title: approverTitle,
      approval_timestamp: approvalTimestamp.toISOString(),
      sha256_integrity_hash: integrityHash,
      qr_verify_code: qrCode,
      word_count: draft.wordCount,
      compliance_score: draft.lastComplianceScore ? Number(draft.lastComplianceScore) : 100,
    });
  } catch (error: unknown) {
    console.error("Lỗi tra cứu xác thực văn bản:", error);
    return NextResponse.json({ is_valid: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}
