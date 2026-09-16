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

const trialSearchLimiter = (() => {
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "15 m"),
    prefix: "chatbot-mvp-trial-search",
  });
})();

export async function assertTrialSearchRateLimit(request: Request) {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.SMOKE_TEST_BYPASS_RATE_LIMIT === "true"
  ) {
    return;
  }

  if (!trialSearchLimiter) {
    return;
  }

  const ip = getClientIp(request);
  const result = await trialSearchLimiter.limit(`trial:search:${ip}`);
  if (!result.success) {
    throw new ApiValidationError(
      "RATE_LIMITED",
      "Too many trial searches. Please wait and try again.",
      429,
    );
  }
}
