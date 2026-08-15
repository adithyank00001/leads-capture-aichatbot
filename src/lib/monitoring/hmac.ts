import { createHmac, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/lib/env.server";
import { ApiValidationError } from "@/lib/validation/errors";

const HMAC_TTL_SECONDS = 15 * 60;

export type MonitorCheckPayload = {
  action: "monitor_check";
  checkId: string;
  botId: string;
  websiteUrl: string;
  completeUrl: string;
  exp: number;
  sig?: string;
};

export type MonitorCompletePayload = {
  action: "monitor_complete";
  checkId: string;
  botId: string;
  pageOk: boolean;
  errorMessage?: string | null;
  exp: number;
  sig?: string;
};

function canonicalMonitorCheck(payload: MonitorCheckPayload) {
  return JSON.stringify({
    action: payload.action,
    checkId: payload.checkId,
    botId: payload.botId,
    websiteUrl: payload.websiteUrl,
    completeUrl: payload.completeUrl,
    exp: payload.exp,
  });
}

function canonicalMonitorComplete(payload: MonitorCompletePayload) {
  return JSON.stringify({
    action: payload.action,
    checkId: payload.checkId,
    botId: payload.botId,
    pageOk: payload.pageOk,
    errorMessage: payload.errorMessage ?? null,
    exp: payload.exp,
  });
}

function hmacHex(canonical: string, secret: string) {
  return createHmac("sha256", secret).update(canonical).digest("hex");
}

function signaturesMatch(expected: string, actual: string) {
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(actual, "utf8");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function requireMonitorHmacSecret() {
  if (!serverEnv.gasMonitorHmacSecret) {
    throw new ApiValidationError(
      "MONITOR_NOT_CONFIGURED",
      "Widget monitoring is not configured.",
      500,
    );
  }

  return serverEnv.gasMonitorHmacSecret;
}

export function signMonitorCheckPayload(
  payload: Omit<MonitorCheckPayload, "exp" | "sig">,
) {
  const secret = requireMonitorHmacSecret();
  const exp = Math.floor(Date.now() / 1000) + HMAC_TTL_SECONDS;
  const withExp = { ...payload, exp };
  return {
    ...withExp,
    sig: hmacHex(canonicalMonitorCheck(withExp), secret),
  };
}

export function verifyMonitorCheckPayload(payload: MonitorCheckPayload) {
  const secret = serverEnv.gasMonitorHmacSecret;

  if (!secret || !payload.sig || !payload.exp) {
    return false;
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = hmacHex(canonicalMonitorCheck(payload), secret);
  return signaturesMatch(expected, payload.sig);
}

export function verifyMonitorCompletePayload(payload: MonitorCompletePayload) {
  const secret = serverEnv.gasMonitorHmacSecret;

  if (!secret || !payload.sig || !payload.exp) {
    return false;
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = hmacHex(canonicalMonitorComplete(payload), secret);
  return signaturesMatch(expected, payload.sig);
}

export function verifyCronSecret(header: string | null) {
  const expected = serverEnv.widgetMonitorCronSecret;

  if (!expected || !header) {
    return false;
  }

  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(token, "utf8");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}
