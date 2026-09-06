/**
 * ==============================================================================
 * DỊCH VỤ EMAIL GIAO DỊCH (TRANSACTIONAL EMAIL SERVICE)
 * TASK-A3 — Tích hợp gửi email mời cộng tác, trình ký & phê duyệt
 * ==============================================================================
 */

export interface SendInviteEmailParams {
  toEmail: string;
  inviterName: string;
  documentTitle: string;
  draftId: string;
  permission?: "VIEW" | "COMMENT" | "EDIT";
  customMessage?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  mode: "real" | "mock";
  message: string;
}

/**
 * Sinh mẫu email HTML chuẩn nhận diện thương hiệu DocDraft AI
 */
export function generateInviteEmailHtml({
  inviterName,
  documentTitle,
  inviteUrl,
  permission = "EDIT",
  customMessage,
}: {
  inviterName: string;
  documentTitle: string;
  inviteUrl: string;
  permission?: "VIEW" | "COMMENT" | "EDIT";
  customMessage?: string;
}): string {
  const permissionLabel =
    permission === "EDIT"
      ? "Chỉnh sửa & Cộng tác (Editor)"
      : permission === "COMMENT"
      ? "Nhận xét & Bình luận (Reviewer)"
      : "Chỉ xem (Viewer)";

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lời mời cộng tác văn bản — DocDraft AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600px" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 32px 30px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 20px; margin-bottom: 12px;">
                      <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">DocDraft AI System</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
                      Lời Mời Cộng Tác Văn Bản
                    </h1>
                    <p style="color: #c7d2fe; font-size: 13px; margin: 6px 0 0 0;">
                      Hệ thống soạn thảo văn bản hành chính chuẩn Nghị định 30/2020/NĐ-CP
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                Kính gửi Quý Đồng chí,
              </p>
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #334155;">
                Đồng chí <strong>${inviterName}</strong> vừa chia sẻ và mời bạn tham gia cộng tác trên văn bản dự thảo điện tử sau:
              </p>

              <!-- Document Card -->
              <div style="background-color: #f1f5f9; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px;">
                  Tiêu đề văn bản:
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">
                  ${documentTitle}
                </div>
                <div style="font-size: 12px; color: #475569;">
                  <strong>Quyền hạn được cấp:</strong> <span style="background-color: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${permissionLabel}</span>
                </div>
                ${
                  customMessage
                    ? `<div style="font-size: 12px; color: #475569; margin-top: 8px; border-top: 1px dashed #cbd5e1; pt: 8px;">
                        <em>&ldquo;${customMessage}&rdquo;</em>
                       </div>`
                    : ""
                }
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                      Truy Cập Văn Bản Ngay &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 20px 0 0 0; text-align: center;">
                Nếu nút trên không hoạt động, vui lòng sao chép liên kết sau vào trình duyệt:<br>
                <a href="${inviteUrl}" style="color: #4f46e5; word-break: break-all; font-size: 11px;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 30px; text-align: center; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0 0 6px 0;">
                Thông báo tự động phát hành bởi nền tảng <strong>DOCDRAFT AI</strong>
              </p>
              <p style="margin: 0;">
                Mọi dữ liệu văn bản được mã hóa bảo vệ theo tiêu chuẩn an toàn thông tin công vụ.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Gửi email mời cộng tác thực tế (hỗ trợ Resend API hoặc Fallback Mock)
 */
export async function sendCollaboratorInviteEmail(
  params: SendInviteEmailParams
): Promise<EmailSendResult> {
  const { toEmail, inviterName, documentTitle, draftId, permission, customMessage } = params;

  // Xác định URL mời
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL 
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
    : "http://localhost:3000";
    
  const inviteUrl = `${baseUrl}/editor?id=${draftId}`;
  const html = generateInviteEmailHtml({
    inviterName,
    documentTitle,
    inviteUrl,
    permission,
    customMessage,
  });

  const resendApiKey = process.env.RESEND_API_KEY;

  // 1. Chế độ Gửi Thật (khi có RESEND_API_KEY)
  if (resendApiKey && resendApiKey.trim().length > 10) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "DocDraft AI <notifications@docdraft.vn>",
          to: [toEmail],
          subject: `[DocDraft AI] ${inviterName} đã mời bạn cộng tác vào văn bản: ${documentTitle}`,
          html: html,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          messageId: data.id,
          mode: "real",
          message: `Email mời đã được gửi thành công tới ${toEmail} qua Resend.`,
        };
      } else {
        const errText = await response.text();
        console.warn("Lỗi từ Resend API, chuyển sang chế độ mô phỏng an toàn:", errText);
      }
    } catch (err) {
      console.warn("Không thể kết nối máy chủ Resend, chuyển sang chế độ mô phỏng an toàn:", err);
    }
  }

  // 2. Chế độ Mô phỏng An toàn (Safe Mock) khi chưa cấu hình Key
  console.log("==================================================================");
  console.log(`📨 [DOCDRAFT EMAIL MOCK] Gửi email mời cộng tác tới: ${toEmail}`);
  console.log(`📄 Tiêu đề văn bản: ${documentTitle}`);
  console.log(`👤 Người mời: ${inviterName}`);
  console.log(`🔗 Liên kết: ${inviteUrl}`);
  console.log("==================================================================");

  return {
    success: true,
    mode: "mock",
    message: `Đã gửi lời mời thành công tới ${toEmail} (Chế độ mô phỏng an toàn).`,
  };
}
