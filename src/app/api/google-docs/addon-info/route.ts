import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/google-docs/addon-info
 * Cung cấp metadata, phiên bản và các thiết lập chuẩn thể thức NĐ 30 cho Google Docs Add-on (TASK-502).
 */
export async function GET() {
  return NextResponse.json({
    addon: "DocDraft AI Google Docs Add-on",
    version: "1.0.0",
    standard: "Nghị định 30/2020/NĐ-CP",
    margins: {
      top: "20mm",
      bottom: "20mm",
      left: "30mm",
      right: "15mm",
    },
    defaultFont: {
      family: "Times New Roman",
      size: "13pt",
      lineSpacing: 1.25,
    },
    capabilities: [
      "format_nd30",
      "insert_national_header",
      "insert_signature_footer",
      "inline_rewrite",
      "template_generation",
      "raw_to_doc",
    ],
    status: "active",
  });
}
