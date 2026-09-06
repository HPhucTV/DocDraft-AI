import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/storage/export/[filename]
 * Phục vụ tải file từ bộ đệm cục bộ (Local Fallback Storage) khi chưa cấu hình Cloudflare R2
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename } = await params;

  // Bảo vệ path traversal
  const sanitized = path.basename(filename);
  const filePath = path.join(process.cwd(), ".exports", sanitized);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Tệp tin không tồn tại hoặc đã hết hạn" }, { status: 404 });
  }

  const format = sanitized.endsWith(".docx") ? "docx" : "pdf";
  const contentType =
    format === "docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";

  const fileBuffer = fs.readFileSync(filePath);

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${sanitized}"`,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
