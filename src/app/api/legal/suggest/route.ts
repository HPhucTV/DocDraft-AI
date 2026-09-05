import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CURATED_LEGAL_DOCUMENTS } from "@/lib/legal/legal-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/legal/suggest?q=...
 * Gợi ý căn cứ pháp lý tự động (Legal Autocomplete Suggestion - TASK-211).
 * Hỗ trợ tìm kiếm theo số hiệu, tên văn bản, cơ quan ban hành hoặc nội dung trích dẫn.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get("q")?.trim() || "";

  // Chuẩn hóa query: loại bỏ các tiền tố "Căn cứ", "can cu" nếu có
  const cleanQuery = rawQuery
    .replace(/^(căn\s+cứ|can\s+cu)\s+/i, "")
    .trim()
    .toLowerCase();

  try {
    // 1. Nếu có kết nối DB, truy vấn từ bảng legal_documents
    let dbResults: Array<{
      id: string;
      docCode: string;
      title: string;
      docType: string | null;
      issuingAuthority: string | null;
      status: string;
      fullCitation: string;
    }> = [];

    try {
      dbResults = await prisma.legalDocument.findMany({
        where: cleanQuery
          ? {
              OR: [
                { docCode: { contains: cleanQuery, mode: "insensitive" } },
                { title: { contains: cleanQuery, mode: "insensitive" } },
                { fullCitation: { contains: cleanQuery, mode: "insensitive" } },
                { issuingAuthority: { contains: cleanQuery, mode: "insensitive" } },
              ],
            }
          : undefined,
        take: 8,
        orderBy: [{ status: "asc" }, { docCode: "asc" }],
        select: {
          id: true,
          docCode: true,
          title: true,
          docType: true,
          issuingAuthority: true,
          status: true,
          fullCitation: true,
        },
      });
    } catch (dbErr) {
      console.warn("DB chưa sẵn sàng, dùng bộ nhớ đệm curated legal data:", dbErr);
    }

    // 2. Nếu DB trả về rỗng (chưa chạy seed), sử dụng CURATED_LEGAL_DOCUMENTS
    if (dbResults.length === 0) {
      const filtered = CURATED_LEGAL_DOCUMENTS.filter((d) => {
        if (!cleanQuery) return true;
        return (
          d.docCode.toLowerCase().includes(cleanQuery) ||
          d.title.toLowerCase().includes(cleanQuery) ||
          d.fullCitation.toLowerCase().includes(cleanQuery) ||
          d.issuingAuthority.toLowerCase().includes(cleanQuery)
        );
      }).slice(0, 8);

      const mapped = filtered.map((d, idx) => ({
        id: `mock-legal-${idx}`,
        docCode: d.docCode,
        title: d.title,
        docType: d.docType,
        issuingAuthority: d.issuingAuthority,
        status: d.status,
        fullCitation: d.fullCitation,
      }));

      return NextResponse.json(mapped);
    }

    return NextResponse.json(dbResults);
  } catch (error) {
    console.error("Lỗi gợi ý căn cứ pháp lý:", error);
    return NextResponse.json(
      { error: "Không thể tra cứu căn cứ pháp lý" },
      { status: 500 }
    );
  }
}
