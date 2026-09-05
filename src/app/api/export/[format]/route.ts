import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { r2Storage } from "@/lib/storage/r2-storage";
import { optimizeHtmlForPdfPageBreak } from "@/lib/export/pdf-page-break";

export const dynamic = "force-dynamic";

/**
 * POST /api/export/[format] (docx | pdf)
 * Next.js Proxy xuất bản văn bản sang Document Service (FastAPI)
 * Tích hợp Cloudflare R2 Storage & SHA-256 Hash Cache (TASK-213, ADR-007, ADR-009).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ format: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { format } = await params;

  if (format !== "docx" && format !== "pdf") {
    return NextResponse.json(
      { error: `Định dạng '${format}' không được hỗ trợ. Chỉ chấp nhận 'docx' hoặc 'pdf'` },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    const draftId = body.draftId || body.draft_id || "draft-temp";
    const title = body.title || "Van_ban";
    const config = body.config || {
      margin_top_mm: 20,
      margin_bottom_mm: 20,
      margin_left_mm: 30,
      margin_right_mm: 15,
      font_family: "Times New Roman",
      font_size_pt: 13,
    };

    const rawContent =
      format === "docx"
        ? body.contentJson || body.content_json || body.tiptap_json || { type: "doc", content: [] }
        : body.htmlContent || body.html_content || body.html || "<p></p>";

    const content =
      format === "pdf" && typeof rawContent === "string"
        ? optimizeHtmlForPdfPageBreak(rawContent)
        : rawContent;

    // 1. Tính mã băm SHA-256 của nội dung và cấu hình xuất bản
    const contentHash = r2Storage.computeContentHash(content, config, format);

    // Kiểm tra chế độ yêu cầu trả về (binary trực tiếp hay URL tải về)
    const urlMode =
      req.nextUrl.searchParams.get("mode") === "url" ||
      req.headers.get("X-Download-Mode") === "url";

    // 2. Kiểm tra bộ đệm kết quả xuất bản (Export Cache)
    const cached = await r2Storage.checkCachedExport(contentHash, format);
    if (cached.isCached) {
      if (urlMode) {
        return NextResponse.json({
          success: true,
          cached: true,
          hash: contentHash,
          downloadUrl: cached.presignedUrl || cached.fileUrl,
        });
      }

      if (cached.fileBuffer) {
        const mediaType =
          format === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/pdf";
        return new Response(new Uint8Array(cached.fileBuffer), {
          headers: {
            "Content-Type": mediaType,
            "Content-Disposition": `attachment; filename="${encodeURIComponent(title)}.${format}"`,
            "X-DocDraft-Cache": "HIT",
            "X-DocDraft-Hash": contentHash,
          },
        });
      }
    }

    // 3. Cache Miss: Gọi Document Service (FastAPI) để render
    const documentServiceUrl =
      process.env.DOCUMENT_SERVICE_URL || "http://localhost:8000";
    const internalSecret = process.env.INTERNAL_SECRET || "";

    const targetUrl = `${documentServiceUrl}/export/${format}`;

    const payload =
      format === "docx"
        ? {
            draft_id: draftId,
            title,
            content_json: content,
            config,
          }
        : {
            draft_id: draftId,
            title,
            html_content: content,
            config,
          };

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": internalSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errDetail = await res.text();
      return NextResponse.json(
        { error: `Document Service error (${res.status}): ${errDetail}` },
        { status: res.status }
      );
    }

    const fileArrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(fileArrayBuffer);

    // 4. Lưu trữ tệp vào R2 Storage / Cache & ghi nhận vào DB
    const saved = await r2Storage.saveExportFile({
      buffer,
      hash: contentHash,
      format,
      draftId: draftId !== "draft-temp" ? draftId : undefined,
      userId: session.user.id,
      title,
      hasImageSignature: body.hasImageSignature || false,
    });

    if (urlMode) {
      return NextResponse.json({
        success: true,
        cached: false,
        hash: contentHash,
        downloadUrl: saved.presignedUrl || saved.fileUrl,
      });
    }

    const mediaType =
      format === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/pdf";

    const contentDisposition =
      res.headers.get("Content-Disposition") ||
      `attachment; filename="${encodeURIComponent(payload.title)}.${format}"`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mediaType,
        "Content-Disposition": contentDisposition,
        "X-DocDraft-Cache": "MISS",
        "X-DocDraft-Hash": contentHash,
      },
    });
  } catch (error: unknown) {
    console.error(`Lỗi proxy xuất ${format}:`, error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        error: `Không thể kết nối đến Document Service: ${msg}`,
      },
      { status: 502 }
    );
  }
}
