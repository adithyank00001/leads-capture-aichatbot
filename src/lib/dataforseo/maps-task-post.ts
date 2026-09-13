import {
  assertDataForSeoConfigured,
  dataForSeoRequest,
  type DataForSeoTaskResponse,
} from "@/lib/dataforseo/client";
import { serverEnv } from "@/lib/env.server";

export type MapsTaskPostInput = {
  keyword: string;
  /** Preferred — from DataForSEO locations list */
  locationCode: number;
  /** Kept for logging / DB display */
  locationName: string;
  depth: number;
  searchId: string;
  postbackUrl: string;
};

export type MapsTaskPostResult = {
  taskId: string;
  statusCode: number;
  statusMessage: string;
};

/**
 * Public origin for DataForSEO postbacks.
 * Apex growscalex.com 307-redirects to www; DataForSEO does not complete
 * POST postbacks across that redirect, so always use www in production.
 */
export function getPublicAppOrigin(): string {
  const raw = serverEnv.appUrl.replace(/\/+$/, "");
  try {
    const url = new URL(raw);
    if (url.hostname === "growscalex.com") {
      url.hostname = "www.growscalex.com";
    }
    return url.origin;
  } catch {
    return raw;
  }
}

export function buildMapsPostbackUrl(searchId: string): string {
  assertDataForSeoConfigured();
  const url = new URL(`${getPublicAppOrigin()}/api/webhooks/dataforseo/maps`);
  url.searchParams.set("secret", serverEnv.dataforseoPostbackSecret!);
  url.searchParams.set("search_id", searchId);
  return url.toString();
}

/**
 * Standard queue Task POST.
 * Docs: https://docs.dataforseo.com/v3/serp/google/maps/task_post/
 * Prefer location_code over free-text location_name.
 */
export async function postGoogleMapsTask(
  input: MapsTaskPostInput,
): Promise<MapsTaskPostResult> {
  const payload = [
    {
      keyword: input.keyword,
      location_code: input.locationCode,
      language_code: "en",
      depth: input.depth,
      device: "desktop",
      postback_url: input.postbackUrl,
      postback_data: "advanced",
      tag: input.searchId,
    },
  ];

  const response = await dataForSeoRequest<DataForSeoTaskResponse>(
    "/v3/serp/google/maps/task_post",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  const task = response.tasks?.[0];
  const taskStatus = task?.status_code ?? response.status_code ?? 0;
  const taskMessage =
    task?.status_message ?? response.status_message ?? "Unknown error";

  // 20100 = Task Created
  if (taskStatus !== 20100 || !task?.id) {
    throw new Error(`Task create failed (${taskStatus}): ${taskMessage}`);
  }

  return {
    taskId: task.id,
    statusCode: taskStatus,
    statusMessage: taskMessage,
  };
}
