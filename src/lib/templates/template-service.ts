import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const formFieldSchema = z.object({
  name: z
    .string()
    .min(1, "Tên biến không được để trống")
    .regex(/^[a-z0-9_]+$/, "Tên biến chỉ bao gồm chữ thường, số và dấu gạch dưới"),
  label: z.string().min(1, "Nhãn trường không được để trống"),
  type: z.enum([
    "text",
    "textarea",
    "number",
    "currency",
    "date",
    "select",
    "radio",
    "checkbox",
  ]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export const customTemplateSchema = z.object({
  id: z
    .string()
    .min(3, "Mã mẫu phải từ 3 ký tự trở lên")
    .regex(/^[a-z0-9-]+$/, "Mã mẫu chỉ bao gồm chữ thường, số và dấu gạch nối (-)")
    .optional(),
  title: z.string().min(3, "Tiêu đề mẫu phải từ 3 ký tự trở lên").max(255),
  description: z.string().max(1000).optional(),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  industryPack: z.string().min(1, "Vui lòng chọn nhóm ngành / Industry Pack"),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  systemPrompt: z
    .string()
    .min(20, "System Prompt phải từ 20 ký tự trở lên để đảm bảo tính chuẩn hóa"),
  userPromptTemplate: z
    .string()
    .min(10, "User Prompt Template phải từ 10 ký tự trở lên"),
  formSchema: z.object({
    fields: z.array(formFieldSchema).min(1, "Mẫu phải có ít nhất 1 trường nhập liệu"),
  }),
  exportConfig: z
    .object({
      margins: z.object({
        top: z.number().default(20),
        bottom: z.number().default(20),
        left: z.number().default(30),
        right: z.number().default(15),
      }),
      defaultFont: z.string().default("Times New Roman"),
      fontSize: z.number().default(13),
    })
    .optional()
    .default({
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      defaultFont: "Times New Roman",
      fontSize: 13,
    }),
  isPublished: z.boolean().default(true),
});

export type CustomTemplateInput = z.infer<typeof customTemplateSchema>;

export class TemplateService {
  /**
   * Kiểm tra tính hợp lệ của dữ liệu template
   */
  static validate(data: unknown) {
    return customTemplateSchema.safeParse(data);
  }

  /**
   * Render User Prompt bằng cách thay thế các placeholder {{variable_name}}
   */
  static renderPromptWithVariables(
    templateString: string,
    variables: Record<string, unknown>
  ): string {
    return templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
      const val = variables[key];
      if (val === undefined || val === null || val === "") {
        return `[${key.toUpperCase()}]`;
      }
      if (typeof val === "boolean") {
        return val ? "Có" : "Không";
      }
      return String(val);
    });
  }

  /**
   * Lấy danh sách mẫu (cả custom và builtin) với bộ lọc
   */
  static async listTemplates(filters?: {
    search?: string;
    industryPack?: string;
    categoryId?: string;
    isPublished?: boolean;
    onlyCustom?: boolean;
  }) {
    const where: Prisma.TemplateWhereInput = {};

    if (filters?.onlyCustom) {
      where.isBuiltin = false;
    }

    if (filters?.industryPack && filters.industryPack !== "ALL") {
      where.industryPack = filters.industryPack;
    }

    if (filters?.categoryId && filters.categoryId !== "ALL") {
      where.categoryId = filters.categoryId;
    }

    if (filters?.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    if (filters?.search && filters.search.trim()) {
      const query = filters.search.trim();
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { id: { contains: query, mode: "insensitive" } },
      ];
    }

    return prisma.template.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Lấy chi tiết mẫu theo ID
   */
  static async getTemplateById(id: string) {
    return prisma.template.findUnique({
      where: { id },
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Lưu hoặc cập nhật mẫu tùy chỉnh (Custom Template)
   */
  static async saveCustomTemplate(
    userId: string | null,
    input: CustomTemplateInput
  ) {
    const validated = customTemplateSchema.parse(input);

    const templateId =
      validated.id ||
      `custom-${validated.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;

    // Kiểm tra xem mẫu đã tồn tại hay chưa
    const existing = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (existing && existing.isBuiltin) {
      throw new Error("Không thể chỉnh sửa hoặc ghi đè mẫu hệ thống tích hợp sẵn (Builtin)");
    }

    const data: Prisma.TemplateCreateInput = {
      id: templateId,
      title: validated.title,
      description: validated.description || null,
      industryPack: validated.industryPack,
      thumbnailUrl: validated.thumbnailUrl || null,
      systemPrompt: validated.systemPrompt,
      userPromptTemplate: validated.userPromptTemplate,
      formSchema: validated.formSchema as unknown as Prisma.InputJsonValue,
      exportConfig: validated.exportConfig as unknown as Prisma.InputJsonValue,
      isBuiltin: false,
      isPublished: validated.isPublished,
      category: {
        connect: { id: validated.categoryId },
      },
      ...(userId ? { creator: { connect: { id: userId } } } : {}),
    };

    if (existing) {
      return prisma.template.update({
        where: { id: templateId },
        data: {
          title: validated.title,
          description: validated.description || null,
          industryPack: validated.industryPack,
          thumbnailUrl: validated.thumbnailUrl || null,
          systemPrompt: validated.systemPrompt,
          userPromptTemplate: validated.userPromptTemplate,
          formSchema: validated.formSchema as unknown as Prisma.InputJsonValue,
          exportConfig: validated.exportConfig as unknown as Prisma.InputJsonValue,
          isPublished: validated.isPublished,
          categoryId: validated.categoryId,
        },
      });
    }

    return prisma.template.create({ data });
  }

  /**
   * Xóa mẫu tùy chỉnh
   */
  static async deleteCustomTemplate(id: string) {
    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error("Mẫu không tồn tại");
    }

    if (template.isBuiltin) {
      throw new Error("Không được phép xóa mẫu hệ thống tích hợp sẵn");
    }

    return prisma.template.delete({
      where: { id },
    });
  }

  /**
   * Bật/tắt trạng thái xuất bản của mẫu
   */
  static async togglePublish(id: string, isPublished: boolean) {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) {
      throw new Error("Mẫu không tồn tại");
    }

    return prisma.template.update({
      where: { id },
      data: { isPublished },
    });
  }
}
