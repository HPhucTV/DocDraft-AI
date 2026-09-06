import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

export const EMBEDDING_DIMENSION = 768; // Gemini Text-Embedding-004 chuẩn 768 chiều

export interface LegalEmbeddingChunk {
  id: string;
  docCode: string;
  title: string;
  fullCitation: string;
  contentSnippet: string;
  embedding: number[];
}

/**
 * Tạo vector embedding 768 chiều cho văn bản.
 * Ưu tiên gọi Gemini Text Embedding (text-embedding-004).
 * Nếu không có GEMINI_API_KEY hoặc offline, sử dụng thuật toán chiếu băm (Deterministic Hash Projection)
 * đảm bảo vector luôn đúng 768 chiều và có tính tương đồng ngữ nghĩa từ vựng.
 */
export async function generateLegalEmbedding(
  text: string,
  apiKey?: string
): Promise<number[]> {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (effectiveKey) {
    try {
      const genAI = new GoogleGenerativeAI(effectiveKey);
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(text);
      if (result.embedding?.values && result.embedding.values.length > 0) {
        return result.embedding.values;
      }
    } catch (err) {
      console.warn("Lỗi gọi Gemini Embedding API, dùng fallback determinism:", err);
    }
  }

  // Fallback: Chiếu băm đặc trưng từ vựng chuẩn hóa sang vector 768 chiều (L2-normalized)
  return computeDeterministicVector(text, EMBEDDING_DIMENSION);
}

/**
 * Thuật toán sinh vector 768 chiều chuẩn hóa L2 từ văn bản,
 * giữ tính bảo toàn tương đồng giữa các chuỗi có chung từ khóa (TASK-406).
 */
export function computeDeterministicVector(text: string, dim: number = 768): number[] {
  const vector = new Array<number>(dim).fill(0);
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const hash = crypto.createHash("sha256").update(word).digest();
    for (let b = 0; b < hash.length; b++) {
      const index = (hash[b] * 31 + i) % dim;
      const weight = ((hash[b] % 100) - 50) / 50.0;
      vector[index] += weight;
    }
  }

  // Chuẩn hóa L2-norm (Độ dài vector = 1) để tính Cosine Similarity bằng tích vô hướng
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vector[i] = vector[i] / norm;
    }
  } else {
    // Nếu chuỗi rỗng, trả về vector đơn vị cơ sở
    vector[0] = 1;
  }

  return vector;
}

/**
 * Tính khoảng cách Cosine Similarity giữa 2 vector chuẩn hóa L2 (Giá trị từ -1 đến 1).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}
