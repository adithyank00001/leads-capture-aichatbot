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
 * Must be a public https URL DataForSEO can reach.
 * - Apex growscalex.com 307-redirects to www (breaks POST postbacks)
 * - localhost / ngrok tunnels often return 404 when offline
 */
export function getPublicAppOrigin(): string {
  const raw = serverEnv.appUrl.replace(/\/+$/, "");
  const productionOrigin = "https://www.growscalex.com";

  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();

    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".ngrok-free.dev") ||
      host.endsWith(".ngrok.io") ||
      host.endsWith(".ngrok.app")
    ) {
      return productionOrigin;
    }

    if (host === "growscalex.com") {
      return productionOrigin;
    }

    return url.origin;
  } catch {
    return productionOrigin;
  }
}

export function buildMapsPostbackUrl(searchId: string): string {
  assertDataForSeoConfigured();
  const url = new URL(`${getPublicAppOrigin()}/api/webhooks/dataforseo/maps`);
  url.searchParams.set("secret", serverEnv.dataforseoPostbackSecret!);
  url.searchParams.set("search_id", searchId);
  return url.toString();
}

/** Trial-only postback — paid maps webhook URL is unchanged. */
export function buildTrialMapsPostbackUrl(trialSearchId: string): string {
  assertDataForSeoConfigured();
  const url = new URL(
    `${getPublicAppOrigin()}/api/webhooks/dataforseo/maps-trial`,
  );
  url.searchParams.set("secret", serverEnv.dataforseoPostbackSecret!);
  url.searchParams.set("trial_search_id", trialSearchId);
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
