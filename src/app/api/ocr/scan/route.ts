import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/ocr/scan
 * Next.js API Route bóc tách OCR tiếng Việt từ ảnh scan hoặc PDF (TASK-405, API-003).
 * Chuyển tiếp yêu cầu sang FastAPI Document Service kèm header X-Internal-Secret.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn tệp ảnh hoặc PDF scan để bóc tách OCR" },
        { status: 400 }
      );
    }

    const documentServiceUrl =
      process.env.DOCUMENT_SERVICE_URL || "http://localhost:8000";
    const internalSecret = process.env.INTERNAL_SECRET || "";

    const forwardFormData = new FormData();
    forwardFormData.append("file", file, file.name);

    const res = await fetch(`${documentServiceUrl}/ocr/scan`, {
      method: "POST",
      headers: {
        "X-Internal-Secret": internalSecret,
      },
      body: forwardFormData,
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `OCR Service error (${res.status}): ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Lỗi thực hiện OCR:", error);
    return NextResponse.json(
      { error: "Không thể kết nối đến máy chủ nhận dạng OCR" },
      { status: 500 }
    );
  }
}
