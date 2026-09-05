import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { performHybridLegalSearch } from "@/lib/legal/hybrid-search-rrf";

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

    // 2. Nếu DB trả về rỗng (hoặc chế độ Hybrid Search được kích hoạt), sử dụng Động cơ Hybrid Search RRF (TASK-407)
    if (dbResults.length === 0 || searchParams.get("hybrid") === "true") {
      const hybridResults = await performHybridLegalSearch(cleanQuery, {
        limit: 8,
        statusFilter: "ACTIVE",
      });

      return NextResponse.json(hybridResults);
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
