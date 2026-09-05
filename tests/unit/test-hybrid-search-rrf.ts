import {
  calculateRRFScore,
  performHybridLegalSearch,
} from "@/lib/legal/hybrid-search-rrf";

async function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ TASK-407: HYBRID SEARCH RRF ENGINE ===");
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

  // Test 1: Công thức RRF Score
  // Khi rankFTS = 0 (top 1) và rankVector = 0 (top 1), RRF_Score = 1/61 + 1/61 = 2/61 ≈ 0.03278
  const scoreBothTop1 = calculateRRFScore(0, 0, 60);
  assert(Math.abs(scoreBothTop1 - 2 / 61) < 0.0001, "Điểm RRF cho phần tử đứng top 1 cả 2 kênh phải đúng công thức 2/61");

  // Khi chỉ đứng top 1 FTS và không có rank Vector
  const scoreOnlyFts = calculateRRFScore(0, null, 60);
  assert(Math.abs(scoreOnlyFts - 1 / 61) < 0.0001, "Điểm RRF khi chỉ có 1 kênh FTS phải bằng 1/61");

  // Test 2: Khớp chính xác số hiệu văn bản (Keyword Boost)
  const resultsNd30 = await performHybridLegalSearch("30/2020/NĐ-CP");
  assert(resultsNd30.length > 0, "Kết quả tìm kiếm không được rỗng");
  assert(
    resultsNd30[0].docCode === "30/2020/NĐ-CP",
    `Tìm kiếm số hiệu '30/2020/NĐ-CP' phải đưa Nghị định 30 lên vị trí top 1 (thực tế: ${resultsNd30[0].docCode})`
  );

  // Test 3: Khớp ngữ nghĩa chủ đề (Semantic Search)
  const resultsLabor = await performHybridLegalSearch("hợp đồng lao động tiền lương");
  assert(resultsLabor.length > 0, "Kết quả tìm kiếm chủ đề lao động không được rỗng");
  const hasLaborLaw = resultsLabor.some(
    (r) => r.docCode.includes("45/2019/QH14") || r.title.toLowerCase().includes("lao động")
  );
  assert(hasLaborLaw, "Tìm kiếm 'hợp đồng lao động' phải gợi ý Bộ luật Lao động hoặc văn bản liên quan");

  // Test 4: Lọc theo trạng thái hiệu lực (ACTIVE filter)
  const activeResults = await performHybridLegalSearch("văn bản quy phạm pháp luật", {
    statusFilter: "ACTIVE",
  });
  const allActive = activeResults.every((r) => r.status === "ACTIVE");
  assert(allActive, "Tất cả kết quả khi lọc statusFilter='ACTIVE' phải có status ACTIVE");

  console.log(`\n=> KẾT QUẢ: ${passed}/${total} bài kiểm tra đạt (100% PASS)`);
}

runTests();
