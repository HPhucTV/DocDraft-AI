import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SEED_TEMPLATES } from "../../../../prisma/data/templates";
import {
  extractPlaceholders,
  generateFormSchemaFromPlaceholders,
} from "@/lib/template-parser";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/templates
 * Trả về danh sách mẫu hệ thống quy chuẩn + mẫu tùy chỉnh do người dùng tạo
 */
export async function GET() {
  let userId: string | undefined = undefined;
  try {
    const session = await auth();
    userId = session?.user?.id;
  } catch {
    // Không có session, tiếp tục lấy mẫu công khai
  }

  try {
    const dbTemplates = await prisma.template.findMany({
      where: {
        isPublished: true,
        OR: [
          { isBuiltin: true },
          ...(userId ? [{ createdBy: userId }] : []),
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        industryPack: true,
        formSchema: true,
        userPromptTemplate: true,
        isBuiltin: true,
        createdBy: true,
        createdAt: true,
      },
      orderBy: [{ isBuiltin: "desc" }, { title: "asc" }],
    });

    if (dbTemplates && dbTemplates.length > 0) {
      const formatted = dbTemplates.map((t) => ({
        ...t,
        isCustom: !t.isBuiltin,
      }));
      return NextResponse.json(formatted);
    }

    // Fallback sang seed data nếu database chưa có bản ghi
    const fallbackTemplates = SEED_TEMPLATES.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      industryPack: t.industryPack,
      formSchema: t.formSchema,
      userPromptTemplate: t.userPromptTemplate,
      isBuiltin: true,
      isCustom: false,
    }));

    return NextResponse.json(fallbackTemplates);
  } catch (error) {
    console.error("Lỗi khi tải templates từ database:", error);
    // Trả về fallback static nếu DB connection lỗi
    const fallbackTemplates = SEED_TEMPLATES.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      industryPack: t.industryPack,
      formSchema: t.formSchema,
      userPromptTemplate: t.userPromptTemplate,
      isBuiltin: true,
      isCustom: false,
    }));

    return NextResponse.json(fallbackTemplates);
  }
}

/**
 * POST /api/templates
 * Người dùng đã đăng nhập lưu mẫu tùy chỉnh mới
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để lưu mẫu văn bản" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { title, description, industryPack, contentHtml, formSchema } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên tiêu đề cho mẫu văn bản" },
        { status: 400 }
      );
    }

    if (!contentHtml || typeof contentHtml !== "string" || !contentHtml.trim()) {
      return NextResponse.json(
        { error: "Nội dung mẫu văn bản không được để trống" },
        { status: 400 }
      );
    }

    // Tự động sinh formSchema nếu chưa có
    let finalFormSchema = formSchema;
    if (
      !finalFormSchema ||
      !Array.isArray(finalFormSchema.fields) ||
      finalFormSchema.fields.length === 0
    ) {
      const placeholders = extractPlaceholders(contentHtml);
      finalFormSchema = generateFormSchemaFromPlaceholders(placeholders);
    }

    // Mã ID mẫu độc nhất
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const templateId = `user_${Date.now()}_${randomSuffix}`;

    const newTemplate = await prisma.template.create({
      data: {
        id: templateId,
        title: title.trim(),
        description: description?.trim() || "Mẫu văn bản tùy chỉnh cá nhân",
        industryPack: (industryPack?.trim() || "DOANH NGHIỆP").toUpperCase(),
        systemPrompt:
          "BẠN LÀ CHUYÊN GIA VĂN PHÒNG VÀ PHÁP CHẾ. Dựa trên các thông tin được cung cấp, hãy tạo văn bản hoàn chỉnh theo mẫu dưới đây.",
        userPromptTemplate: contentHtml,
        formSchema: finalFormSchema as unknown as Prisma.InputJsonValue,
        isBuiltin: false,
        isPublished: true,
        createdBy: session.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        industryPack: true,
        formSchema: true,
        userPromptTemplate: true,
        isBuiltin: true,
        createdBy: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        ...newTemplate,
        isCustom: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi khi lưu mẫu mới:", error);
    return NextResponse.json(
      { error: "Không thể lưu mẫu văn bản. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
