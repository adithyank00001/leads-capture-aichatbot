import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { ApiValidationError } from "@/lib/validation/errors";

function isRateLimitBypassed() {
  return process.env.SMOKE_TEST_BYPASS_RATE_LIMIT === "true";
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

function createLimiter(tokens: number, window: `${number} m` | `${number} d`) {
  const redis = getRedis();

  if (!redis) {
    return null;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: "chatbot-mvp",
  });
}

const chatSessionLimiter = createLimiter(10, "1 m");
const chatIpLimiter = createLimiter(30, "1 m");
const chatBotDailyLimiter = createLimiter(200, "1 d");
const leadIpLimiter = createLimiter(20, "1 m");
const leadBotDailyLimiter = createLimiter(50, "1 d");

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

async function assertLimit(limiter: Ratelimit | null, key: string) {
  if (!limiter || isRateLimitBypassed()) {
    return;
  }

  const result = await limiter.limit(key);

  if (!result.success) {
    throw new ApiValidationError(
      "RATE_LIMITED",
      "Too many requests. Please wait a moment and try again.",
      429,
    );
  }
}

export async function assertChatRateLimits(
  request: Request,
  botId: string,
  sessionId: string,
) {
  const ip = getClientIp(request);

  await assertLimit(chatSessionLimiter, `chat:session:${sessionId}`);
  await assertLimit(chatIpLimiter, `chat:ip:${ip}`);
  await assertLimit(chatBotDailyLimiter, `chat:bot:${botId}`);
}

export async function assertLeadRateLimits(request: Request, botId: string) {
  const ip = getClientIp(request);

  await assertLimit(leadIpLimiter, `lead:ip:${ip}`);
  await assertLimit(leadBotDailyLimiter, `lead:bot:${botId}`);
}
