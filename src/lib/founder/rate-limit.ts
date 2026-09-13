import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { getClientIp } from "@/lib/rate-limit";
import { ApiValidationError } from "@/lib/validation/errors";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    return null;
  }
  return new Redis({ url, token });
}

const founderLoginLimiter = (() => {
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(8, "15 m"),
    prefix: "chatbot-mvp-founder-login",
  });
})();

export async function assertFounderLoginRateLimit(request: Request) {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.SMOKE_TEST_BYPASS_RATE_LIMIT === "true"
  ) {
    return;
  }

  if (!founderLoginLimiter) {
    return;
  }

  const ip = getClientIp(request);
  const result = await founderLoginLimiter.limit(`founder:login:${ip}`);
  if (!result.success) {
    throw new ApiValidationError(
      "RATE_LIMITED",
      "Too many login attempts. Please wait and try again.",
      429,
    );
  }
}
