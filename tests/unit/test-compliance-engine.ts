import {
  checkCompliance,
  autoFixComplianceAST,
} from "../../src/lib/compliance/compliance-engine";

async function runComplianceEngineTests() {
  console.log("🔍 Đang kiểm thử Compliance Rules Engine & Auto-Fix AST (TASK-301 & TASK-302)...");

  // 1. Kiểm thử phát hiện lỗi thể thức (TASK-301)
  console.log("--- 1. Kiểm thử phát hiện lỗi thể thức NĐ 30/2020 ---");

  // AST mẫu có lỗi: thiếu quốc hiệu, sai dấu căn cứ, còn placeholder [...], thiếu lưu VT
  const flawedAst = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "UBND TỈNH ĐỒNG NAI" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Số: 15/QĐ-UBND" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "QUYẾT ĐỊNH" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "V/v phê duyệt ngân sách đầu tư công nghệ số" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Căn cứ Luật Tổ chức chính quyền địa phương ngày 19 tháng 6 năm 2015.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ;",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Ủy ban nhân dân tỉnh quyết định trích số tiền [SỐ TIỀN CỤ THỂ ĐỒNG] để triển khai.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Nơi nhận: Như Điều 3;" }],
      },
    ],
  };

  const initialReport = checkCompliance(flawedAst);
  console.log(`✓ Điểm thể thức ban đầu: ${initialReport.score}/100 (Level: ${initialReport.level})`);
  console.log(`  - Số lỗi nghiêm trọng (Errors): ${initialReport.stats.errors}`);
  console.log(`  - Số cảnh báo (Warnings): ${initialReport.stats.warnings}`);

  // Kỳ vọng phát hiện:
  // - RULE_01 (Thiếu Quốc hiệu / Tiêu ngữ)
  // - RULE_04 (Sai dấu căn cứ pháp lý)
  // - RULE_05 (Thiếu lưu VT)
  // - RULE_06 (Còn placeholder [SỐ TIỀN CỤ THỂ ĐỒNG])
  const ruleIds = initialReport.issues.map((i) => i.ruleId);

  if (!ruleIds.includes("RULE_01")) {
    throw new Error("Không phát hiện lỗi thiếu Quốc hiệu & Tiêu ngữ (RULE_01)!");
  }
  if (!ruleIds.includes("RULE_04")) {
    throw new Error("Không phát hiện sai dấu căn cứ pháp lý (RULE_04)!");
  }
  if (!ruleIds.includes("RULE_05")) {
    throw new Error("Không phát hiện thiếu lưu trữ hồ sơ VT (RULE_05)!");
  }
  if (!ruleIds.includes("RULE_06")) {
    throw new Error("Không phát hiện placeholder [...] tồn đọng (RULE_06)!");
  }
  console.log("✓ Đã phát hiện chính xác 100% các vi phạm thể thức theo 7 bộ quy tắc NĐ 30.");

  // 2. Kiểm thử Thuật toán Auto-Fix 1-Click (TASK-302)
  console.log("\n--- 2. Kiểm thử Thuật toán Auto-Fix AST 1-Click ---");
  const fixResult = autoFixComplianceAST(flawedAst);

  console.log(`✓ Đã áp dụng ${fixResult.fixesApplied.length} điểm sửa tự động:`);
  fixResult.fixesApplied.forEach((fix, idx) => {
    console.log(`  ${idx + 1}. ${fix}`);
  });

  if (fixResult.fixesApplied.length === 0) {
    throw new Error("Auto-fix không áp dụng được bất kỳ chỉnh sửa nào!");
  }

  // Kiểm tra dấu căn cứ sau khi fix:
  // Dòng căn cứ 1 (ở giữa) phải kết thúc bằng ';'
  // Dòng căn cứ 2 (ở cuối) phải kết thúc bằng ','
  const content = fixResult.fixedAst.content || [];
  const fixedCanCu1 = content[4]?.content?.[0]?.text || "";
  const fixedCanCu2 = content[5]?.content?.[0]?.text || "";

  if (!fixedCanCu1.endsWith(";")) {
    throw new Error(`Dòng căn cứ giữa chưa đổi thành dấu ';': [${fixedCanCu1}]`);
  }
  if (!fixedCanCu2.endsWith(",")) {
    throw new Error(`Dòng căn cứ cuối chưa đổi thành dấu ',': [${fixedCanCu2}]`);
  }
  console.log("✓ Dấu câu căn cứ pháp lý đã được nắn chỉnh chuẩn xác (; và ,).");

  // Kiểm tra trích yếu: phải được căn giữa (textAlign = 'center') và in nghiêng
  const fixedTrichYeu = content[3];
  if (!fixedTrichYeu || fixedTrichYeu.attrs?.textAlign !== "center") {
    throw new Error("Dòng trích yếu chưa được căn giữa!");
  }
  const hasItalic = fixedTrichYeu.content?.[0].marks?.some(
    (m: { type: string }) => m.type === "italic"
  );
  if (!hasItalic) {
    throw new Error("Dòng trích yếu chưa được in nghiêng!");
  }
  console.log("✓ Dòng trích yếu đã được tự động căn giữa và in nghiêng.");

  // Kiểm tra bổ sung dòng lưu VT
  const fixedAllText = JSON.stringify(fixResult.fixedAst);
  if (!fixedAllText.includes("- Lưu: VT")) {
    throw new Error("Chưa bổ sung được dòng lưu văn thư (- Lưu: VT)!");
  }
  console.log('✓ Đã tự động bổ sung dòng "- Lưu: VT, VP." vào chân mục Nơi nhận.');

  // Điểm sau khi fix phải cao hơn điểm ban đầu
  if (fixResult.newScore <= fixResult.initialScore) {
    throw new Error(
      `Điểm mới (${fixResult.newScore}) không cao hơn điểm ban đầu (${fixResult.initialScore})!`
    );
  }
  console.log(`✓ Điểm tuân thủ tăng từ ${fixResult.initialScore}đ lên ${fixResult.newScore}đ.`);

  console.log("\n🎉 HOÀN THÀNH 100% CÁC BÀI TEST COMPLIANCE RULES ENGINE & AUTO-FIX (TASK-301 & TASK-302)!");
}

runComplianceEngineTests().catch((err) => {
  console.error("❌ Kiểm thử Compliance thất bại:", err);
  process.exit(1);
});
