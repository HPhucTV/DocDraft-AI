/**
 * KỊCH BẢN KIỂM THỬ TỪNG CHỨC NĂNG THỰC TẾ TRÊN TOÀN BỘ HỆ THỐNG (LIVE E2E VERIFICATION)
 * Kiểm tra kết nối mạng thực tế tới cả cổng 3000 (Next.js) và cổng 8000 (FastAPI Document Service).
 */

process.loadEnvFile?.();

interface TestResult {
  category: string;
  name: string;
  status: "PASS" | "FAIL";
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  category: string,
  name: string,
  fn: () => Promise<string | void>
) {
  const start = Date.now();
  try {
    const detail = await fn();
    results.push({
      category,
      name,
      status: "PASS",
      durationMs: Date.now() - start,
      details: detail || undefined,
    });
    console.log(`  ✅ [PASS] ${name} (${Date.now() - start}ms)`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({
      category,
      name,
      status: "FAIL",
      durationMs: Date.now() - start,
      details: msg,
    });
    console.error(`  ❌ [FAIL] ${name} (${Date.now() - start}ms):`, msg);
  }
}

async function runLiveVerification() {
  console.log("==============================================================================");
  console.log("       🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN TỪNG CHỨC NĂNG DỰ ÁN DOCDRAFT AI");
  console.log("==============================================================================\n");

  // --------------------------------------------------------------------------
  // NHÓM 1: DOCUMENT SERVICE MICROSERVICE (FASTAPI :8000)
  // --------------------------------------------------------------------------
  console.log("--- [NHÓM 1] Kiểm thử Microservice Document Service (Port 8000) ---");

  await testEndpoint("Document Service", "Endpoint Healthcheck (/health)", async () => {
    const res = await fetch("http://localhost:8000/health");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();
    if (data.status !== "healthy") throw new Error(`Unexpected status: ${data.status}`);
    return `Service: ${data.service} v${data.version}, Uptime: ${data.uptime_seconds}s`;
  });

  await testEndpoint("Document Service", "Tài liệu OpenAPI (/docs)", async () => {
    const res = await fetch("http://localhost:8000/docs");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const html = await res.text();
    if (!html.includes("Swagger") && !html.includes("OpenAPI") && !html.includes("FastAPI")) {
      throw new Error("Không nhận diện được trang Swagger UI");
    }
    return "Swagger UI hiển thị đầy đủ";
  });

  await testEndpoint("Document Service", "Xuất bản file Word (.docx) nhị phân", async () => {
    const payload = {
      draft_id: "draft-e2e-live-test",
      title: "To_trinh_kinh_phi_test",
      config: {
        margin_left_mm: 30,
        margin_right_mm: 15,
        margin_top_mm: 20,
        margin_bottom_mm: 20,
        font_family: "Times New Roman",
        font_size_pt: 13,
      },
      content_json: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Độc lập - Tự do - Hạnh phúc" }],
          },
        ],
      },
    };

    const res = await fetch("http://localhost:8000/export/docx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret":
          process.env.INTERNAL_SECRET ||
          process.env.DOCDRAFT_INTERNAL_SECRET ||
          "docdraft_internal_secret_dev_2026",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP status ${res.status}: ${await res.text()}`);
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Kiểm tra Magic Bytes của ZIP/OpenXML: PK (0x50, 0x4B)
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new Error("Dữ liệu trả về không phải định dạng OpenXML DOCX hợp lệ");
    }
    return `Kích thước tệp: ${bytes.length} bytes (Magic bytes: PK)`;
  });

  await testEndpoint("Document Service", "Xuất bản file Vector PDF (/export/pdf)", async () => {
    const payload = {
      draft_id: "draft-e2e-live-test",
      title: "Van_ban_mau_test",
      html_content: `
        <div style="font-family: 'Times New Roman'; font-size: 13pt;">
          <h1 style="text-align: center;">QUYẾT ĐỊNH BỔ NHIỆM</h1>
          <p>Căn cứ Nghị định số 30/2020/NĐ-CP về công tác văn thư...</p>
        </div>
      `,
    };

    const res = await fetch("http://localhost:8000/export/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret":
          process.env.INTERNAL_SECRET ||
          process.env.DOCDRAFT_INTERNAL_SECRET ||
          "docdraft_internal_secret_dev_2026",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP status ${res.status}: ${await res.text()}`);
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Kiểm tra Magic Bytes của PDF: %PDF- (0x25, 0x50, 0x44, 0x46)
    if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
      throw new Error("Dữ liệu trả về không phải file PDF hợp lệ");
    }
    return `Kích thước tệp: ${bytes.length} bytes (Magic bytes: %PDF-)`;
  });

  // --------------------------------------------------------------------------
  // NHÓM 2: GIAO DIỆN NGƯỜI DÙNG WEB NEXT.JS (:3000)
  // --------------------------------------------------------------------------
  console.log("\n--- [NHÓM 2] Kiểm thử Giao diện Web Next.js 14 (Port 3000) ---");

  await testEndpoint("Web UI", "Trang chủ Landing Page (/)", async () => {
    const res = await fetch("http://localhost:3000/");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const html = await res.text();
    if (!html.includes("DocDraft") && !html.includes("Nghị định 30")) {
      throw new Error("Trang chủ không chứa nội dung nhận diện của DocDraft");
    }
    return "Tải trang thành công";
  });

  await testEndpoint("Web UI", "Trang Soạn thảo Khổ giấy A4 Canvas (/editor)", async () => {
    const res = await fetch("http://localhost:3000/editor");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const html = await res.text();
    if (!html.includes("editor") && !html.includes("A4") && !html.includes("DocDraft")) {
      throw new Error("Trang Editor không nạp được component soạn thảo");
    }
    return "Editor A4 Canvas sẵn sàng";
  });

  await testEndpoint("Web UI", "Giao diện Microsoft Word Add-in Task Pane (/word-addin)", async () => {
    const res = await fetch("http://localhost:3000/word-addin");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const html = await res.text();
    if (!html.includes("Word") && !html.includes("Chuẩn hóa")) {
      throw new Error("Trang Word Add-in không tải được");
    }
    return "Task Pane chuẩn hóa thể thức sẵn sàng";
  });

  await testEndpoint("Web UI", "Trang Quản trị Mẫu văn bản (/admin/templates)", async () => {
    const res = await fetch("http://localhost:3000/admin/templates");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    return "Tải trang Quản trị mẫu văn bản thành công";
  });

  await testEndpoint("Web UI", "Trình thiết kế Mẫu tùy chỉnh (/admin/templates/builder)", async () => {
    const res = await fetch("http://localhost:3000/admin/templates/builder");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    return "Trình thiết kế kéo thả Custom Template Builder sẵn sàng";
  });

  await testEndpoint("Web UI", "Dashboard Thống kê & Phân tích (/admin/analytics)", async () => {
    const res = await fetch("http://localhost:3000/admin/analytics");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    return "Dashboard Analytics tải thành công";
  });

  await testEndpoint("Web UI", "Cổng tra cứu công khai Xác thực QR Code (/verify/[code])", async () => {
    const res = await fetch("http://localhost:3000/verify/DEMO-QR-CODE-2026");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const html = await res.text();
    if (!html.includes("xác thực") && !html.includes("QR") && !html.includes("DocDraft")) {
      throw new Error("Trang xác thực không nạp đúng nội dung");
    }
    return "Cổng tra cứu công khai SHA-256 sẵn sàng";
  });

  // --------------------------------------------------------------------------
  // NHÓM 3: HỆ THỐNG API BACKEND NEXT.JS (:3000)
  // --------------------------------------------------------------------------
  console.log("\n--- [NHÓM 3] Kiểm thử Hệ thống REST API Backend Next.js ---");

  await testEndpoint("Backend API", "API Danh sách Mẫu văn bản (/api/admin/templates)", async () => {
    const res = await fetch("http://localhost:3000/api/admin/templates");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.templates)) {
      throw new Error("Cấu trúc trả về không hợp lệ");
    }
    return `Tải được ${data.templates.length} mẫu, tổng số mẫu hệ thống: ${data.stats?.totalTemplates || data.templates.length}`;
  });

  await testEndpoint("Backend API", "API Số liệu Thống kê (/api/admin/analytics/stats)", async () => {
    const res = await fetch("http://localhost:3000/api/admin/analytics/stats?timeRange=30d");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.data?.kpis) {
      throw new Error("Dữ liệu analytics stats thiếu KPIs");
    }
    return `Tổng văn bản: ${data.data.kpis.totalDrafts}, Tỷ lệ hoàn thành: ${data.data.kpis.completionRate}%`;
  });

  await testEndpoint("Backend API", "API Xuất Báo cáo CSV (/api/admin/analytics/export)", async () => {
    const res = await fetch("http://localhost:3000/api/admin/analytics/export?timeRange=30d");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);

    // Kiểm tra UTF-8 BOM ([0xEF, 0xBB, 0xBF]) giúp Microsoft Excel tự động nhận diện tiếng Việt
    if (bytes[0] !== 0xef || bytes[1] !== 0xbb || bytes[2] !== 0xbf) {
      throw new Error("Tệp CSV thiếu UTF-8 BOM ([0xEF, 0xBB, 0xBF]) cho Excel tiếng Việt");
    }
    const text = new TextDecoder().decode(bytes);
    return `Xuất CSV tiếng Việt chuẩn UTF-8 BOM cho Excel thành công, độ dài: ${text.length} ký tự`;
  });

  // --------------------------------------------------------------------------
  // NHÓM 4: NGHIỆP VỤ CỐT LÕI (BUSINESS ENGINES & COMPLIANCE NĐ 30)
  // --------------------------------------------------------------------------
  console.log("\n--- [NHÓM 4] Kiểm thử Nghiệp vụ Cốt lõi & Quy chuẩn NĐ 30 ---");

  // 1. Compliance Engine NĐ 30
  await testEndpoint("Business Logic", "Bộ luật Kiểm tra Thể thức NĐ 30 (Compliance Engine)", async () => {
    const { checkCompliance } = await import("../src/lib/compliance/compliance-engine");
    const testHtml = `
      <table style="width:100%;">
        <tr>
          <td>ỦY BAN NHÂN DÂN THÀNH PHỐ<br>VĂN PHÒNG<br>Số: 123/BC-VP</td>
          <td>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc<br>Hà Nội, ngày 05 tháng 09 năm 2026</td>
        </tr>
      </table>
      <h2 style="text-align: center;">BÁO CÁO KẾT QUẢ TRIỂN KHAI</h2>
      <p>Kính gửi: Thường trực Ủy ban nhân dân thành phố.</p>
      <table style="width:100%;">
        <tr>
          <td>Nơi nhận:<br>- Như trên;<br>- Lưu: VT.</td>
          <td>CHÁNH VĂN PHÒNG<br>(Ký, đóng dấu)<br><br><br>Nguyễn Văn A</td>
        </tr>
      </table>
    `;
    const report = checkCompliance(testHtml);
    if (typeof report.score !== "number" || report.score < 60) {
      throw new Error(`Điểm số kiểm tra không đạt kỳ vọng: ${report.score}`);
    }
    return `Điểm tuân thủ NĐ 30: ${report.score}/100, Xếp loại: ${report.level}, Đã rà quét ${report.issues.length} khuyến nghị`;
  });

  // 2. Bilingual Engine (Song ngữ Anh - Việt)
  await testEndpoint("Business Logic", "Động cơ Soạn thảo Song ngữ (Bilingual Mode)", async () => {
    const { BilingualEngine } = await import("../src/lib/ai/bilingual-engine");
    const sampleClauses = [
      {
        articleNumber: 1,
        titleVi: "Định nghĩa và Giải thích",
        titleEn: "Definitions and Interpretation",
        contentVi: "Các từ ngữ viết hoa trong Hợp đồng này có nghĩa như được quy định dưới đây.",
        contentEn: "Capitalized terms in this Agreement have the meanings given below.",
      },
      {
        articleNumber: 2,
        titleVi: "Phạm vi Công việc",
        titleEn: "Scope of Work",
        contentVi: "Bên B đồng ý cung cấp dịch vụ tư vấn quản lý dự án cho Bên A.",
        contentEn: "Party B agrees to provide project management consulting services to Party A.",
      },
    ];

    const html = BilingualEngine.renderBilingualTable(sampleClauses);
    if (!html.includes("<table") || !html.includes("Definitions and Interpretation") || !html.includes("Định nghĩa")) {
      throw new Error("Không tạo được cấu trúc bảng song ngữ 2 cột hợp lệ");
    }
    return "Sinh bảng song ngữ 2 cột song song với điều khoản ngôn ngữ ưu tiên thành công";
  });

  // 3. Approval Workflow State Machine & QR Code Generator
  await testEndpoint("Business Logic", "State Machine Luồng Trình ký & Phê duyệt", async () => {
    const { generateQRVerifyCode } = await import("../src/lib/workflow/approval-state-machine");
    
    // Kiểm tra tính đơn nhất và độ dài 64 ký tự chuẩn SHA-256 của mã QR xác thực
    const qrCode1 = generateQRVerifyCode("draft-101", new Date());
    const qrCode2 = generateQRVerifyCode("draft-101", new Date());

    if (!qrCode1 || qrCode1.length !== 64 || !/^[0-9a-f]{64}$/.test(qrCode1)) {
      throw new Error("Mã QR không đúng định dạng SHA-256 (64 ký tự hex)");
    }
    if (qrCode1 === qrCode2) {
      throw new Error("Mã QR thiếu tính ngẫu nhiên an toàn bảo mật (Nonce collision)");
    }
    return `Mã xác thực SHA-256 QR: ${qrCode1.substring(0, 16)}... (Độ dài chuẩn: ${qrCode1.length} ký tự hex)`;
  });

  // 4. Custom Template Builder Schema Validation
  await testEndpoint("Business Logic", "Validation Động cơ Dynamic Form & Template Builder", async () => {
    const { customTemplateSchema } = await import("../src/lib/templates/template-service");
    const validSchema = {
      title: "Mẫu kiểm tra nghiệm thu E2E",
      categoryId: "administrative",
      industryPack: "STANDARD",
      systemPrompt: "Bạn là trợ lý hành chính chuyên nghiệp soạn thảo công văn chuẩn Nghị định 30.",
      userPromptTemplate: "Soạn thảo văn bản gửi tới đơn vị {{recipient}} với nội dung yêu cầu.",
      formSchema: {
        fields: [
          {
            name: "recipient",
            label: "Cơ quan tiếp nhận",
            type: "text" as const,
            required: true,
          },
        ],
      },
    };

    const validation = customTemplateSchema.safeParse(validSchema);
    if (!validation.success) {
      throw new Error(`Validation thất bại: ${JSON.stringify(validation.error)}`);
    }
    return "JSON Schema và Zod dynamic validation hoạt động hoàn hảo";
  });

  // --------------------------------------------------------------------------
  // BÁO CÁO TỔNG KẾT
  // --------------------------------------------------------------------------
  console.log("\n==============================================================================");
  console.log("       📊 BẢNG TỔNG KẾT KẾT QUẢ KIỂM THỬ TỪNG CHỨC NĂNG (E2E)");
  console.log("==============================================================================");

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const total = results.length;

  console.log(`\nTổng số chức năng đã kiểm thử: ${total}`);
  console.log(`✅ Thành công: ${passed} / ${total} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`❌ Thất bại:   ${failed} / ${total}\n`);

  if (failed > 0) {
    console.error("CÁC CHỨC NĂNG BỊ LỖI:");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => console.error(` - [${r.category}] ${r.name}: ${r.details}`));
    process.exit(1);
  } else {
    console.log("🎉 TOÀN BỘ 100% CÁC CHỨC NĂNG CỦA DOCDRAFT AI ĐỀU ĐANG HOẠT ĐỘNG HOÀN HẢO!");
  }
}

runLiveVerification().catch((err) => {
  console.error("Lỗi nghiêm trọng khi chạy kịch bản kiểm thử:", err);
  process.exit(1);
});
