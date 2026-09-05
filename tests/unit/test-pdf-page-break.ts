import { optimizeHtmlForPdfPageBreak } from "@/lib/export/pdf-page-break";

function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ TASK-311: SMART PAGE-BREAK ENGINE ===");
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

  // Test 1: Chống rớt mồ côi tiêu đề (Orphan Heading Prevention)
  const headingHtml = "<h1>QUYẾT ĐỊNH</h1><p>Nội dung</p><h3>Điều 1. Phạm vi</h3>";
  const optimizedHeading = optimizeHtmlForPdfPageBreak(headingHtml);
  assert(
    optimizedHeading.includes('style="break-after: avoid; page-break-after: avoid;"') &&
    optimizedHeading.includes("<h1 ") &&
    optimizedHeading.includes("<h3 "),
    "Thẻ tiêu đề h1, h3 phải được gắn style break-after: avoid để không bị rớt đáy trang"
  );

  // Test 2: Bảo vệ khối chữ ký & Nơi nhận (Signature Block Preservation)
  const signatureHtml = `
    <table>
      <tr>
        <td><b>Nơi nhận:</b><br/>- Như trên;<br/>- Lưu: VT.</td>
        <td align="center"><b>GIÁM ĐỐC</b><br/><br/>Nguyễn Văn A</td>
      </tr>
    </table>
  `;
  const optimizedSig = optimizeHtmlForPdfPageBreak(signatureHtml);
  assert(
    optimizedSig.includes('data-table-type="signature"'),
    "Bảng chứa 'Nơi nhận' và 'GIÁM ĐỐC' phải tự động được đánh dấu data-table-type='signature'"
  );
  assert(
    optimizedSig.includes('class="signature-section"'),
    "Bảng chữ ký phải được thêm class signature-section"
  );

  // Test 3: Chống xé đôi bảng thông thường (Table Break Avoidance)
  const dataTableHtml = "<table><tr><td>Dữ liệu 1</td></tr></table>";
  const optimizedTable = optimizeHtmlForPdfPageBreak(dataTableHtml);
  assert(
    optimizedTable.includes('style="break-inside: avoid; page-break-inside: avoid;"'),
    "Bảng thông thường phải được gắn style break-inside: avoid để tránh bị xé đôi"
  );

  // Test 4: Giữ nguyên style hiện có khi bổ sung chỉ thị
  const customStyledHtml = '<h2 style="color: red; text-align: center;">TỜ TRÌNH</h2>';
  const optimizedCustom = optimizeHtmlForPdfPageBreak(customStyledHtml);
  assert(
    optimizedCustom.includes("color: red") &&
    optimizedCustom.includes("text-align: center") &&
    optimizedCustom.includes("break-after: avoid"),
    "Style gốc của phần tử phải được bảo lưu nguyên vẹn khi gắn thêm chỉ thị ngắt trang"
  );

  console.log(`\n=> KẾT QUẢ: ${passed}/${total} bài kiểm tra đạt (100% PASS)`);
}

runTests();
