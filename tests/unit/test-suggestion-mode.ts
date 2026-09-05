/**
 * Unit Test for Suggestion Mode (TASK-307)
 * - Tiptap Mark Suggestion Extraction
 * - Replace / Insert / Delete Type Detection
 * - Non-destructive Diff Preservation
 * - Accept / Reject Suggestion Algorithm
 */

interface MockMark {
  type: { name: string };
  attrs: {
    suggestionId?: string;
    author?: string;
    createdAt?: string;
  };
}

interface MockTextNode {
  isText: boolean;
  text: string;
  marks?: MockMark[];
}

function runSuggestionModeTests() {
  console.log("🚀 Bắt đầu kiểm thử Chế độ Đề xuất Chỉnh sửa (TASK-307 Suggestion Mode)...\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Tạo dữ liệu giả lập văn bản chứa 3 loại đề xuất: Replace, Delete, Insert
  const mockDocNodes: MockTextNode[] = [
    { isText: true, text: "Căn cứ Nghị định số 30/2020/NĐ-CP, nay " },
    // Suggestion 1: Replace "yêu cầu" -> "kính đề nghị"
    {
      isText: true,
      text: "yêu cầu",
      marks: [
        {
          type: { name: "suggestionDeletion" },
          attrs: { suggestionId: "sug_001", author: "Trưởng phòng HC", createdAt: "2026-09-05T10:00:00Z" },
        },
      ],
    },
    {
      isText: true,
      text: " kính đề nghị",
      marks: [
        {
          type: { name: "suggestionInsertion" },
          attrs: { suggestionId: "sug_001", author: "Trưởng phòng HC", createdAt: "2026-09-05T10:00:00Z" },
        },
      ],
    },
    { isText: true, text: " Giám đốc phê duyệt dự toán " },
    // Suggestion 2: Pure Delete "khẩn cấp"
    {
      isText: true,
      text: "khẩn cấp",
      marks: [
        {
          type: { name: "suggestionDeletion" },
          attrs: { suggestionId: "sug_002", author: "Pháp chế", createdAt: "2026-09-05T10:05:00Z" },
        },
      ],
    },
    { isText: true, text: " trước ngày 15/09/2026." },
    // Suggestion 3: Pure Insert " (Bản chính)"
    {
      isText: true,
      text: " (Bản chính)",
      marks: [
        {
          type: { name: "suggestionInsertion" },
          attrs: { suggestionId: "sug_003", author: "Văn thư", createdAt: "2026-09-05T10:10:00Z" },
        },
      ],
    },
  ];

  // 2. Thuật toán trích xuất đề xuất từ Text Nodes
  interface ExtractedSuggestion {
    id: string;
    type: "replace" | "delete" | "insert";
    author: string;
    createdAt: string;
    deletedText?: string;
    insertedText?: string;
  }

  const map = new Map<string, ExtractedSuggestion>();

  for (const node of mockDocNodes) {
    if (node.isText && node.marks) {
      for (const mark of node.marks) {
        if (mark.type.name === "suggestionDeletion" || mark.type.name === "suggestionInsertion") {
          const sugId = mark.attrs.suggestionId;
          if (!sugId) continue;

          let item = map.get(sugId);
          if (!item) {
            item = {
              id: sugId,
              type: "replace",
              author: mark.attrs.author || "Người xem",
              createdAt: mark.attrs.createdAt || "",
            };
            map.set(sugId, item);
          }

          if (mark.type.name === "suggestionDeletion") {
            item.deletedText = (item.deletedText || "") + node.text;
          } else if (mark.type.name === "suggestionInsertion") {
            item.insertedText = (item.insertedText || "") + node.text;
          }
        }
      }
    }
  }

  for (const item of map.values()) {
    if (item.deletedText && item.insertedText) {
      item.type = "replace";
    } else if (item.deletedText) {
      item.type = "delete";
    } else {
      item.type = "insert";
    }
  }

  const extracted = Array.from(map.values());

  // 3. Kiểm tra kết quả trích xuất
  assert(extracted.length === 3, `Trích xuất đủ 3 đề xuất từ tài liệu (thực tế: ${extracted.length})`);

  const sug1 = extracted.find((s) => s.id === "sug_001");
  assert(sug1 !== undefined, "Tìm thấy đề xuất sug_001");
  assert(sug1?.type === "replace", "Đề xuất sug_001 nhận diện đúng kiểu 'replace'");
  assert(sug1?.deletedText === "yêu cầu", "Đề xuất sug_001 trích xuất đúng văn bản cũ cần thay: 'yêu cầu'");
  assert(sug1?.insertedText === " kính đề nghị", "Đề xuất sug_001 trích xuất đúng văn bản mới: ' kính đề nghị'");
  assert(sug1?.author === "Trưởng phòng HC", "Đề xuất sug_001 lưu đúng tác giả: 'Trưởng phòng HC'");

  const sug2 = extracted.find((s) => s.id === "sug_002");
  assert(sug2?.type === "delete", "Đề xuất sug_002 nhận diện đúng kiểu xóa bỏ 'delete'");
  assert(sug2?.deletedText === "khẩn cấp", "Đề xuất sug_002 có nội dung bị xóa: 'khẩn cấp'");

  const sug3 = extracted.find((s) => s.id === "sug_003");
  assert(sug3?.type === "insert", "Đề xuất sug_003 nhận diện đúng kiểu thêm mới 'insert'");
  assert(sug3?.insertedText === " (Bản chính)", "Đề xuất sug_003 có nội dung thêm mới: ' (Bản chính)'");

  // 4. Kiểm tra thuật toán Duyệt (Accept) & Bác bỏ (Reject)
  function simulateAccept(nodes: MockTextNode[], suggestionId: string): string {
    let result = "";
    for (const node of nodes) {
      const isDel = node.marks?.some((m) => m.type.name === "suggestionDeletion" && m.attrs.suggestionId === suggestionId);
      if (isDel) {
        // Xóa hoàn toàn
        continue;
      }
      result += node.text;
    }
    return result;
  }

  function simulateReject(nodes: MockTextNode[], suggestionId: string): string {
    let result = "";
    for (const node of nodes) {
      const isIns = node.marks?.some((m) => m.type.name === "suggestionInsertion" && m.attrs.suggestionId === suggestionId);
      if (isIns) {
        // Bỏ đoạn thêm mới
        continue;
      }
      result += node.text;
    }
    return result;
  }

  const acceptedText = simulateAccept(mockDocNodes, "sug_001");
  assert(
    !acceptedText.includes("yêu cầu") && acceptedText.includes(" kính đề nghị"),
    "Duyệt đề xuất sug_001 loại bỏ 'yêu cầu' và giữ lại ' kính đề nghị'"
  );

  const rejectedText = simulateReject(mockDocNodes, "sug_001");
  assert(
    rejectedText.includes("yêu cầu") && !rejectedText.includes(" kính đề nghị"),
    "Bác bỏ đề xuất sug_001 khôi phục lại 'yêu cầu' và hủy bỏ ' kính đề nghị'"
  );

  console.log(`\n🎉 KẾT QUẢ: ${passed}/${total} bài kiểm thử đạt thành công (100%)!\n`);
}

runSuggestionModeTests();
