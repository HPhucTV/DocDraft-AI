import { r2Storage } from "../../src/lib/storage/r2-storage";
import fs from "fs";
import path from "path";

async function runR2StorageTests() {
  console.log("🔍 Đang kiểm thử Cloudflare R2 Storage & SHA-256 Hash Cache (TASK-213)...");

  // 1. Kiểm thử tính mã băm SHA-256
  const dummyContent1 = { type: "doc", content: [{ type: "paragraph", text: "Văn bản mẫu số 1" }] };
  const dummyConfig1 = { margin_top_mm: 20, font_family: "Times New Roman" };

  const hash1 = r2Storage.computeContentHash(dummyContent1, dummyConfig1, "docx");
  const hash1Repeat = r2Storage.computeContentHash(dummyContent1, dummyConfig1, "docx");

  if (hash1 !== hash1Repeat) {
    throw new Error("Mã băm SHA-256 không mang tính tất định (deterministic)!");
  }
  if (hash1.length !== 64) {
    throw new Error(`Độ dài mã băm SHA-256 không chuẩn (${hash1.length} != 64)`);
  }
  console.log(`✓ Mã băm SHA-256 tất định chuẩn: ${hash1}`);

  // Thay đổi nội dung -> hash phải khác
  const dummyContent2 = { type: "doc", content: [{ type: "paragraph", text: "Văn bản đã sửa" }] };
  const hash2 = r2Storage.computeContentHash(dummyContent2, dummyConfig1, "docx");
  if (hash1 === hash2) {
    throw new Error("Hai nội dung khác nhau sinh cùng một mã băm!");
  }
  console.log(`✓ Hai nội dung khác nhau sinh 2 hash khác nhau: ${hash2}`);

  // Thay đổi format -> hash phải khác
  const hashPdf = r2Storage.computeContentHash(dummyContent1, dummyConfig1, "pdf");
  if (hash1 === hashPdf) {
    throw new Error("Khác format nhưng lại sinh cùng mã băm!");
  }
  console.log(`✓ Khác format (.docx vs .pdf) sinh hash khác nhau: ${hashPdf}`);

  // 2. Kiểm thử lưu trữ tệp & bộ đệm
  const testBuffer = Buffer.from("PK\x03\x04MockDocxBinaryContentForTesting");
  const saveResult = await r2Storage.saveExportFile({
    buffer: testBuffer,
    hash: hash1,
    format: "docx",
    title: "Văn bản thử nghiệm",
  });

  if (!saveResult.fileUrl) {
    throw new Error("Lưu trữ tệp không trả về fileUrl!");
  }
  console.log(`✓ Lưu trữ tệp xuất bản thành công: ${saveResult.fileUrl} (Key: ${saveResult.key})`);

  // 3. Kiểm thử tra cứu Cache (Cache Hit)
  const cacheHitResult = await r2Storage.checkCachedExport(hash1, "docx");
  if (!cacheHitResult.isCached) {
    throw new Error("Kiểm tra bộ đệm thất bại (kỳ vọng Cache Hit nhưng bị Miss)!");
  }
  console.log(`✓ Kiểm tra bộ đệm thành công (Cache HIT cho hash: ${hash1})`);

  // 4. Kiểm thử tra cứu Cache Miss
  const cacheMissResult = await r2Storage.checkCachedExport("non_existent_hash_9999999999999999", "docx");
  if (cacheMissResult.isCached) {
    throw new Error("Kỳ vọng Cache Miss nhưng lại trả về Cache Hit!");
  }
  console.log("✓ Kiểm tra Cache MISS chính xác cho văn bản chưa từng xuất.");

  // Dọn dẹp tệp test
  const testFilePath = path.join(process.cwd(), ".exports", `${hash1}.docx`);
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
    console.log("✓ Đã dọn dẹp tệp thử nghiệm cục bộ.");
  }

  console.log("\n🎉 HOÀN THÀNH 100% CÁC BÀI TEST R2 STORAGE & SHA-256 CACHE (TASK-213)!");
}

runR2StorageTests().catch((err) => {
  console.error("❌ Kiểm thử R2 Storage thất bại:", err);
  process.exit(1);
});
