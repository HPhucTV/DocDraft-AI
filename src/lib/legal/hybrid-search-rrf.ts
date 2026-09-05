import {
  generateLegalEmbedding,
  computeDeterministicVector,
  cosineSimilarity,
} from "./legal-embedding-pipeline";
import { CURATED_LEGAL_DOCUMENTS, type SeedLegalDoc } from "./legal-data";

export interface LegalSearchItem {
  id: string;
  docCode: string;
  title: string;
  docType?: string | null;
  issuingAuthority?: string | null;
  status: string;
  fullCitation: string;
  rrfScore?: number;
  semanticSimilarity?: number;
}

export const RRF_K_CONSTANT = 60; // Hằng số làm mượt RRF chuẩn học máy

/**
 * Thuật toán Hợp nhất xếp hạng nghịch đảo (Reciprocal Rank Fusion - RRF) (TASK-407, ARCH-004).
 * Kết hợp kết quả giữa Tìm kiếm từ khóa FTS và Tìm kiếm ngữ nghĩa Vector Cosine Similarity:
 * RRF_Score(d) = 1 / (60 + Rank_FTS) + 1 / (60 + Rank_Vector)
 */
export function calculateRRFScore(
  rankFTS: number | null,
  rankVector: number | null,
  k: number = RRF_K_CONSTANT
): number {
  let score = 0;
  if (rankFTS !== null && rankFTS >= 0) {
    score += 1 / (k + rankFTS + 1); // Rank 0-indexed
  }
  if (rankVector !== null && rankVector >= 0) {
    score += 1 / (k + rankVector + 1);
  }
  return score;
}

/**
 * Tìm kiếm lai Hybrid Search RRF trên tập căn cứ pháp lý:
 * 1. Khớp từ khóa FTS (Số hiệu, tên văn bản, trích yếu).
 * 2. Khớp ngữ nghĩa Vector 768 chiều (Cosine Similarity).
 * 3. Hợp nhất bằng thuật toán RRF và trả về top K tài liệu chuẩn xác nhất.
 */
export async function performHybridLegalSearch(
  query: string,
  options: {
    candidates?: SeedLegalDoc[];
    limit?: number;
    statusFilter?: "ACTIVE" | "ALL";
    apiKey?: string;
  } = {}
): Promise<LegalSearchItem[]> {
  const {
    candidates = CURATED_LEGAL_DOCUMENTS,
    limit = 8,
    statusFilter = "ACTIVE",
    apiKey,
  } = options;

  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) {
    return candidates.slice(0, limit).map((doc, idx) => ({
      id: `legal-${idx}`,
      docCode: doc.docCode,
      title: doc.title,
      docType: doc.docType,
      issuingAuthority: doc.issuingAuthority,
      status: doc.status,
      fullCitation: doc.fullCitation,
      rrfScore: 1.0,
    }));
  }

  // 1. Lọc theo trạng thái hiệu lực nếu cần
  const pool = statusFilter === "ACTIVE"
    ? candidates.filter((d) => d.status === "ACTIVE")
    : candidates;

  // 2. Kênh FTS (Keyword Search): Đánh giá mức độ khớp từ khóa
  const ftsScored = pool.map((doc) => {
    let keywordScore = 0;
    const docCodeLower = doc.docCode.toLowerCase();
    const titleLower = doc.title.toLowerCase();
    const citationLower = doc.fullCitation.toLowerCase();

    // Khớp chính xác số hiệu luật (Vd: "30/2020/NĐ-CP" hoặc "10/2021")
    if (docCodeLower.includes(cleanQuery)) {
      keywordScore += 100;
    }

    // Khớp từng từ khóa trong tiêu đề và nội dung
    const queryTokens = cleanQuery.split(/\s+/).filter((t) => t.length > 1);
    for (const token of queryTokens) {
      if (titleLower.includes(token)) keywordScore += 10;
      if (citationLower.includes(token)) keywordScore += 5;
    }

    return { doc, keywordScore };
  });

  // Sắp xếp rank FTS giảm dần theo điểm khớp từ khóa
  const ftsRanked = [...ftsScored]
    .sort((a, b) => b.keywordScore - a.keywordScore)
    .filter((item) => item.keywordScore > 0);

  const ftsRankMap = new Map<string, number>();
  ftsRanked.forEach((item, index) => {
    ftsRankMap.set(item.doc.docCode, index);
  });

  // 3. Kênh Vector Semantic Search: Tạo query embedding 768 chiều
  const queryVector = await generateLegalEmbedding(cleanQuery, apiKey);

  const vectorScored = pool.map((doc) => {
    // Vector hóa nội dung luật (tiêu đề + số hiệu + trích dẫn)
    const docText = `${doc.title} ${doc.docCode} ${doc.fullCitation}`;
    const docVector = computeDeterministicVector(docText, 768);
    const similarity = cosineSimilarity(queryVector, docVector);
    return { doc, similarity };
  });

  // Sắp xếp rank Vector giảm dần theo độ tương đồng Cosine
  const vectorRanked = [...vectorScored]
    .sort((a, b) => b.similarity - a.similarity);

  const vectorRankMap = new Map<string, { rank: number; similarity: number }>();
  vectorRanked.forEach((item, index) => {
    vectorRankMap.set(item.doc.docCode, { rank: index, similarity: item.similarity });
  });

  // 4. Hợp nhất bằng Reciprocal Rank Fusion (RRF)
  const rrfResults: LegalSearchItem[] = pool.map((doc, idx) => {
    const rankFts = ftsRankMap.has(doc.docCode) ? ftsRankMap.get(doc.docCode)! : null;
    const vecData = vectorRankMap.get(doc.docCode);
    const rankVec = vecData ? vecData.rank : null;
    const similarity = vecData ? vecData.similarity : 0;

    const rrfScore = calculateRRFScore(rankFts, rankVec, RRF_K_CONSTANT);

    return {
      id: `legal-rrf-${idx}`,
      docCode: doc.docCode,
      title: doc.title,
      docType: doc.docType,
      issuingAuthority: doc.issuingAuthority,
      status: doc.status,
      fullCitation: doc.fullCitation,
      rrfScore,
      semanticSimilarity: Math.round(similarity * 100) / 100,
    };
  });

  // Sắp xếp theo RRF Score giảm dần và cắt lấy top limit
  rrfResults.sort((a, b) => (b.rrfScore || 0) - (a.rrfScore || 0));

  return rrfResults.slice(0, limit);
}
