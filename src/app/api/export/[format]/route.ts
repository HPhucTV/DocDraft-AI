import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/export/[format] (docx | pdf)
 * Next.js Proxy trung chuyển request xuất bản văn bản sang Document Service (FastAPI)
 * kèm header bảo mật nội bộ X-Internal-Secret (TASK-115).
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

    const documentServiceUrl =
      process.env.DOCUMENT_SERVICE_URL || "http://localhost:8000";
    const internalSecret = process.env.INTERNAL_SECRET || "";

    const targetUrl = `${documentServiceUrl}/export/${format}`;

    const payload =
      format === "docx"
        ? {
            draft_id: body.draftId || body.draft_id || "draft-temp",
            title: body.title || "Van_ban",
            content_json:
              body.contentJson ||
              body.content_json ||
              body.tiptap_json ||
              { type: "doc", content: [] },
            config: body.config || {
              margin_top_mm: 20,
              margin_bottom_mm: 20,
              margin_left_mm: 30,
              margin_right_mm: 15,
              font_family: "Times New Roman",
              font_size_pt: 13,
            },
          }
        : {
            draft_id: body.draftId || body.draft_id || "draft-temp",
            title: body.title || "Van_ban",
            html_content:
              body.htmlContent ||
              body.html_content ||
              body.html ||
              "<p></p>",
            config: body.config || {
              margin_top_mm: 20,
              margin_bottom_mm: 20,
              margin_left_mm: 30,
              margin_right_mm: 15,
              font_family: "Times New Roman",
              font_size_pt: 13,
            },
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

    const fileBuffer = await res.arrayBuffer();

    const mediaType =
      format === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/pdf";

    const contentDisposition =
      res.headers.get("Content-Disposition") ||
      `attachment; filename="${encodeURIComponent(payload.title)}.${format}"`;

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": mediaType,
        "Content-Disposition": contentDisposition,
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
