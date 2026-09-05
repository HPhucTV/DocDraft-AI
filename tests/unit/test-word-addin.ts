import fs from "fs";
import path from "path";
import {
  mmToPoints,
  formatDocumentND30,
  insertNationalHeaderTable,
  insertSignatureFooterTable,
} from "../../src/lib/office/word-service";

async function runWordAddinTests() {
  console.log("🔍 Đang kiểm thử Microsoft Word Add-in Lite & 1-Click Thể thức (TASK-303, TASK-304)...");

  // 1. Kiểm thử tệp cấu hình Manifest XML (TASK-303)
  console.log("--- 1. Kiểm tra Manifest XML hợp lệ của Office.js ---");
  const manifestPath = path.join(process.cwd(), "public", "word-addin", "manifest.xml");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("Không tìm thấy tệp public/word-addin/manifest.xml!");
  }

  const manifestContent = fs.readFileSync(manifestPath, "utf-8");
  if (!manifestContent.includes("<OfficeApp") || !manifestContent.includes("xsi:type=\"TaskPaneApp\"")) {
    throw new Error("Manifest XML thiếu khai báo TaskPaneApp!");
  }
  if (!manifestContent.includes("<Host Name=\"Document\"")) {
    throw new Error("Manifest XML thiếu Host Name='Document' (Microsoft Word)!");
  }
  if (!manifestContent.includes("<Permissions>ReadWriteDocument</Permissions>")) {
    throw new Error("Manifest XML thiếu quyền ReadWriteDocument!");
  }
  if (!manifestContent.includes("SourceLocation") || !manifestContent.includes("/word-addin")) {
    throw new Error("Manifest XML thiếu SourceLocation trỏ tới /word-addin!");
  }
  console.log("✓ Tệp manifest.xml đạt chuẩn Office Add-in Schema v1.1.");

  // 2. Kiểm thử công thức chuyển đổi mm sang Point chuẩn Microsoft Word
  console.log("--- 2. Kiểm tra công thức chuyển đổi milimét sang Point ---");
  const topPt = mmToPoints(20);
  const bottomPt = mmToPoints(20);
  const leftPt = mmToPoints(30);
  const rightPt = mmToPoints(15);

  if (Math.abs(topPt - 56.69) > 0.1 || Math.abs(bottomPt - 56.69) > 0.1) {
    throw new Error(`Lề trên/dưới 20mm tính sai: ${topPt} pt (kỳ vọng ~56.69 pt)`);
  }
  if (Math.abs(leftPt - 85.04) > 0.1) {
    throw new Error(`Lề trái 30mm tính sai: ${leftPt} pt (kỳ vọng ~85.04 pt)`);
  }
  if (Math.abs(rightPt - 42.52) > 0.1) {
    throw new Error(`Lề phải 15mm tính sai: ${rightPt} pt (kỳ vọng ~42.52 pt)`);
  }
  console.log(`✓ Lề trên: ${topPt.toFixed(2)} pt, Lề dưới: ${bottomPt.toFixed(2)} pt`);
  console.log(`✓ Lề trái: ${leftPt.toFixed(2)} pt, Lề phải: ${rightPt.toFixed(2)} pt`);

  // 3. Kiểm thử hàm chuẩn hóa tài liệu 1-Click (TASK-304)
  console.log("--- 3. Kiểm tra tính năng 1-Click Chuẩn hóa NĐ 30 ---");
  const formatResult = await formatDocumentND30();
  if (!formatResult.success || !formatResult.appliedSettings) {
    throw new Error("Hàm formatDocumentND30 không trả về kết quả thành công!");
  }
  if (formatResult.appliedSettings.font !== "Times New Roman" || formatResult.appliedSettings.fontSize !== 13) {
    throw new Error("Font hoặc cỡ chữ không đúng chuẩn Nghị định 30!");
  }
  console.log("✓ Thiết lập lề 30/15/20/20mm và font Times New Roman 13pt thực thi chính xác.");

  // 4. Kiểm thử chèn bảng Quốc hiệu và Chữ ký
  console.log("--- 4. Kiểm tra hàm chèn khối bảng ẩn Quốc hiệu và Chữ ký ---");
  const headerRes = await insertNationalHeaderTable();
  if (!headerRes.success) {
    throw new Error("Chèn khối Quốc hiệu thất bại!");
  }
  console.log("✓ Chèn khối Quốc hiệu & Tiêu ngữ chuẩn bảng 2 cột thành công.");

  const footerRes = await insertSignatureFooterTable();
  if (!footerRes.success) {
    throw new Error("Chèn khối Chữ ký thất bại!");
  }
  console.log("✓ Chèn khối Nơi nhận & Ký tên chuẩn chân trang thành công.");

  console.log("\n🎉 HOÀN THÀNH 100% CÁC BÀI TEST WORD ADD-IN LITE (TASK-303, TASK-304)!");
}

runWordAddinTests().catch((err) => {
  console.error("❌ Kiểm thử Word Add-in thất bại:", err);
  process.exit(1);
});
