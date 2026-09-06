import { NextRequest, NextResponse } from "next/server";
import { getOrganization } from "@/lib/organization/org-service";
import { auth } from "@/auth";

export interface SmartFillSuggestion {
  placeholder: string;
  suggestedValue: string;
  source: "ORGANIZATION" | "SYSTEM_DATE" | "AI_INFERRED" | "DEFAULT";
  confidence: number;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { documentContent = "", placeholders = [] } = body;

    if (!Array.isArray(placeholders) || placeholders.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const org = getOrganization();
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const formattedDate = `ngày ${day} tháng ${month} năm ${year}`;

    const suggestions: SmartFillSuggestion[] = [];

    // Danh mục so khớp quy chuẩn từ hồ sơ cơ quan
    for (const rawPl of placeholders) {
      const pl = String(rawPl).trim();
      const cleanPl = pl.replace(/^\[+|\]+$/g, "").toUpperCase();

      // 1. Cơ quan cấp trên
      if (
        cleanPl.includes("CƠ QUAN CẤP TRÊN") ||
        cleanPl.includes("CƠ QUAN CHỦ QUẢN") ||
        cleanPl.includes("UBND") ||
        cleanPl.includes("BỘ CHỦ QUẢN")
      ) {
        suggestions.push({
          placeholder: pl,
          suggestedValue: org.superiorAgency,
          source: "ORGANIZATION",
          confidence: 0.98,
        });
        continue;
      }

      // 2. Cơ quan ban hành trực tiếp
      if (
        cleanPl.includes("TÊN CƠ QUAN") ||
        cleanPl.includes("TÊN ĐƠN VỊ") ||
        cleanPl.includes("CƠ QUAN BAN HÀNH") ||
        cleanPl.includes("ĐƠN VỊ BAN HÀNH") ||
        cleanPl.includes("TÊN CÔNG TY")
      ) {
        suggestions.push({
          placeholder: pl,
          suggestedValue: org.issuingAgency,
          source: "ORGANIZATION",
          confidence: 0.98,
        });
        continue;
      }

      // 3. Địa danh
      if (
        cleanPl.includes("ĐỊA DANH") ||
        cleanPl.includes("TỈNH/THÀNH PHỐ") ||
        cleanPl.includes("TỈNH / TP") ||
        cleanPl.includes("NƠI BAN HÀNH")
      ) {
        suggestions.push({
          placeholder: pl,
          suggestedValue: "Hà Nội",
          source: "ORGANIZATION",
          confidence: 0.95,
        });
        continue;
      }

      // 4. Ngày tháng năm
      if (
        cleanPl.includes("NGÀY THÁNG") ||
        cleanPl.includes("NGÀY...") ||
        cleanPl.includes("NGÀY/THÁNG") ||
        cleanPl.includes("THỜI GIAN BAN HÀNH")
      ) {
        suggestions.push({
          placeholder: pl,
          suggestedValue: formattedDate,
          source: "SYSTEM_DATE",
          confidence: 1.0,
        });
        continue;
      }

      // 5. Số hiệu văn bản
      if (
        cleanPl.includes("SỐ HIỆU") ||
        cleanPl.includes("SỐ/KÝ HIỆU") ||
        cleanPl.includes("SỐ KÝ HIỆU") ||
        cleanPl.includes("SỐ: ...")
      ) {
        suggestions.push({
          placeholder: pl,
          suggestedValue: `01/TTr-${org.code}`,
          source: "ORGANIZATION",
          confidence: 0.92,
        });
        continue;
      }

      // 6. Người ký / Chức vụ
      if (
        cleanPl.includes("NGƯỜI KÝ") ||
        cleanPl.includes("HỌ VÀ TÊN NGƯỜI KÝ") ||
        cleanPl.includes("THỦ TRƯỞNG") ||
        cleanPl.includes("GIÁM ĐỐC")
      ) {
        const signerName =
          org.departments[0]?.headName || session?.user?.name || "Nguyễn Văn Lãnh Đạo";
        suggestions.push({
          placeholder: pl,
          suggestedValue: signerName,
          source: "ORGANIZATION",
          confidence: 0.9,
        });
        continue;
      }

      if (cleanPl.includes("CHỨC VỤ") || cleanPl.includes("QUYỀN HẠN")) {
        suggestions.push({
          placeholder: pl,
          suggestedValue: "Tổng Giám đốc",
          source: "ORGANIZATION",
          confidence: 0.9,
        });
        continue;
      }

      // 7. Địa chỉ & Thông tin liên hệ
      if (cleanPl.includes("ĐỊA CHỈ")) {
        suggestions.push({
          placeholder: pl,
          suggestedValue: org.address,
          source: "ORGANIZATION",
          confidence: 0.95,
        });
        continue;
      }

      if (cleanPl.includes("SỐ ĐIỆN THOẠI") || cleanPl.includes("HOTLINE")) {
        suggestions.push({
          placeholder: pl,
          suggestedValue: org.phone,
          source: "ORGANIZATION",
          confidence: 0.95,
        });
        continue;
      }

      if (cleanPl.includes("MÃ SỐ THUẾ") || cleanPl.includes("MST")) {
        suggestions.push({
          placeholder: pl,
          suggestedValue: org.taxCode,
          source: "ORGANIZATION",
          confidence: 0.98,
        });
        continue;
      }

      // 8. Các trường nội dung suy luận ngữ cảnh
      if (cleanPl.includes("LÝ DO") || cleanPl.includes("MỤC ĐÍCH")) {
        suggestions.push({
          placeholder: pl,
          suggestedValue: "Thực hiện nhiệm vụ công tác chuyên môn và kế hoạch đã được phê duyệt",
          source: "AI_INFERRED",
          confidence: 0.85,
        });
        continue;
      }

      if (cleanPl.includes("SỐ TIỀN")) {
        suggestions.push({
          placeholder: pl,
          suggestedValue: "50.000.000 VNĐ",
          source: "AI_INFERRED",
          confidence: 0.8,
        });
        continue;
      }

      if (cleanPl.includes("BẰNG CHỮ")) {
        suggestions.push({
          placeholder: pl,
          suggestedValue: "Năm mươi triệu đồng chẵn",
          source: "AI_INFERRED",
          confidence: 0.8,
        });
        continue;
      }

      // Mặc định fallback
      suggestions.push({
        placeholder: pl,
        suggestedValue: `[Thông tin ${cleanPl.toLowerCase()}]`,
        source: "DEFAULT",
        confidence: 0.5,
      });
    }

    return NextResponse.json({
      success: true,
      suggestions,
      orgSummary: {
        name: org.name,
        code: org.code,
        superiorAgency: org.superiorAgency,
        issuingAgency: org.issuingAgency,
      },
    });
  } catch (error) {
    console.error("Lỗi API Smart-Fill:", error);
    return NextResponse.json(
      { error: "Không thể xử lý yêu cầu Smart Fill" },
      { status: 500 }
    );
  }
}
