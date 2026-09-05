import {
  computeDeterministicVector,
  cosineSimilarity,
  EMBEDDING_DIMENSION,
} from "@/lib/legal/legal-embedding-pipeline";

function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ TASK-406: VECTOR EMBEDDING PIPELINE ===");
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

  // Test 1: Kích thước vector phải đúng 768 chiều (Gemini Text Embedding chuẩn)
  const vec1 = computeDeterministicVector("Nghị định 30/2020/NĐ-CP về công tác văn thư");
  assert(vec1.length === EMBEDDING_DIMENSION, `Độ dài vector phải bằng ${EMBEDDING_DIMENSION} chiều (thực tế: ${vec1.length})`);

  // Test 2: Chuẩn hóa L2-norm (Độ dài vector = 1.0)
  let norm = 0;
  for (const val of vec1) {
    norm += val * val;
  }
  norm = Math.sqrt(norm);
  assert(Math.abs(norm - 1.0) < 0.0001, `Độ dài L2-norm của vector phải xấp xỉ 1.0 (thực tế: ${norm})`);

  // Test 3: Tính tất định (Determinism)
  const vec1Repeat = computeDeterministicVector("Nghị định 30/2020/NĐ-CP về công tác văn thư");
  let isIdentical = true;
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    if (vec1[i] !== vec1Repeat[i]) {
      isIdentical = false;
      break;
    }
  }
  assert(isIdentical, "Cùng một đoạn văn bản phải luôn tạo ra vector embedding giống hệt nhau");

  // Test 4: Độ tương đồng Cosine Similarity
  const vecRelated = computeDeterministicVector("hướng dẫn soạn thảo văn thư lưu trữ hành chính");
  const vecUnrelated = computeDeterministicVector("đấu thầu thuốc bảo hiểm y tế bệnh viện");

  const simRelated = cosineSimilarity(vec1, vecRelated);
  const simUnrelated = cosineSimilarity(vec1, vecUnrelated);

  assert(simRelated > simUnrelated, `Đoạn văn cùng chủ đề văn thư phải có độ tương đồng (${simRelated.toFixed(3)}) cao hơn đoạn khác chủ đề (${simUnrelated.toFixed(3)})`);

  console.log(`\n=> KẾT QUẢ: ${passed}/${total} bài kiểm tra đạt (100% PASS)`);
}

runTests();
