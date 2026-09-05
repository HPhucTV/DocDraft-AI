import { RawExtractionResult } from "./raw-to-doc-service";

export interface StreamRawToDocOptions {
  rawText: string;
  targetDocType?: string;
  preferredProvider?: "deepseek" | "gemini";
  signal?: AbortSignal;
  onFacts?: (facts: RawExtractionResult) => void;
  onThinking?: (token: string) => void;
  onToken?: (chunk: string) => void;
  onComplete?: (stats: {
    word_count: number;
    duration_ms: number;
    model_used: string;
  }) => void;
  onError?: (error: Error) => void;
}

/**
 * Client-side SSE consumer cho chức năng Chuẩn hóa Nháp thô sang Nghị định 30 (TASK-201).
 */
export async function streamRawToDocument(
  options: StreamRawToDocOptions
): Promise<void> {
  const {
    rawText,
    targetDocType = "Công văn",
    preferredProvider = "deepseek",
    signal,
    onFacts,
    onThinking,
    onToken,
    onComplete,
    onError,
  } = options;

  try {
    const response = await fetch("/api/ai/raw-to-doc/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rawText,
        targetDocType,
        preferredProvider,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    if (!response.body) {
      throw new Error("ReadableStream not supported by browser");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "message";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) {
          continue; // Bỏ qua ping heartbeat
        }

        if (trimmed.startsWith("event:")) {
          currentEvent = trimmed.replace("event:", "").trim();
          continue;
        }

        if (trimmed.startsWith("data:")) {
          const jsonStr = trimmed.replace("data:", "").trim();
          try {
            const data = JSON.parse(jsonStr);

            if (currentEvent === "facts") {
              onFacts?.(data as RawExtractionResult);
            } else if (currentEvent === "thinking") {
              onThinking?.(data.token);
            } else if (currentEvent === "content") {
              onToken?.(data.chunk);
            } else if (currentEvent === "done") {
              onComplete?.(data);
            } else if (currentEvent === "error") {
              throw new Error(data.error || "SSE Stream returned error event");
            }
          } catch (e) {
            console.error("Lỗi phân tích cú pháp SSE:", e, line);
          }
        }
      }
    }
  } catch (err: unknown) {
    if (signal?.aborted) return;
    const error = err instanceof Error ? err : new Error(String(err));
    onError?.(error);
  }
}
