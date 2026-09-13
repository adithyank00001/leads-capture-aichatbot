import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { serverEnv } from "@/lib/env.server";

export const FOUNDER_COOKIE_NAME = "gsx_founder_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function equalString(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function requireFounderConfig() {
  const email = serverEnv.founderEmail?.trim().toLowerCase();
  const password = serverEnv.founderPassword;
  const dashboardSecret = serverEnv.founderDashboardSecret?.trim();
  const sessionSecret = serverEnv.founderSessionSecret?.trim();

  if (!email || !password || !dashboardSecret || !sessionSecret) {
    return null;
  }

  return { email, password, dashboardSecret, sessionSecret };
}

export function getFounderDashboardSecret() {
  return requireFounderConfig()?.dashboardSecret ?? null;
}

export function isValidFounderDashboardSecret(secret: string) {
  const expected = getFounderDashboardSecret();
  if (!expected) {
    return false;
  }
  return equalString(secret, expected);
}

function signPayload(payload: string, sessionSecret: string) {
  return createHmac("sha256", sessionSecret).update(payload).digest("hex");
}

export function verifyFounderCredentials(input: {
  email: string;
  password: string;
}) {
  const config = requireFounderConfig();
  if (!config) {
    return false;
  }

  const emailOk = equalString(
    input.email.trim().toLowerCase(),
    config.email,
  );
  const passwordOk = equalString(input.password, config.password);
  return emailOk && passwordOk;
}

export function createFounderSessionToken() {
  const config = requireFounderConfig();
  if (!config) {
    throw new Error("Founder auth is not configured.");
  }

  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `founder:${expiresAt}`;
  const sig = signPayload(payload, config.sessionSecret);
  return `${payload}.${sig}`;
}

export function verifyFounderSessionToken(token: string | undefined | null) {
  if (!token) {
    return false;
  }

  const config = requireFounderConfig();
  if (!config) {
    return false;
  }

  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) {
    return false;
  }

  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = signPayload(payload, config.sessionSecret);

  if (!equalString(sig, expected)) {
    return false;
  }

  const [, expiresRaw] = payload.split(":");
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  return true;
}

export function founderCookieOptions(maxAgeSeconds = SESSION_TTL_MS / 1000) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(maxAgeSeconds),
  };
}

export async function hasFounderSession() {
  const jar = await cookies();
  return verifyFounderSessionToken(jar.get(FOUNDER_COOKIE_NAME)?.value);
}

export async function requireFounderSession() {
  const ok = await hasFounderSession();
  if (!ok) {
    notFound();
  }
}

export function assertFounderDashboardSecretOrNotFound(secret: string) {
  if (!isValidFounderDashboardSecret(secret)) {
    notFound();
  }
}
