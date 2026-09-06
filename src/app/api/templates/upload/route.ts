import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import mammoth from "mammoth";
import {
  convertPlainTextToHtml,
  extractPlaceholders,
  generateFormSchemaFromPlaceholders,
} from "@/lib/template-parser";

export const dynamic = "force-dynamic";

/**
 * POST /api/templates/upload
 * Nhận tệp mẫu (.docx, .txt, .md), bóc tách nội dung HTML và trích xuất danh sách biến số [...]
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để tải lên tệp mẫu" },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Vui lòng chọn một tệp văn bản hợp lệ (.docx, .txt, .md)" },
        { status: 400 }
      );
    }

    const fileName = (file as File).name || "mau-van-ban.txt";
    const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
    const baseName = fileName.replace(/\.[^/.]+$/, "");

    let htmlContent = "";
    let rawTextContent = "";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (fileExt === "docx") {
      try {
        const mammothHtml = await mammoth.convertToHtml({ buffer });
        const mammothText = await mammoth.extractRawText({ buffer });
        htmlContent = mammothHtml.value;
        rawTextContent = mammothText.value;
      } catch (err: unknown) {
        console.error("Lỗi parse mammoth docx:", err);
        return NextResponse.json(
          { error: "Không thể đọc cấu trúc tệp Word (.docx). Tệp có thể bị hỏng hoặc có mật khẩu bảo vệ." },
          { status: 422 }
        );
      }
    } else if (fileExt === "txt" || fileExt === "md") {
      const textDecoder = new TextDecoder("utf-8");
      rawTextContent = textDecoder.decode(buffer);
      htmlContent = convertPlainTextToHtml(rawTextContent);
    } else {
      return NextResponse.json(
        { error: "Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp .docx, .txt hoặc .md" },
        { status: 400 }
      );
    }

    if (!htmlContent.trim()) {
      return NextResponse.json(
        { error: "Tệp văn bản rỗng, không tìm thấy nội dung hợp lệ." },
        { status: 400 }
      );
    }

    // Tự động tìm tiêu đề gợi ý từ dòng đầu tiên có chữ in hoa hoặc tên file
    let inferredTitle = baseName;
    const lines = rawTextContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      // Tìm dòng in hoa ngắn (2-15 từ) làm tiêu đề
      const candidate = lines.find(
        (l) => l.length > 5 && l.length < 120 && (l === l.toUpperCase() || l.includes("BIÊN BẢN") || l.includes("TỜ TRÌNH") || l.includes("QUYẾT ĐỊNH") || l.includes("HỢP ĐỒNG") || l.includes("THÔNG BÁO"))
      );
      if (candidate) {
        inferredTitle = candidate;
      }
    }

    // Trích xuất biến [...]
    const combinedContent = `${rawTextContent} ${htmlContent}`;
    const placeholders = extractPlaceholders(combinedContent);
    const formSchema = generateFormSchemaFromPlaceholders(placeholders);

    return NextResponse.json({
      title: inferredTitle,
      fileName,
      contentHtml: htmlContent,
      placeholders,
      formSchema,
    });
  } catch (error) {
    console.error("Lỗi khi xử lý tải lên tệp mẫu:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi trong quá trình bóc tách tệp. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
