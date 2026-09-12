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
  const response = await fetch(`${DATAFORSEO_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `DataForSEO HTTP ${response.status}${text ? `: ${text.slice(0, 300)}` : ""}`,
    );
  }

  return (await response.json()) as T;
}
