import crypto from "crypto";

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  auth_tag: string;
  updated_at: string;
}

export interface UserCustomApiKeys {
  deepseek?: EncryptedPayload;
  gemini?: EncryptedPayload;
}

/**
 * Lấy khóa bí mật Master 32-byte để mã hóa AES-256-GCM.
 * Ưu tiên ENCRYPTION_MASTER_KEY -> NEXTAUTH_SECRET -> Fallback dev key.
 */
function getMasterKey(): Buffer {
  const rawKey =
    process.env.ENCRYPTION_MASTER_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "docdraft-default-dev-encryption-key-2026";

  return crypto.createHash("sha256").update(rawKey).digest();
}

/**
 * Mã hóa khóa API người dùng bằng AES-256-GCM (Anti-leak Invariant).
 */
export function encryptApiKey(plainKey: string): EncryptedPayload {
  if (!plainKey || plainKey.trim().length === 0) {
    throw new Error("API Key không được để trống khi mã hóa");
  }

  const trimmed = plainKey.trim();
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(12); // Chuẩn 96-bit IV cho GCM

  const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);
  let ciphertext = cipher.update(trimmed, "utf8", "hex");
  ciphertext += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString("hex"),
    auth_tag: authTag.toString("hex"),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Giải mã khóa API trong bộ nhớ RAM tạm thời ngay trước khi gọi LLM.
 */
export function decryptApiKey(payload: {
  ciphertext: string;
  iv: string;
  auth_tag: string;
}): string {
  if (!payload.ciphertext || !payload.iv || !payload.auth_tag) {
    throw new Error("Dữ liệu mã hóa không hợp lệ hoặc thiếu thông số");
  }

  const masterKey = getMasterKey();
  const iv = Buffer.from(payload.iv, "hex");
  const authTag = Buffer.from(payload.auth_tag, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, iv);
  decipher.setAuthTag(authTag);

  let plain = decipher.update(payload.ciphertext, "hex", "utf8");
  plain += decipher.final("utf8");

  return plain;
}

/**
 * Che giấu khóa API để hiển thị an toàn trên giao diện người dùng (vd: sk-****9a2f).
 */
export function maskApiKey(plainKey: string): string {
  if (!plainKey) return "";
  const trimmed = plainKey.trim();
  if (trimmed.length <= 8) {
    return "••••••••";
  }
  const prefix = trimmed.slice(0, 3);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••${suffix}`;
}
