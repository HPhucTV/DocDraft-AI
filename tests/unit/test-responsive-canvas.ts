import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=== BẮT ĐẦU KIỂM THỬ TASK-412: RESPONSIVE CANVAS & TOUCH OPTIMIZATION ===");

// 1. Kiểm tra cấu hình CSS trong globals.css
const globalsCssPath = path.join(process.cwd(), "src/app/globals.css");
const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

assert.ok(
  globalsCss.includes(".touch-scroll-x"),
  "globals.css phải chứa class .touch-scroll-x cho thanh công cụ cuộn ngang cảm ứng"
);
console.log("  ✓ PASS: Lớp .touch-scroll-x đã được cấu hình trong globals.css");

assert.ok(
  globalsCss.includes(".a4-paper-canvas"),
  "globals.css phải chứa class .a4-paper-canvas cho trang A4 co giãn"
);
console.log("  ✓ PASS: Lớp .a4-paper-canvas đã được cấu hình trong globals.css");

assert.ok(
  globalsCss.includes("@media (max-width: 1023px)"),
  "globals.css phải có media query cho tablet/mobile breakpoint < 1024px"
);
assert.ok(
  globalsCss.includes("width: 100% !important"),
  "Trên màn hình nhỏ, tờ giấy A4 phải co giãn 100% chiều rộng để tránh tràn thanh cuộn ngang"
);
console.log("  ✓ PASS: Media query co giãn 100% bề ngang trên tablet/mobile hoạt động chính xác");

// 2. Kiểm tra EditorToolbar có hỗ trợ touch-scroll-x
const toolbarPath = path.join(process.cwd(), "src/components/editor/editor-toolbar.tsx");
const toolbarContent = fs.readFileSync(toolbarPath, "utf-8");

assert.ok(
  toolbarContent.includes("touch-scroll-x"),
  "EditorToolbar phải sử dụng lớp touch-scroll-x"
);
assert.ok(
  toolbarContent.includes("touch-manipulation"),
  "EditorToolbar phải áp dụng touch-manipulation để loại bỏ 300ms delay trên mobile"
);
console.log("  ✓ PASS: EditorToolbar trang bị đầy đủ cơ chế touch-scroll-x và touch-manipulation");

// 3. Kiểm tra TiptapEditor sử dụng a4-paper-canvas
const editorPath = path.join(process.cwd(), "src/components/editor/tiptap-editor.tsx");
const editorContent = fs.readFileSync(editorPath, "utf-8");

assert.ok(
  editorContent.includes("a4-paper-canvas"),
  "TiptapEditor phải gắn class a4-paper-canvas vào khung tờ giấy"
);
console.log("  ✓ PASS: TiptapEditor được đồng bộ hóa với lớp a4-paper-canvas");

// 4. Kiểm tra trang EditorPage có Segmented View Switcher trên mobile
const editorPagePath = path.join(process.cwd(), "src/app/editor/page.tsx");
const editorPageContent = fs.readFileSync(editorPagePath, "utf-8");

assert.ok(
  editorPageContent.includes("mobileActiveView"),
  "EditorPage phải quản lý state mobileActiveView (sidebar/canvas)"
);
assert.ok(
  editorPageContent.includes("Trang soạn thảo A4"),
  "EditorPage phải có nút chuyển nhanh sang Canvas A4 trên di động"
);
console.log("  ✓ PASS: EditorPage hỗ trợ Segmented View Switcher 1-tap cho màn hình cảm ứng");

console.log("\n=> KẾT QUẢ: 4/4 bài kiểm tra đạt (100% PASS)\n");
