import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { applySignatureToAST } from "./signature-applier";

export type ApprovalAction = "APPROVE" | "REJECT" | "REQUEST_CHANGES";

export interface ApproverInput {
  stepNumber: number;
  approverId: string;
}

export interface SubmitApprovalParams {
  draftId: string;
  submitterId: string;
  note?: string;
  approvers: ApproverInput[];
}

export interface ApprovalActionParams {
  chainId: string;
  approverId: string;
  action: ApprovalAction;
  comments?: string;
  applySignature?: boolean;
}

/**
 * Sinh mã xác thực QR duy nhất (64 ký tự hex SHA-256) cho văn bản đã duyệt (TASK-403).
 */
export function generateQRVerifyCode(draftId: string, timestamp: Date): string {
  const payload = `${draftId}-${timestamp.toISOString()}-${crypto.randomBytes(16).toString("hex")}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * State Machine Quản lý Luồng Trình ký & Phê duyệt nội bộ (TASK-401, DATA-002, API-004).
 */
export class ApprovalStateMachine {
  /**
   * Khởi tạo luồng trình ký mới cho bản nháp.
   * Chuyển trạng thái từ DRAFT sang PENDING_REVIEW.
   */
  static async submitDraft(params: SubmitApprovalParams) {
    const { draftId, submitterId, note, approvers } = params;

    // 1. Kiểm tra bản nháp tồn tại và thuộc quyền submitter
    const draft = await prisma.documentDraft.findUnique({
      where: { id: draftId },
      include: { user: true },
    });

    if (!draft) {
      throw new Error("Không tìm thấy bản nháp yêu cầu");
    }

    if (draft.userId !== submitterId) {
      throw new Error("Chỉ người tạo bản nháp mới có quyền gửi trình ký");
    }

    if (draft.status !== "DRAFT") {
      throw new Error(`Bản nháp đang ở trạng thái '${draft.status}', không thể gửi trình ký`);
    }

    if (approvers.length === 0) {
      throw new Error("Quy trình trình ký phải có ít nhất 1 người duyệt");
    }

    // 2. Kiểm tra điều kiện tiên quyết (Guard Condition):
    // Bản nháp không được còn placeholder [...] chưa điền
    const contentStr = JSON.stringify(draft.contentJson);
    if (contentStr.includes("[...]") || contentStr.includes("[Điền")) {
      throw new Error("Văn bản vẫn còn vị trí placeholder [...] chưa điền thông tin thực tế");
    }

    // 3. Sắp xếp thứ tự các bước duyệt tuần tự
    const sortedApprovers = [...approvers].sort((a, b) => a.stepNumber - b.stepNumber);

    // 4. Tạo chuỗi trình ký và các bước trong Transaction
    const result = await prisma.$transaction(async (tx) => {
      const chain = await tx.approvalChain.create({
        data: {
          draftId,
          submittedBy: submitterId,
          currentStep: 1,
          status: "PENDING",
          note: note || undefined,
          steps: {
            create: sortedApprovers.map((app, index) => ({
              stepNumber: index + 1,
              approverId: app.approverId,
              status: index === 0 ? "WAITING" : "WAITING",
            })),
          },
        },
        include: { steps: true },
      });

      // Cập nhật trạng thái bản nháp sang PENDING_REVIEW
      await tx.documentDraft.update({
        where: { id: draftId },
        data: { status: "PENDING_REVIEW" },
      });

      // Ghi nhật ký kiểm toán (Audit Log)
      await tx.auditLog.create({
        data: {
          draftId,
          actorId: submitterId,
          actionType: "SUBMIT_APPROVAL",
          source: "HUMAN",
          details: {
            chainId: chain.id,
            totalSteps: sortedApprovers.length,
            note,
          },
        },
      });

      return chain;
    });

    return result;
  }

  /**
   * Người duyệt thực hiện hành động: APPROVE, REJECT, hoặc REQUEST_CHANGES (TASK-402).
   */
  static async processAction(params: ApprovalActionParams) {
    const { chainId, approverId, action, comments, applySignature } = params;

    // 1. Tải thông tin chuỗi trình ký kèm các bước và bản nháp
    const chain = await prisma.approvalChain.findUnique({
      where: { id: chainId },
      include: {
        steps: { orderBy: { stepNumber: "asc" } },
        draft: { include: { user: true } },
      },
    });

    if (!chain) {
      throw new Error("Không tìm thấy chuỗi trình ký");
    }

    if (chain.status !== "PENDING") {
      throw new Error(`Chuỗi trình ký đã kết thúc với trạng thái: ${chain.status}`);
    }

    // 2. Tìm bước hiện hành của chuỗi
    const currentStepIndex = chain.currentStep - 1;
    const currentStep = chain.steps[currentStepIndex];

    if (!currentStep) {
      throw new Error("Không tìm thấy bước duyệt hiện hành");
    }

    // Kiểm tra quyền duyệt: người dùng phải đúng là approver của bước hiện hành
    if (currentStep.approverId !== approverId) {
      throw new Error("Bạn không phải người duyệt được phân công cho bước hiện tại");
    }

    const totalSteps = chain.steps.length;
    const isFinalStep = chain.currentStep === totalSteps;

    // 3. Xử lý chuyển đổi trạng thái trong Transaction
    const updated = await prisma.$transaction(async (tx) => {
      const now = new Date();

      if (action === "REJECT" || action === "REQUEST_CHANGES") {
        // Cập nhật bước duyệt
        await tx.approvalStep.update({
          where: { id: currentStep.id },
          data: {
            status: action,
            comments: comments || undefined,
            actionAt: now,
          },
        });

        // Kết thúc chuỗi duyệt thành REJECTED
        await tx.approvalChain.update({
          where: { id: chainId },
          data: {
            status: "REJECTED",
            completedAt: now,
          },
        });

        // Đưa văn bản về trạng thái DRAFT để tác giả chỉnh sửa lại
        await tx.documentDraft.update({
          where: { id: chain.draftId },
          data: { status: "DRAFT" },
        });

        // Ghi nhận Audit Log
        await tx.auditLog.create({
          data: {
            draftId: chain.draftId,
            actorId: approverId,
            actionType: action,
            source: "HUMAN",
            details: {
              stepNumber: chain.currentStep,
              comments,
            },
          },
        });

        return {
          status: action,
          isCompleted: true,
          nextStep: null,
          message:
            action === "REJECT"
              ? "Đã từ chối phê duyệt văn bản"
              : "Đã gửi yêu cầu sửa đổi tới tác giả",
        };
      }

      // Xử lý hành động APPROVE:
      // Cập nhật bước hiện tại thành APPROVED
      await tx.approvalStep.update({
        where: { id: currentStep.id },
        data: {
          status: "APPROVED",
          comments: comments || undefined,
          signatureApplied: Boolean(applySignature),
          actionAt: now,
        },
      });

      // Xử lý chèn chữ ký điện tử nếu người duyệt yêu cầu (TASK-404)
      let updatedContent = chain.draft.contentJson;
      if (applySignature) {
        const approverUser = await tx.user.findUnique({
          where: { id: approverId },
          select: { fullName: true, jobTitle: true, signatureImageUrl: true },
        });
        if (approverUser) {
          updatedContent = applySignatureToAST(updatedContent, {
            imageUrl: approverUser.signatureImageUrl || "",
            signerName: approverUser.fullName,
            jobTitle: approverUser.jobTitle || "",
          });
        }
      }

      if (!isFinalStep) {
        // Vẫn còn bước tiếp theo: chuyển sang bước kế tiếp
        const nextStepNumber = chain.currentStep + 1;

        await tx.approvalChain.update({
          where: { id: chainId },
          data: {
            currentStep: nextStepNumber,
          },
        });

        // Cập nhật trạng thái nháp sang PENDING_APPROVAL (chờ cấp cao hơn ký)
        await tx.documentDraft.update({
          where: { id: chain.draftId },
          data: {
            status: "PENDING_APPROVAL",
            contentJson: updatedContent as Prisma.InputJsonValue,
          },
        });

        await tx.auditLog.create({
          data: {
            draftId: chain.draftId,
            actorId: approverId,
            actionType: "APPROVE_STEP",
            source: "HUMAN",
            details: {
              stepNumber: chain.currentStep,
              nextStep: nextStepNumber,
              comments,
            },
          },
        });

        return {
          status: "APPROVED_INTERMEDIATE",
          isCompleted: false,
          nextStep: nextStepNumber,
          message: `Đã duyệt bước ${chain.currentStep}. Chuyển tiếp tới bước ${nextStepNumber}`,
        };
      }

      // Đây là bước cuối cùng: Hoàn tất phê duyệt!
      const qrCode = generateQRVerifyCode(chain.draftId, now);

      await tx.approvalChain.update({
        where: { id: chainId },
        data: {
          status: "APPROVED",
          completedAt: now,
        },
      });

      // Cập nhật bản nháp sang APPROVED, gắn mã QR duy nhất và nội dung đã chèn chữ ký
      await tx.documentDraft.update({
        where: { id: chain.draftId },
        data: {
          status: "APPROVED",
          qrVerifyCode: qrCode,
          contentJson: updatedContent as Prisma.InputJsonValue,
        },
      });

      await tx.auditLog.create({
        data: {
          draftId: chain.draftId,
          actorId: approverId,
          actionType: "APPROVE_FINAL",
          source: "HUMAN",
          details: {
            stepNumber: chain.currentStep,
            qrVerifyCode: qrCode,
            comments,
          },
        },
      });

      return {
        status: "APPROVED",
        isCompleted: true,
        nextStep: null,
        qrVerifyCode: qrCode,
        message: "Phê duyệt hoàn tất! Văn bản đã được khóa và phát hành mã QR xác thực",
      };
    });

    return updated;
  }
}
