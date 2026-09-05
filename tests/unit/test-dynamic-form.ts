import { buildZodSchema, parseCurrencyVND, formatCurrencyVND } from "../../src/lib/dynamic-form-schema";
import type { FormSchema } from "../../src/types/form-schema";

const sampleSchema: FormSchema = {
  fields: [
    {
      name: "ten_co_quan",
      label: "Tên cơ quan",
      type: "text",
      required: true,
      validation: { min_length: 3, max_length: 100 },
    },
    {
      name: "kinh_phi_du_toan",
      label: "Kinh phí dự toán",
      type: "currency",
      required: true,
    },
    {
      name: "loai_kinh_phi",
      label: "Nguồn kinh phí",
      type: "select",
      required: true,
      options: [
        { value: "ngan_sach", label: "Ngân sách nhà nước" },
        { value: "xa_hoi_hoa", label: "Xã hội hóa" },
      ],
    },
    {
      name: "ngay_thuc_hien",
      label: "Ngày thực hiện",
      type: "date",
      required: true,
    },
  ],
};

function runTests() {
  console.log("--- Testing parseCurrencyVND and formatCurrencyVND ---");
  const formatted = formatCurrencyVND(150000000);
  console.log("Format 150000000:", formatted);
  if (!formatted.includes("150") || !formatted.includes("000")) {
    throw new Error("Failed to format currency correctly");
  }

  const parsed = parseCurrencyVND("150.000.000 đ");
  console.log("Parse '150.000.000 đ':", parsed);
  if (parsed !== 150000000) {
    throw new Error(`Expected 150000000, got ${parsed}`);
  }

  console.log("--- Testing Dynamic Zod Schema Validation ---");
  const zodSchema = buildZodSchema(sampleSchema);

  // 1. Test empty form submission
  const emptyResult = zodSchema.safeParse({});
  if (emptyResult.success) {
    throw new Error("Empty form should fail validation!");
  }
  const emptyErrors = emptyResult.error.flatten().fieldErrors;
  console.log("Empty form errors:", emptyErrors);
  if (!emptyErrors.ten_co_quan || !emptyErrors.kinh_phi_du_toan || !emptyErrors.loai_kinh_phi) {
    throw new Error("Missing expected field errors on empty submission");
  }

  // 2. Test valid form submission
  const validData = {
    ten_co_quan: "Ủy Ban Nhân Dân Quận 1",
    kinh_phi_du_toan: "250.000.000",
    loai_kinh_phi: "ngan_sach",
    ngay_thuc_hien: "2026-09-10",
  };
  const validResult = zodSchema.safeParse(validData);
  if (!validResult.success) {
    throw new Error(`Valid form failed validation: ${JSON.stringify(validResult.error.flatten())}`);
  }
  console.log("Valid form parsed successfully. Parsed data:", validResult.data);
  if (validResult.data.kinh_phi_du_toan !== 250000000) {
    throw new Error(`Expected currency parsed to 250000000, got ${validResult.data.kinh_phi_du_toan}`);
  }

  // 3. Test text too short validation
  const shortResult = zodSchema.safeParse({
    ...validData,
    ten_co_quan: "UB",
  });
  if (shortResult.success) {
    throw new Error("Short text should have failed min_length validation!");
  }
  console.log("Short text error caught:", shortResult.error.flatten().fieldErrors.ten_co_quan);

  console.log("\n✅ ALL DYNAMIC FORM ENGINE UNIT TESTS PASSED SUCCESSFULLY!\n");
}

runTests();
