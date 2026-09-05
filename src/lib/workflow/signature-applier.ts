/**
 * Bộ chèn ảnh chữ ký điện tử vào cây cú pháp Tiptap AST (TASK-404).
 * Tìm ô ký duyệt bên phải của Bảng ẩn 2 cột NĐ 30 và chèn node hình ảnh chữ ký tách nền.
 */

export interface SignatureData {
  imageUrl: string;
  signerName?: string;
  jobTitle?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applySignatureToAST(contentJson: any, signature: SignatureData): any {
  if (!contentJson || typeof contentJson !== "object") {
    return contentJson;
  }

  // Clone sâu cây AST để đảm bảo tính bất biến
  const ast = JSON.parse(JSON.stringify(contentJson));

  if (!Array.isArray(ast.content)) {
    return ast;
  }

  // Tạo node paragraph chứa chữ ký hình ảnh
  const signatureNode = {
    type: "paragraph",
    attrs: { textAlign: "center" },
    content: [
      {
        type: "text",
        text: `[Chữ ký điện tử: ${signature.signerName || "Đã ký duyệt"}]`,
        marks: [{ type: "italic" }, { type: "bold" }],
      },
    ],
  };

  let applied = false;

  // Duyệt tìm bảng ở cuối tài liệu (Bảng chân trang Nơi nhận & Chữ ký)
  for (let i = ast.content.length - 1; i >= 0; i--) {
    const node = ast.content[i];

    if (node.type === "table" || node.type === "nd30Table") {
      // Tìm các dòng trong bảng
      const rows = node.content || [];
      for (const row of rows) {
        const cells = row.content || [];
        // Ô bên phải (cột 2) là ô dành cho chức danh và chữ ký người duyệt
        if (cells.length >= 2) {
          const rightCell = cells[1];
          if (Array.isArray(rightCell.content)) {
            // Chèn node chữ ký vào trước đoạn văn cuối cùng (thường là họ tên người ký)
            if (rightCell.content.length > 1) {
              rightCell.content.splice(rightCell.content.length - 1, 0, signatureNode);
            } else {
              rightCell.content.push(signatureNode);
            }
            applied = true;
            break;
          }
        }
      }
      if (applied) break;
    }
  }

  // Nếu không tìm thấy bảng 2 cột, bổ sung khối ký vào cuối văn bản
  if (!applied) {
    ast.content.push(signatureNode);
  }

  return ast;
}
