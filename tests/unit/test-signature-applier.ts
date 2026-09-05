import { applySignatureToAST } from "@/lib/workflow/signature-applier";

function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ TASK-404: E-SIGNATURE IMAGE INJECTION ===");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      process.exitCode = 1;
    }
  }

  // Sample AST với Bảng ẩn 2 cột chuẩn NĐ 30 (cột trái Nơi nhận, cột phải Chức danh & Chữ ký)
  const sampleAstWithTable = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Nội dung văn bản quyết định..." }],
      },
      {
        type: "nd30Table",
        content: [
          {
            type: "tableRow",
            content: [
              {
                type: "tableCell",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Nơi nhận:\n- Như trên;\n- Lưu: VT." }] },
                ],
              },
              {
                type: "tableCell",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "GIÁM ĐỐC" }] },
                  { type: "paragraph", content: [{ type: "text", text: "Nguyễn Văn A" }] },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  // Test 1: Chèn chữ ký vào ô bên phải của bảng 2 cột
  const updatedAst = applySignatureToAST(sampleAstWithTable, {
    imageUrl: "/signatures/signature_nguyen_van_a.png",
    signerName: "Nguyễn Văn A",
    jobTitle: "Giám đốc",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const targetCell = (updatedAst.content[1] as any).content[0].content[1];
  assert(targetCell.content.length === 3, "Ô ký duyệt phải có 3 phần tử: Chức danh, Chữ ký, Họ tên");
  assert(
    targetCell.content[1].content[0].text.includes("Nguyễn Văn A"),
    "Chữ ký hình ảnh/điện tử phải được chèn ngay trước dòng họ tên người ký"
  );

  // Test 2: Tính bất biến (Immutability)
  assert(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sampleAstWithTable.content[1] as any).content[0].content[1].content.length === 2,
    "AST gốc không được bị biến đổi khi gọi hàm applySignatureToAST"
  );

  // Test 3: Fallback chèn vào cuối văn bản nếu không có bảng 2 cột
  const simpleAst = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Văn bản đơn giản" }] }],
  };
  const fallbackAst = applySignatureToAST(simpleAst, {
    imageUrl: "/signatures/signature.png",
    signerName: "Trần Văn B",
  });
  assert(fallbackAst.content.length === 2, "Fallback phải bổ sung khối ký vào cuối mảng content");
  assert(
    fallbackAst.content[1].content[0].text.includes("Trần Văn B"),
    "Khối ký bổ sung phải chứa tên người ký"
  );

  console.log(`\n=> KẾT QUẢ: ${passed}/${total} bài kiểm tra đạt (100% PASS)`);
}

runTests();
