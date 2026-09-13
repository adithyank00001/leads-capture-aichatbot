import { serverEnv } from "@/lib/env.server";

const DATAFORSEO_BASE_URL = "https://api.dataforseo.com";

export type DataForSeoTaskResponse = {
  version?: string;
  status_code?: number;
  status_message?: string;
  tasks?: Array<{
    id?: string;
    status_code?: number;
    status_message?: string;
    result?: unknown;
  }>;
};

export function assertDataForSeoConfigured() {
  if (
    !serverEnv.dataforseoLogin ||
    !serverEnv.dataforseoPassword ||
    !serverEnv.dataforseoPostbackSecret
  ) {
    throw new Error(
      "DataForSEO is not configured. Set DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD, and DATAFORSEO_POSTBACK_SECRET.",
    );
  }
}

function getAuthHeader(): string {
  assertDataForSeoConfigured();
  const token = Buffer.from(
    `${serverEnv.dataforseoLogin}:${serverEnv.dataforseoPassword}`,
  ).toString("base64");
  return `Basic ${token}`;
}

export async function dataForSeoRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  // Country location lists (e.g. India) can take 20–40s to download.
  const timeoutMs = 45_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${DATAFORSEO_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const text = await response.text();
    const trimmed = text.trimStart();
    if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
      throw new Error(
        `DataForSEO returned an HTML error page (HTTP ${response.status}). Please try again.`,
      );
    }

    let parsed: T & {
      status_message?: string;
      status_code?: number;
    };
    try {
      parsed = JSON.parse(text) as T & {
        status_message?: string;
        status_code?: number;
      };
    } catch {
      throw new Error(
        `DataForSEO returned non-JSON (HTTP ${response.status}). Please try again.`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `DataForSEO error (${response.status}): ${
          parsed.status_message ?? text.slice(0, 400)
        }`,
      );
    }

    return parsed;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "DataForSEO request timed out. Please try again in a moment.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
