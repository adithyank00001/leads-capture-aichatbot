import {
  assertDataForSeoConfigured,
  dataForSeoRequest,
  type DataForSeoTaskResponse,
} from "@/lib/dataforseo/client";
import { serverEnv } from "@/lib/env.server";

export type MapsTaskPostInput = {
  keyword: string;
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

export function buildMapsPostbackUrl(searchId: string): string {
  assertDataForSeoConfigured();
  const origin = serverEnv.appUrl.replace(/\/+$/, "");
  const url = new URL(`${origin}/api/webhooks/dataforseo/maps`);
  url.searchParams.set("secret", serverEnv.dataforseoPostbackSecret!);
  url.searchParams.set("search_id", searchId);
  return url.toString();
}

export async function postGoogleMapsTask(
  input: MapsTaskPostInput,
): Promise<MapsTaskPostResult> {
  const payload = [
    {
      keyword: input.keyword,
      location_name: input.locationName,
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
    throw new Error(
      `Task create failed (${taskStatus}): ${taskMessage}`,
    );
  }

  return {
    taskId: task.id,
    statusCode: taskStatus,
    statusMessage: taskMessage,
  };
}
