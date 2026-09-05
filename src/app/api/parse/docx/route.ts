import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/parse/docx
 * Proxy nhận file Word (.docx) từ trình duyệt, chuyển tiếp sang Document Service (FastAPI)
 * để bóc tách cấu trúc paragraphs và tables thành Tiptap ProseMirror JSON AST (TASK-207).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Vui lòng chọn một tệp Word (.docx) hợp lệ" },
        { status: 400 }
      );
    }

    const documentServiceUrl =
      process.env.DOCUMENT_SERVICE_URL || "http://localhost:8000";
    const internalSecret = process.env.INTERNAL_SECRET || "";

    // Gửi multipart form sang FastAPI
    const outgoingFormData = new FormData();
    outgoingFormData.append("file", file);

    const res = await fetch(`${documentServiceUrl}/parse/docx`, {
      method: "POST",
      headers: {
        "X-Internal-Secret": internalSecret,
      },
      body: outgoingFormData,
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Lỗi bóc tách Word từ Document Service: ${errText}` },
        { status: res.status }
      );
    }

    const parseResult = await res.json();
    return NextResponse.json(parseResult);
  } catch (error) {
    console.error("Lỗi khi xử lý tải lên tệp Word:", error);
    return NextResponse.json(
      { error: "Không thể xử lý và bóc tách tệp Word" },
      { status: 500 }
    );
  }
}
