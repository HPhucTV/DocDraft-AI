import { computeTextDiff, mergeDiffChunks, updateChunkDecision, acceptAllChunks, rejectAllChunks } from "../../src/lib/diff/diff-engine";

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

console.log("--- BẮT ĐẦU KIỂM THỬ ĐỘNG CƠ DIFF ENGINE (TASK-202, TASK-203) ---");

const original = "Căn cứ Quyết định số 123/QĐ-UBND ngày 10/01/2026 của UBND tỉnh.";
const proposed = "Căn cứ Quyết định số 123/QĐ-UBND ngày 10/01/2026 của Ủy ban nhân dân tỉnh Bình Dương.";

const { chunks, summary } = computeTextDiff(original, proposed, "words");

console.log(`- Tổng số chunks: ${chunks.length}`);
console.log(`- Chunks thay đổi: ${summary.totalChunks}`);
console.log(`- Số từ thêm mới: ${summary.addedWords}`);
console.log(`- Số từ bị xóa: ${summary.removedWords}`);
console.log(`- Tỷ lệ đóng góp AI: ${summary.aiAttributionPercentage}%`);

assert(summary.totalChunks > 0, "Phải phát hiện được các mẩu thay đổi");
assert(summary.addedWords > 0, "Phải tính được số từ thêm mới");

// Kiểm thử Accept All
const allAccepted = acceptAllChunks(chunks);
const mergedAccepted = mergeDiffChunks(allAccepted);
console.log("Văn bản sau khi Chấp nhận tất cả:", mergedAccepted);
assert(mergedAccepted.includes("Ủy ban nhân dân tỉnh Bình Dương"), "Bản sau khi accept all phải chứa từ mới");
assert(!mergedAccepted.includes("UBND tỉnh."), "Bản sau khi accept all không còn đoạn bị xóa");

// Kiểm thử Reject All
const allRejected = rejectAllChunks(chunks);
const mergedRejected = mergeDiffChunks(allRejected);
console.log("Văn bản sau khi Bác bỏ tất cả:", mergedRejected);
assert(mergedRejected === original, "Bản sau khi reject all phải khớp 100% bản gốc ban đầu");

// Kiểm thử Chunk-by-chunk decision
const changedChunks = chunks.filter((c) => c.type !== "unchanged");
if (changedChunks.length >= 2) {
  let updated = updateChunkDecision(chunks, changedChunks[0].id, "accepted");
  updated = updateChunkDecision(updated, changedChunks[1].id, "rejected");
  const mergedPartial = mergeDiffChunks(updated);
  assert(mergedPartial.length > 0, "Văn bản duyệt từng chunk phải hợp nhất thành công");
}

console.log("=== TẤT CẢ KIỂM THỬ DIFF ENGINE ĐẠT 100% ===");
