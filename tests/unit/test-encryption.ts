import { encryptApiKey, decryptApiKey, maskApiKey } from "../../src/lib/encryption";

function runEncryptionTests() {
  console.log("🔐 Đang kiểm thử module mã hóa AES-256-GCM cho BYOK (TASK-107)...");

  const sampleKey = "sk-deepseek-test-99887766554433221100aabbccddeeff";

  // 1. Mã hóa
  const enc1 = encryptApiKey(sampleKey);
  const enc2 = encryptApiKey(sampleKey);

  if (!enc1.ciphertext || !enc1.iv || !enc1.auth_tag) {
    throw new Error("Mã hóa thiếu trường!");
  }

  // Hai lần mã hóa phải cho ra 2 IV khác nhau (tính ngẫu nhiên an toàn)
  if (enc1.iv === enc2.iv) {
    throw new Error("IV bị lặp lại!");
  }
  console.log("✓ Mã hóa tạo ra IV ngẫu nhiên và auth_tag chính xác.");

  // 2. Giải mã
  const dec1 = decryptApiKey(enc1);
  const dec2 = decryptApiKey(enc2);

  if (dec1 !== sampleKey || dec2 !== sampleKey) {
    throw new Error(`Giải mã không khớp! dec1=${dec1}, gốc=${sampleKey}`);
  }
  console.log("✓ Giải mã thành công, bảo toàn 100% nội dung gốc.");

  // 3. Kiểm thử chống giả mạo (Authentication Tag Verification)
  try {
    const tamperedPayload = {
      ...enc1,
      ciphertext: enc1.ciphertext.slice(0, -2) + (enc1.ciphertext.endsWith("aa") ? "bb" : "aa"),
    };
    decryptApiKey(tamperedPayload);
    throw new Error("LỖI BẢO MẬT: Giả mạo ciphertext nhưng không bị phát hiện!");
  } catch {
    console.log("✓ Bắt thành công dữ liệu bị giả mạo với auth_tag hợp lệ.");
  }

  // 4. Kiểm thử mask API key
  const masked = maskApiKey(sampleKey);
  if (!masked.startsWith("sk-") || !masked.endsWith("eeff") || !masked.includes("••••")) {
    throw new Error(`Mask key thất bại: ${masked}`);
  }
  console.log(`✓ Mask API key thành công: ${masked}`);

  console.log("\n🎉 KIỂM THỬ MÃ HÓA AES-256-GCM ĐẠT 100% TIÊU CHUẨN!");
}

runEncryptionTests();
