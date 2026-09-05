import { diffWordsWithSpace, diffLines, Change } from "diff";

export interface DiffChunk {
  id: string;
  type: "added" | "removed" | "unchanged";
  value: string;
  status: "pending" | "accepted" | "rejected";
  startIndex: number;
  wordCount: number;
}

export interface DiffSummary {
  totalChunks: number;
  addedWords: number;
  removedWords: number;
  unchangedWords: number;
  aiAttributionPercentage: number;
}

/**
 * Tính toán mẩu khác biệt (Diff Chunks) giữa văn bản gốc và văn bản đề xuất bởi AI (TASK-202).
 */
export function computeTextDiff(
  originalText: string,
  proposedText: string,
  mode: "words" | "lines" = "words"
): { chunks: DiffChunk[]; summary: DiffSummary } {
  const changes: Change[] =
    mode === "words"
      ? diffWordsWithSpace(originalText, proposedText)
      : diffLines(originalText, proposedText);

  let currentIndex = 0;
  let addedWords = 0;
  let removedWords = 0;
  let unchangedWords = 0;

  const chunks: DiffChunk[] = changes.map((change, index) => {
    const rawWords = change.value.trim().split(/\s+/).filter(Boolean);
    const count = rawWords.length;

    let type: "added" | "removed" | "unchanged" = "unchanged";
    if (change.added) {
      type = "added";
      addedWords += count;
    } else if (change.removed) {
      type = "removed";
      removedWords += count;
    } else {
      unchangedWords += count;
    }

    const chunk: DiffChunk = {
      id: `chunk-${index}-${type}`,
      type,
      value: change.value,
      status: type === "unchanged" ? "accepted" : "pending",
      startIndex: currentIndex,
      wordCount: count,
    };

    currentIndex += change.value.length;
    return chunk;
  });

  const totalWords = unchangedWords + addedWords;
  const aiAttributionPercentage =
    totalWords > 0 ? Math.round((addedWords / totalWords) * 100) : 0;

  return {
    chunks,
    summary: {
      totalChunks: chunks.filter((c) => c.type !== "unchanged").length,
      addedWords,
      removedWords,
      unchangedWords,
      aiAttributionPercentage,
    },
  };
}

/**
 * Hợp nhất văn bản dựa trên quyết định duyệt của người dùng (TASK-203).
 * - "accepted":
 *   + Nếu là chunk "added": giữ lại nội dung đề xuất.
 *   + Nếu là chunk "removed": chấp nhận xóa (bỏ qua).
 *   + Nếu là chunk "unchanged": giữ lại.
 * - "rejected":
 *   + Nếu là chunk "added": bỏ qua nội dung đề xuất.
 *   + Nếu là chunk "removed": giữ lại nội dung gốc không xóa.
 * - "pending":
 *   + Mặc định tạm thời áp dụng đề xuất hoặc giữ nguyên tùy cờ defaultAccept.
 */
export function mergeDiffChunks(
  chunks: DiffChunk[],
  defaultAccept = true
): string {
  let result = "";

  for (const chunk of chunks) {
    const isAccepted =
      chunk.status === "accepted" ||
      (chunk.status === "pending" && defaultAccept);

    if (chunk.type === "unchanged") {
      result += chunk.value;
    } else if (chunk.type === "added") {
      if (isAccepted) {
        result += chunk.value;
      }
    } else if (chunk.type === "removed") {
      if (!isAccepted) {
        // Bác bỏ việc xóa -> giữ lại đoạn cũ
        result += chunk.value;
      }
    }
  }

  return result;
}

/**
 * Cập nhật quyết định cho 1 chunk cụ thể.
 */
export function updateChunkDecision(
  chunks: DiffChunk[],
  chunkId: string,
  decision: "accepted" | "rejected"
): DiffChunk[] {
  return chunks.map((c) => (c.id === chunkId ? { ...c, status: decision } : c));
}

/**
 * Chấp nhận toàn bộ các đoạn đề xuất.
 */
export function acceptAllChunks(chunks: DiffChunk[]): DiffChunk[] {
  return chunks.map((c) => ({
    ...c,
    status: "accepted",
  }));
}

/**
 * Bác bỏ toàn bộ các đoạn đề xuất (quay về bản gốc).
 */
export function rejectAllChunks(chunks: DiffChunk[]): DiffChunk[] {
  return chunks.map((c) => ({
    ...c,
    status: c.type === "unchanged" ? "accepted" : "rejected",
  }));
}
