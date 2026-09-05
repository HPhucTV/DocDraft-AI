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

  // 3. Tạo Mẫu văn bản đầu tiên: Quyết định Bổ nhiệm Cán bộ (Industry Pack: HR / Administrative)
  const templateBoNhiem = await prisma.template.upsert({
    where: { id: "qd-bo-nhiem" },
    update: {},
    create: {
      id: "qd-bo-nhiem",
      categoryId: "administrative",
      industryPack: "HR",
      title: "Quyết định Bổ nhiệm Cán bộ / Lãnh đạo quản lý",
      description:
        "Mẫu Quyết định chuẩn thể thức Nghị định 30/2020/NĐ-CP về việc bổ nhiệm cán bộ giữ chức vụ lãnh đạo quản lý.",
      systemPrompt: `Bạn là trợ lý AI chuyên soạn thảo văn bản hành chính nhà nước Việt Nam, tuyệt đối tuân thủ Nghị định 30/2020/NĐ-CP.
QUY TẮC CỐT LÕI:
1. KHÔNG ảo giác số liệu. Bất kỳ thông tin nào người dùng chưa cung cấp (mức lương cụ thể, số quyết định trước đó, hệ số phụ cấp...) BẮT BUỘC để giữ chỗ dạng [...] để chuyên viên tự điền.
2. Phần đầu và phần ký tên phải khớp cấu trúc bảng ẩn 2 cột chuẩn Nghị định 30.
3. Sử dụng văn phong hành chính trang trọng, chính xác, dứt khoát.`,
      userPromptTemplate: `Soạn thảo Quyết định bổ nhiệm dựa trên các thông tin sau:
- Cơ quan ban hành: {{co_quan_ban_hanh}}
- Cấp trên trực tiếp: {{co_quan_cap_tren}}
- Người được bổ nhiệm: {{ho_ten_nguoi_duoc_bo_nhiem}}
- Chức danh hiện tại: {{chuc_danh_hien_tai}}
- Chức danh bổ nhiệm: {{chuc_danh_bo_nhiem}}
- Đơn vị công tác: {{don_vi_cong_tac}}
- Thời hạn bổ nhiệm: {{thoi_han_bo_nhiem}}
- Căn cứ pháp lý: {{can_cu_phap_ly}}`,
      formSchema: {
        type: "object",
        required: [
          "co_quan_ban_hanh",
          "ho_ten_nguoi_duoc_bo_nhiem",
          "chuc_danh_bo_nhiem",
          "don_vi_cong_tac",
        ],
        properties: {
          co_quan_cap_tren: {
            type: "string",
            title: "Tên cơ quan cấp trên",
            default: "ỦY BAN NHÂN DÂN THÀNH PHỐ",
          },
          co_quan_ban_hanh: {
            type: "string",
            title: "Tên cơ quan ban hành quyết định",
            placeholder: "Ví dụ: SỞ KẾ HOẠCH VÀ ĐẦU TƯ",
          },
          ho_ten_nguoi_duoc_bo_nhiem: {
            type: "string",
            title: "Họ và tên người được bổ nhiệm",
          },
          chuc_danh_hien_tai: {
            type: "string",
            title: "Chức vụ / Công việc hiện tại",
          },
          chuc_danh_bo_nhiem: {
            type: "string",
            title: "Chức vụ được bổ nhiệm",
          },
          don_vi_cong_tac: {
            type: "string",
            title: "Phòng ban / Đơn vị công tác",
          },
          thoi_han_bo_nhiem: {
            type: "string",
            title: "Thời hạn bổ nhiệm (năm)",
            default: "05 năm",
          },
          can_cu_phap_ly: {
            type: "string",
            title: "Căn cứ pháp lý bổ sung (nếu có)",
          },
        },
      },
      exportConfig: {
        margins: { top: 20, bottom: 20, left: 30, right: 15 },
        defaultFont: "Times New Roman",
        fontSize: 13,
      },
      isBuiltin: true,
      createdBy: adminUser.id,
      usageCount: 0,
      avgRating: 5.0,
      isPublished: true,
    },
  });
  console.log(`✓ Đã tạo mẫu văn bản: ${templateBoNhiem.title} (${templateBoNhiem.id})`);

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
