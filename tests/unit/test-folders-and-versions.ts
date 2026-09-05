function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

console.log("--- BẮT ĐẦU KIỂM THỬ THƯ MỤC LỒNG NHAU & LỊCH SỬ PHIÊN BẢN (TASK-208, TASK-209) ---");

// 1. Kiểm thử cấu trúc thư mục lồng nhau (Tree Hierarchy)
interface TestFolder {
  id: string;
  name: string;
  parentFolderId: string | null;
  sortOrder: number;
}

const mockFolders: TestFolder[] = [
  { id: "f1", name: "Công văn đi 2026", parentFolderId: null, sortOrder: 1 },
  { id: "f2", name: "Quyết định nhân sự", parentFolderId: null, sortOrder: 2 },
  { id: "f3", name: "Quý 1/2026", parentFolderId: "f1", sortOrder: 1 },
  { id: "f4", name: "Tháng 01", parentFolderId: "f3", sortOrder: 1 },
];

function buildFolderTree(folders: TestFolder[], parentId: string | null = null): (TestFolder & { children: unknown[] })[] {
  return folders
    .filter((f) => f.parentFolderId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((f) => ({
      ...f,
      children: buildFolderTree(folders, f.id),
    }));
}

const tree = buildFolderTree(mockFolders);
console.log("- Số thư mục gốc:", tree.length);
assert(tree.length === 2, "Phải có đúng 2 thư mục gốc");
assert(tree[0].name === "Công văn đi 2026", "Thư mục đầu tiên phải là Công văn đi 2026");
assert(tree[0].children.length === 1, "f1 phải có 1 thư mục con f3");
const f3Children = (tree[0].children[0] as { children: unknown[] }).children;
assert(f3Children.length === 1, "f3 phải có 1 thư mục cháu f4 (lồng 3 cấp)");
console.log("✓ Cấu trúc thư mục lồng nhau nhiều cấp (Nested Tree) hoạt động chính xác");

// 2. Kiểm thử logic phân giải phiên bản & Rollback
interface TestVersion {
  versionNumber: number;
  contentJson: { text: string };
  editSource: string;
}

const versionHistory: TestVersion[] = [
  { versionNumber: 1, contentJson: { text: "Bản khởi tạo ban đầu" }, editSource: "AI_GENERATE" },
  { versionNumber: 2, contentJson: { text: "Người dùng sửa số liệu ngân sách" }, editSource: "USER_MANUAL" },
  { versionNumber: 3, contentJson: { text: "AI sửa lỗi thể thức NĐ 30" }, editSource: "AI_INLINE_EDIT" },
];

function rollbackToVersion(
  history: TestVersion[],
  targetVersionNumber: number
): { nextVersion: number; restoredContent: { text: string }; newHistoryItem: TestVersion } {
  const target = history.find((v) => v.versionNumber === targetVersionNumber);
  if (!target) throw new Error("Phiên bản đích không tồn tại");

  const nextVersion = history.length + 1;
  const newHistoryItem: TestVersion = {
    versionNumber: nextVersion,
    contentJson: { ...target.contentJson },
    editSource: "ROLLBACK",
  };

  return {
    nextVersion,
    restoredContent: newHistoryItem.contentJson,
    newHistoryItem,
  };
}

// Rollback về v1
const rollbackResult = rollbackToVersion(versionHistory, 1);
console.log(`- Sau khi rollback về v1, tạo phiên bản mới: v${rollbackResult.nextVersion}`);
assert(rollbackResult.nextVersion === 4, "Phiên bản mới phải là v4 để bảo toàn lịch sử");
assert(rollbackResult.restoredContent.text === "Bản khởi tạo ban đầu", "Nội dung khôi phục phải khớp với v1");
assert(rollbackResult.newHistoryItem.editSource === "ROLLBACK", "Nguồn gốc phải được đánh nhãn ROLLBACK");
console.log("✓ Logic 1-Click Rollback bảo toàn lịch sử phiên bản hoạt động chuẩn xác");

console.log("=== TẤT CẢ KIỂM THỬ TASK-208 VÀ TASK-209 ĐẠT 100% ===");
