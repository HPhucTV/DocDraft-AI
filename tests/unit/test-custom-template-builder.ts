import assert from "node:assert";
import {
  TemplateService,
  customTemplateSchema,
  formFieldSchema,
} from "../../src/lib/templates/template-service";
import { buildZodSchema } from "../../src/lib/dynamic-form-schema";

console.log("=== BẮT ĐẦU KIỂM THỬ TASK-408: CUSTOM TEMPLATE BUILDER ===");

// Test 1: Schema validation - Mẫu hợp lệ
const validTemplate = {
  id: "custom-quyet-dinh-khen-thuong",
  title: "Quyết định khen thưởng cá nhân có thành tích xuất sắc",
  description: "Mẫu quyết định khen thưởng nội bộ quý/năm",
  categoryId: "quyet-dinh",
  industryPack: "ADMIN",
  systemPrompt: "BẠN LÀ CHUYÊN GIA PHÁP CHẾ SOẠN THẢO QUYẾT ĐỊNH THEO NGHỊ ĐỊNH 30/2020/NĐ-CP...",
  userPromptTemplate: "Soạn thảo quyết định khen thưởng cho cá nhân {{ho_ten}} thuộc đơn vị {{don_vi}} với số tiền {{so_tien}}.",
  formSchema: {
    fields: [
      {
        name: "ho_ten",
        label: "Họ và tên cá nhân",
        type: "text" as const,
        required: true,
        placeholder: "Nguyễn Văn A",
      },
      {
        name: "don_vi",
        label: "Phòng ban / Đơn vị",
        type: "text" as const,
        required: true,
      },
      {
        name: "so_tien",
        label: "Số tiền thưởng (VNĐ)",
        type: "currency" as const,
        required: true,
      },
      {
        name: "hinh_thuc",
        label: "Hình thức khen thưởng",
        type: "select" as const,
        required: false,
        options: [
          { value: "giay_khen", label: "Giấy khen" },
          { value: "bang_khen", label: "Bằng khen" },
        ],
      },
    ],
  },
  isPublished: true,
};

const validationResult = TemplateService.validate(validTemplate);
assert.strictEqual(validationResult.success, true, "Mẫu hợp lệ phải pass validation");
console.log("  ✓ PASS: Dữ liệu cấu hình mẫu tùy chỉnh hợp lệ pass validation");

// Test 2: Bắt lỗi khi tên biến không đúng chuẩn slug
const invalidField = {
  name: "Tên Có Dấu Cách",
  label: "Nhãn trường",
  type: "text",
  required: false,
};
const fieldRes = formFieldSchema.safeParse(invalidField);
assert.strictEqual(fieldRes.success, false, "Tên biến có dấu cách phải bị từ chối");
console.log("  ✓ PASS: Tên biến không chuẩn (chứa khoảng trắng/ký tự đặc biệt) bị từ chối");

// Test 3: Bắt lỗi khi không có trường nào trong formSchema
const emptyFieldsTemplate = {
  ...validTemplate,
  formSchema: { fields: [] },
};
const emptyRes = customTemplateSchema.safeParse(emptyFieldsTemplate);
assert.strictEqual(emptyRes.success, false, "FormSchema không có trường nào phải bị từ chối");
console.log("  ✓ PASS: Mẫu không có trường nhập liệu bị từ chối");

// Test 4: Dynamic Form Schema tương thích với Zod engine
const zodSchema = buildZodSchema(validTemplate.formSchema);
const sampleFormData = {
  ho_ten: "Trần Thị B",
  don_vi: "Phòng Kế toán",
  so_tien: 5000000,
  hinh_thuc: "giay_khen",
};
const parsedData = zodSchema.safeParse(sampleFormData);
assert.strictEqual(parsedData.success, true, "Zod Schema sinh ra phải xác thực được form data hợp lệ");
console.log("  ✓ PASS: FormSchema của Template tương thích 100% với DynamicFormEngine");

// Test 5: Render User Prompt Template với biến số
const renderedPrompt = TemplateService.renderPromptWithVariables(
  validTemplate.userPromptTemplate,
  sampleFormData
);
assert.ok(renderedPrompt.includes("Trần Thị B"), "Prompt phải chứa Họ tên đã điền");
assert.ok(renderedPrompt.includes("Phòng Kế toán"), "Prompt phải chứa Đơn vị đã điền");
assert.ok(renderedPrompt.includes("5000000"), "Prompt phải chứa Số tiền đã điền");
console.log("  ✓ PASS: renderPromptWithVariables thay thế chính xác các biến {{variable}}");

// Test 6: Fallback an toàn chống ảo giác khi biến bị để trống
const incompleteFormData = {
  ho_ten: "Lê Văn C",
};
const renderedIncomplete = TemplateService.renderPromptWithVariables(
  validTemplate.userPromptTemplate,
  incompleteFormData
);
assert.ok(renderedIncomplete.includes("[DON_VI]"), "Biến thiếu phải chuyển thành placeholder an toàn [DON_VI]");
assert.ok(renderedIncomplete.includes("[SO_TIEN]"), "Biến thiếu phải chuyển thành placeholder an toàn [SO_TIEN]");
console.log("  ✓ PASS: Biến không được điền tự động chuyển thành [PLACEHOLDER] an toàn");

console.log("\n=> KẾT QUẢ: 6/6 bài kiểm tra đạt (100% PASS)\n");
