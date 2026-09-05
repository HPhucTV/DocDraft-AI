import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SEED_TEMPLATES } from "../../../../prisma/data/templates";

export const dynamic = "force-dynamic";

/**
 * GET /api/templates
 * Danh sách 10 mẫu hành chính & doanh nghiệp chuẩn Nghị định 30/2020/NĐ-CP
 */
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        industryPack: true,
        formSchema: true,
        userPromptTemplate: true,
      },
      orderBy: { title: "asc" },
    });

    if (templates && templates.length > 0) {
      return NextResponse.json(templates);
    }

    // Fallback sang seed data nếu database chưa có bản ghi
    const fallbackTemplates = SEED_TEMPLATES.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      industryPack: t.industryPack,
      formSchema: t.formSchema,
      userPromptTemplate: t.userPromptTemplate,
    }));

    return NextResponse.json(fallbackTemplates);
  } catch {
    // Trả về fallback static nếu DB connection lỗi
    const fallbackTemplates = SEED_TEMPLATES.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      industryPack: t.industryPack,
      formSchema: t.formSchema,
      userPromptTemplate: t.userPromptTemplate,
    }));

    return NextResponse.json(fallbackTemplates);
  }
}
