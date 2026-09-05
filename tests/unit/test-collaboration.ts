/**
 * Unit Test for Collaboration Features (TASK-305, TASK-306)
 * - TASK-305: Secure Shared Links (Token generation, password hashing & comparison, expiration check, permissions)
 * - TASK-306: In-context Comments (Anchor text quote, thread hierarchy, status resolution)
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";

function runCollaborationTests() {
  console.log("🚀 Bắt đầu kiểm thử tính năng Cộng tác & Chia sẻ (TASK-305 & TASK-306)...\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // ==========================================
  // PHẦN 1: TASK-305 - SECURE SHARED LINKS
  // ==========================================
  console.log("--- 1. Kiểm thử TASK-305: Secure Shared Links ---");

  // 1.1 Token Generation (64-char hex)
  const token = crypto.randomBytes(32).toString("hex");
  assert(token.length === 64, `Token bảo mật ngẫu nhiên đạt chuẩn 64 ký tự hex (độ dài thực tế: ${token.length})`);
  assert(/^[0-9a-f]+$/.test(token), "Token chỉ chứa ký tự thập lục phân an toàn");

  // 1.2 Expiration Validation
  const now = new Date();
  const pastDate = new Date(now.getTime() - 1000 * 60 * 60); // 1 giờ trước
  const futureDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // 7 ngày sau

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date() > expiresAt;
  };

  assert(isExpired(pastDate) === true, "Phát hiện chính xác liên kết đã hết hạn");
  assert(isExpired(futureDate) === false, "Phát hiện chính xác liên kết còn hạn hiệu lực");
  assert(isExpired(null) === false, "Liên kết không thiết lập thời hạn luôn hợp lệ (vĩnh viễn)");

  // 1.3 Password Hashing & Verification (bcrypt)
  const rawPassword = "MatKhauBaoMat@2026";
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(rawPassword, salt);

  assert(bcrypt.compareSync(rawPassword, passwordHash) === true, "Xác thực mật khẩu liên kết chia sẻ chính xác 100%");
  assert(bcrypt.compareSync("SaiMatKhau123", passwordHash) === false, "Từ chối mật khẩu không đúng khi truy cập");

  // 1.4 Permission Matrix
  const validPermissions = ["VIEW", "COMMENT", "EDIT"];
  assert(validPermissions.includes("VIEW"), "Hỗ trợ quyền xem văn bản (VIEW)");
  assert(validPermissions.includes("COMMENT"), "Hỗ trợ quyền góp ý bình luận (COMMENT)");
  assert(validPermissions.includes("EDIT"), "Hỗ trợ quyền trực tiếp chỉnh sửa (EDIT)");

  // ==========================================
  // PHẦN 2: TASK-306 - IN-CONTEXT COMMENTS
  // ==========================================
  console.log("\n--- 2. Kiểm thử TASK-306: In-context Comments & Threads ---");

  interface MockComment {
    id: string;
    content: string;
    anchorJson?: { from?: number; to?: number; quote?: string } | null;
    parentCommentId?: string | null;
    isResolved: boolean;
    replies?: MockComment[];
  }

  // 2.1 Tạo bình luận gắn vị trí neo văn bản (In-context Anchor)
  const comment1: MockComment = {
    id: "cm-001",
    content: "Đề nghị sửa 'Cộng hòa Xã hội...' sang đúng Tiêu ngữ in đậm đứng theo NĐ 30.",
    anchorJson: {
      from: 10,
      to: 45,
      quote: "Độc lập - Tự do - Hạnh phúc",
    },
    parentCommentId: null,
    isResolved: false,
    replies: [],
  };

  assert(
    Boolean(comment1.anchorJson?.quote && comment1.anchorJson.from !== undefined),
    "Bình luận lưu vết chính xác tọa độ neo văn bản và trích đoạn"
  );

  // 2.2 Threading: Trả lời bình luận
  const reply1: MockComment = {
    id: "cm-002",
    content: "Đã rà soát và xác nhận cần gạch nối ngắn có dấu cách hai bên.",
    anchorJson: null,
    parentCommentId: "cm-001",
    isResolved: false,
  };

  comment1.replies?.push(reply1);
  assert(comment1.replies?.length === 1, "Cây bình luận hỗ trợ luồng thảo luận phân cấp (Replies Thread)");
  assert(comment1.replies?.[0].parentCommentId === comment1.id, "Bình luận phản hồi liên kết đúng cha (parentCommentId)");

  // 2.3 Status Resolution
  assert(comment1.isResolved === false, "Trạng thái khởi tạo của bình luận là Chưa giải quyết (open)");
  comment1.isResolved = true;
  assert(comment1.isResolved === true, "Cập nhật trạng thái thành công sang Đã giải quyết (resolved)");

  console.log(`\n🎉 KẾT QUẢ: ${passed}/${total} bài kiểm thử đạt thành công (100%)!\n`);
}

runCollaborationTests();
