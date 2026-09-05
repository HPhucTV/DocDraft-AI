import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export interface ExportCacheResult {
  isCached: boolean;
  fileUrl: string;
  presignedUrl?: string;
  key: string;
  fileBuffer?: Buffer;
}

export interface SaveExportParams {
  buffer: Buffer;
  hash: string;
  format: "docx" | "pdf";
  draftId?: string;
  userId?: string;
  title?: string;
  hasImageSignature?: boolean;
}

class R2StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private publicUrl: string;
  private isR2Configured: boolean = false;
  private localFallbackDir: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "docdraft-storage";
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || "";

    this.localFallbackDir = path.join(process.cwd(), ".exports");

    if (
      accountId &&
      accessKeyId &&
      secretAccessKey &&
      !accountId.includes("your-cloudflare")
    ) {
      try {
        this.s3Client = new S3Client({
          region: "auto",
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.isR2Configured = true;
      } catch (err) {
        console.warn("Không thể khởi tạo S3Client R2, chuyển sang Local Fallback:", err);
      }
    }
  }

  /**
   * Tính mã băm SHA-256 nội dung văn bản & config định dạng (ADR-007 / ADR-009)
   */
  public computeContentHash(content: unknown, config: unknown, format: string): string {
    const serialized = JSON.stringify({
      content,
      config,
      format,
    });
    return crypto.createHash("sha256").update(serialized).digest("hex");
  }

  /**
   * Kiểm tra bộ đệm kết quả xuất bản (Export Cache)
   */
  public async checkCachedExport(
    hash: string,
    format: "docx" | "pdf"
  ): Promise<ExportCacheResult> {
    const key = `exports/${hash}.${format}`;

    // 1. Kiểm tra trên Cloudflare R2 nếu được cấu hình
    if (this.isR2Configured && this.s3Client) {
      try {
        await this.s3Client.send(
          new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          })
        );

        let fileUrl = `${this.publicUrl}/${key}`;
        let presignedUrl: string | undefined;

        try {
          const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          });
          presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
          if (!this.publicUrl) {
            fileUrl = presignedUrl;
          }
        } catch {
          // Bỏ qua nếu lỗi sinh presigned url
        }

        return {
          isCached: true,
          fileUrl,
          presignedUrl,
          key,
        };
      } catch {
        // Cache miss trên R2
      }
    }

    // 2. Fallback: Kiểm tra bộ đệm cục bộ (Local Disk Cache)
    const localFilePath = path.join(this.localFallbackDir, `${hash}.${format}`);
    if (fs.existsSync(localFilePath)) {
      const fileBuffer = fs.readFileSync(localFilePath);
      return {
        isCached: true,
        fileUrl: `/api/storage/export/${hash}.${format}`,
        key,
        fileBuffer,
      };
    }

    return {
      isCached: false,
      fileUrl: "",
      key,
    };
  }

  /**
   * Lưu trữ tệp xuất bản vào R2 hoặc Local Cache & ghi nhận vào DB export_history
   */
  public async saveExportFile(params: SaveExportParams): Promise<{
    fileUrl: string;
    presignedUrl?: string;
    key: string;
  }> {
    const { buffer, hash, format, draftId, userId, hasImageSignature } = params;
    const key = `exports/${hash}.${format}`;
    const contentType =
      format === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/pdf";

    let fileUrl = `/api/storage/export/${hash}.${format}`;
    let presignedUrl: string | undefined;

    // 1. Upload lên Cloudflare R2
    if (this.isR2Configured && this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            Metadata: {
              hash,
              format,
              draftId: draftId || "unknown",
            },
          })
        );

        fileUrl = this.publicUrl ? `${this.publicUrl}/${key}` : "";
        const getCmd = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });
        presignedUrl = await getSignedUrl(this.s3Client, getCmd, { expiresIn: 900 });
        if (!fileUrl) {
          fileUrl = presignedUrl;
        }
      } catch (r2Err) {
        console.error("Lỗi khi lưu lên Cloudflare R2, fallback về local:", r2Err);
      }
    }

    // 2. Lưu vào local storage làm fallback dự phòng
    try {
      if (!fs.existsSync(this.localFallbackDir)) {
        fs.mkdirSync(this.localFallbackDir, { recursive: true });
      }
      fs.writeFileSync(path.join(this.localFallbackDir, `${hash}.${format}`), buffer);
    } catch (fsErr) {
      console.warn("Không thể ghi file local fallback:", fsErr);
    }

    // 3. Ghi nhận vào bảng export_history trong database nếu có thông tin người dùng và bản nháp
    if (draftId && userId) {
      try {
        await prisma.exportHistory.create({
          data: {
            draftId,
            userId,
            format,
            fileUrl: fileUrl || presignedUrl || `/api/storage/export/${hash}.${format}`,
            fileSizeBytes: BigInt(buffer.length),
            hasImageSignature: hasImageSignature || false,
          },
        });
      } catch (dbErr) {
        console.warn("Không thể ghi nhận ExportHistory vào cơ sở dữ liệu:", dbErr);
      }
    }

    return {
      fileUrl,
      presignedUrl,
      key,
    };
  }

  /**
   * Tạo Presigned Download URL cho một key đã lưu trên R2
   */
  public async getPresignedUrl(key: string, expiresInSeconds = 900): Promise<string | null> {
    if (!this.isR2Configured || !this.s3Client) {
      return null;
    }
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    } catch {
      return null;
    }
  }
}

export const r2Storage = new R2StorageService();
