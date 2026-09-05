import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu gieo dữ liệu khởi tạo (Seeding Database)...");

  // 1. Tạo tài khoản Quản trị viên mặc định (Admin)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@docdraft.vn" },
    update: {},
    create: {
      email: "admin@docdraft.vn",
      fullName: "Quản trị viên Hệ thống",
      organization: "Ban Cơ yếu Chính phủ / Cục Văn thư Lưu trữ",
      jobTitle: "Quản trị cấp cao",
      role: "ADMIN",
      locale: "vi",
      preferences: {
        theme: "system",
        fontSize: 14,
        fontFamily: "Times New Roman",
      },
    },
  });
  console.log(`✓ Đã tạo/cập nhật Admin: ${adminUser.email} (${adminUser.id})`);

  // 2. Tạo 5 danh mục mẫu chuẩn
  const categories = [
    {
      id: "administrative",
      name: "Văn bản hành chính nhà nước",
      description: "Quyết định, Công văn, Tờ trình, Thông báo, Biên bản, Kế hoạch chuẩn Nghị định 30/2020/NĐ-CP",
      icon: "Landmark",
      sortOrder: 1,
    },
    {
      id: "hr",
      name: "Quản trị Nhân sự & Lao động",
      description: "Hợp đồng lao động, Quyết định tiếp nhận/bổ nhiệm, Kỷ luật, Đánh giá nhân sự",
      icon: "Users",
      sortOrder: 2,
    },
    {
      id: "construction",
      name: "Đầu tư Xây dựng & Dự án",
      description: "Biên bản nghiệm thu, Tờ trình phê duyệt dự toán, Hồ sơ đấu thầu, Giấy phép xây dựng",
      icon: "HardHat",
      sortOrder: 3,
    },
    {
      id: "property",
      name: "Bất động sản & Mặt bằng",
      description: "Hợp đồng thuê mặt bằng kinh doanh, Biên bản bàn giao nhà đất, Đặt cọc chuyển nhượng",
      icon: "Building2",
      sortOrder: 4,
    },
    {
      id: "enterprise",
      name: "Doanh nghiệp & Hợp đồng Thương mại",
      description: "Nghị quyết HĐQT, Hợp đồng kinh tế, Biên bản họp ĐHĐCĐ, Điều lệ công ty",
      icon: "Briefcase",
      sortOrder: 5,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat,
    });
  }
  console.log(`✓ Đã khởi tạo thành công ${categories.length} danh mục biểu mẫu.`);

  // 3. Khởi tạo dữ liệu hạt giống 10 Mẫu Hành chính & Doanh nghiệp chuẩn Nghị định 30 (TASK-106)
  const { SEED_TEMPLATES } = await import("./data/templates");

  for (const t of SEED_TEMPLATES) {
    const createdTemplate = await prisma.template.upsert({
      where: { id: t.id },
      update: {
        categoryId: t.categoryId,
        industryPack: t.industryPack,
        title: t.title,
        description: t.description,
        systemPrompt: t.systemPrompt,
        userPromptTemplate: t.userPromptTemplate,
        fewShotExamples: t.fewShotExamples as unknown as object,
        formSchema: t.formSchema as unknown as object,
        exportConfig: t.exportConfig as unknown as object,
        isBuiltin: t.isBuiltin,
        isPublished: t.isPublished,
        avgRating: t.avgRating,
      },
      create: {
        id: t.id,
        categoryId: t.categoryId,
        industryPack: t.industryPack,
        title: t.title,
        description: t.description,
        systemPrompt: t.systemPrompt,
        userPromptTemplate: t.userPromptTemplate,
        fewShotExamples: t.fewShotExamples as unknown as object,
        formSchema: t.formSchema as unknown as object,
        exportConfig: t.exportConfig as unknown as object,
        isBuiltin: t.isBuiltin,
        createdBy: adminUser.id,
        usageCount: 0,
        avgRating: t.avgRating,
        isPublished: t.isPublished,
      },
    });
    console.log(`✓ Đã nạp mẫu văn bản: ${createdTemplate.title} (${createdTemplate.id})`);
  }
  console.log(`✓ Đã nạp thành công ${SEED_TEMPLATES.length} mẫu biểu hành chính & doanh nghiệp.`);

  console.log("🎉 Hoàn tất gieo dữ liệu (Seeding Completed)!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
