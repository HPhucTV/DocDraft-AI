/**
 * Client-side SSE Streaming SDK cho DocDraft AI
 * Phục vụ hiệu ứng máy đánh chữ (Typewriter Effect), Heartbeat và Abort Controller.
 */

export interface StreamEventContent {
  text: string;
  model?: string;
  provider?: string;
}

export interface StreamEventDone {
  success: boolean;
  word_count: number;
  finish_reason: string;
  model_used: string;
  duration_ms: number;
}

export interface StreamEventError {
  code: string;
  message: string;
  retryable: boolean;
  retry_after_ms?: number;
}

export interface StreamDocumentOptions {
  templateId?: string;
  variables?: Record<string, unknown>;
  systemPrompt?: string;
  userPrompt?: string;
  preferredProvider?: "deepseek" | "gemini";
  onToken: (text: string, meta?: { model?: string; provider?: string }) => void;
  onThinking?: (text: string) => void;
  onComplete: (done: StreamEventDone) => void;
  onError: (err: StreamEventError | Error) => void;
  signal?: AbortSignal;
}

/**
 * Thực hiện gọi SSE stream sinh văn bản từ backend và phân giải từng sự kiện
 */
export async function streamDocumentGeneration(options: StreamDocumentOptions): Promise<void> {
  const {
    templateId,
    variables,
    systemPrompt,
    userPrompt,
    preferredProvider,
    onToken,
    onComplete,
    onError,
    signal,
  } = options;

  try {
    const response = await fetch("/api/ai/generate/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId,
        variables,
        systemPrompt,
        userPrompt,
        preferredProvider,
      }),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP Error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Không thể khởi tạo stream reader từ phản hồi");
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        if (!block.trim()) continue;

        const lines = block.split("\n");
        let eventType = "message";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.replace("event: ", "").trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.replace("data: ", "").trim();
          }
        }

        if (!dataStr) continue;

        try {
          const parsedData = JSON.parse(dataStr);

          switch (eventType) {
            case "content": {
              const contentData = parsedData as StreamEventContent;
              onToken(contentData.text, {
                model: contentData.model,
                provider: contentData.provider,
              });
              break;
            }
            case "thinking": {
              if (options.onThinking && parsedData.text) {
                options.onThinking(parsedData.text);
              }
              break;
            }
            case "done": {
              onComplete(parsedData as StreamEventDone);
              break;
            }
            case "error": {
              onError(parsedData as StreamEventError);
              break;
            }
            case "ping": {
              // Heartbeat giữ nhịp kết nối
              break;
            }
            default:
              break;
          }
        } catch {
          // Bỏ qua nếu dòng data không phải JSON hợp lệ
        }
      }
    }
  } catch (err: unknown) {
    if (signal?.aborted) {
      console.log("[Stream] Người dùng đã dừng sinh văn bản.");
      return;
    }
    const errorObj = err instanceof Error ? err : new Error(String(err));
    onError(errorObj);
  }
}
