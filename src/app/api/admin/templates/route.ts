import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { TemplateService } from "@/lib/templates/template-service";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/templates
 * Danh sách mẫu văn bản (lọc theo custom/builtin, industryPack, categoryId, search)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const industryPack = searchParams.get("industryPack") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const onlyCustom = searchParams.get("onlyCustom") === "true";
    const isPublishedParam = searchParams.get("isPublished");
    const isPublished =
      isPublishedParam !== null ? isPublishedParam === "true" : undefined;

    const [templates, totalCustom, totalBuiltin, totalPublished] =
      await Promise.all([
        TemplateService.listTemplates({
          search,
          industryPack,
          categoryId,
          onlyCustom,
          isPublished,
        }),
        prisma.template.count({ where: { isBuiltin: false } }),
        prisma.template.count({ where: { isBuiltin: true } }),
        prisma.template.count({ where: { isPublished: true } }),
      ]);

    return NextResponse.json({
      success: true,
      templates,
      stats: {
        totalTemplates: totalCustom + totalBuiltin,
        totalCustom,
        totalBuiltin,
        totalPublished,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/templates] Error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tải danh sách mẫu" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/templates
 * Tạo mới hoặc lưu cập nhật mẫu tùy chỉnh
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để thực hiện thao tác này" },
        { status: 401 }
      );
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Thao tác chỉ dành cho Quản trị viên." },
        { status: 403 }
      );
    }
    const userId = session.user.id;

    const body = await req.json();
    const validation = TemplateService.validate(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu mẫu không hợp lệ",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const savedTemplate = await TemplateService.saveCustomTemplate(
      userId,
      validation.data
    );

    return NextResponse.json(
      {
        success: true,
        template: savedTemplate,
        message: "Lưu mẫu văn bản thành công",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/admin/templates] Error:", error);
    const message =
      error instanceof Error ? error.message : "Lỗi khi lưu mẫu văn bản";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
