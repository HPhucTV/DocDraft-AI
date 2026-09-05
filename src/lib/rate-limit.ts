import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptApiKey, UserCustomApiKeys } from "@/lib/encryption";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  isByok: boolean;
}

// Bộ đệm trong bộ nhớ (In-Memory Sliding Window) dùng làm Fallback khi chưa cấu hình Upstash Redis
const memoryStore = new Map<string, number[]>();

function inMemorySlidingWindow(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (memoryStore.get(key) || []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    const reset = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.max(reset, 1),
    };
  }

  timestamps.push(now);
  memoryStore.set(key, timestamps);

  return {
    success: true,
    limit,
    remaining: limit - timestamps.length,
    reset: Math.ceil(windowMs / 1000),
  };
}

// Khởi tạo Upstash Ratelimit nếu có cấu hình
let upstashAiRatelimit: Ratelimit | null = null;
let upstashApiRatelimit: Ratelimit | null = null;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (
  redisUrl &&
  redisToken &&
  !redisUrl.includes("xxx.upstash.io") &&
  !redisToken.includes("your-")
) {
  try {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    upstashAiRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      analytics: true,
      prefix: "@docdraft/ratelimit/ai",
    });

    upstashApiRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "@docdraft/ratelimit/api",
    });
  } catch (err) {
    console.warn("Không thể kết nối Upstash Redis, kích hoạt in-memory sliding window:", err);
  }
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Kiểm tra xem người dùng có cấu hình khóa API riêng (BYOK) hay không.
 * Nếu đã cấu hình BYOK, người dùng được MIỄN PHÍ KHÔNG GIỚI HẠN (Bypass Rate Limit).
 */
export async function checkUserHasByok(userId?: string | null): Promise<boolean> {
  if (!userId || !UUID_REGEX.test(userId)) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { customApiKeys: true },
    });

    if (!user?.customApiKeys) return false;

    const keys = user.customApiKeys as unknown as UserCustomApiKeys;
    const deepseekPayload = keys["deepseek"];
    const geminiPayload = keys["gemini"];

    if (deepseekPayload?.ciphertext && deepseekPayload?.iv && deepseekPayload?.auth_tag) {
      const key = decryptApiKey(deepseekPayload);
      if (key && key.trim().length > 0) return true;
    }

    if (geminiPayload?.ciphertext && geminiPayload?.iv && geminiPayload?.auth_tag) {
      const key = decryptApiKey(geminiPayload);
      if (key && key.trim().length > 0) return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Kiểm tra Rate Limit cho các tác vụ gọi AI (Tạo nháp, Raw-to-Doc, Inline Edit, AI Chat)
 * - BYOK Users: Không giới hạn (Bypass).
 * - Free Users: Giới hạn 20 request / 1 giờ (Sliding Window - ADR-009).
 */
export async function checkAiRateLimit(userId: string): Promise<RateLimitResult> {
  // 1. Kiểm tra BYOK
  const hasByok = await checkUserHasByok(userId);
  if (hasByok) {
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: 0,
      isByok: true,
    };
  }

  const identifier = `ai:${userId}`;

  // 2. Upstash Redis
  if (upstashAiRatelimit) {
    try {
      const res = await upstashAiRatelimit.limit(identifier);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: Math.ceil((res.reset - Date.now()) / 1000),
        isByok: false,
      };
    } catch (err) {
      console.warn("Lỗi kiểm tra rate limit trên Upstash, fallback sang in-memory:", err);
    }
  }

  // 3. In-memory Fallback (20 request / 1 hour = 3600000 ms)
  const memResult = inMemorySlidingWindow(identifier, 20, 3600000);
  return {
    ...memResult,
    isByok: false,
  };
}

/**
 * Kiểm tra Rate Limit chung cho API hệ thống (100 request / 1 phút)
 */
export async function checkGeneralApiRateLimit(identifier: string): Promise<RateLimitResult> {
  if (upstashApiRatelimit) {
    try {
      const res = await upstashApiRatelimit.limit(`api:${identifier}`);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: Math.ceil((res.reset - Date.now()) / 1000),
        isByok: false,
      };
    } catch {
      // fallback
    }
  }

  const memResult = inMemorySlidingWindow(`api:${identifier}`, 100, 60000);
  return {
    ...memResult,
    isByok: false,
  };
}

/**
 * Trả về HTTP 429 Too Many Requests kèm chỉ dẫn BYOK
 */
export function createRateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const resetMinutes = Math.ceil(result.reset / 60);

  return NextResponse.json(
    {
      error: `Bạn đã vượt quá giới hạn ${result.limit} lượt yêu cầu AI/giờ cho gói dùng thử miễn phí. Vui lòng thử lại sau ${resetMinutes} phút hoặc cấu hình khóa API cá nhân (BYOK) trong Cài đặt để sử dụng không giới hạn.`,
      code: "RATE_LIMIT_EXCEEDED",
      limit: result.limit,
      remaining: result.remaining,
      resetSeconds: result.reset,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
        "Retry-After": result.reset.toString(),
      },
    }
  );
}
