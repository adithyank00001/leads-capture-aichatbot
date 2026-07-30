import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/admin";
import { ApiValidationError } from "@/lib/validation/errors";

type Client = SupabaseClient<Database>;

export type WebsiteSourceStatus =
  Database["public"]["Tables"]["bot_website_sources"]["Row"]["status"];

export type WebsiteSourceRecord =
  Database["public"]["Tables"]["bot_website_sources"]["Row"];

const ACTIVE_STATUSES: WebsiteSourceStatus[] = ["discovering", "processing"];

export function isWebsiteBuildActive(status: WebsiteSourceStatus) {
  return ACTIVE_STATUSES.includes(status);
}

export async function getWebsiteSourceByBotId(supabase: Client, botId: string) {
  const { data, error } = await supabase
    .from("bot_website_sources")
    .select("*")
    .eq("bot_id", botId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function upsertWebsiteSourceForBuild(
  supabase: Client,
  input: {
    botId: string;
    websiteUrl: string;
  },
) {
  const existing = await getWebsiteSourceByBotId(supabase, input.botId);

  if (existing && isWebsiteBuildActive(existing.status)) {
    throw new ApiValidationError(
      "BUILD_ALREADY_RUNNING",
      "A website knowledge build is already running.",
      409,
    );
  }

  const { data, error } = await supabase
    .from("bot_website_sources")
    .upsert(
      {
        bot_id: input.botId,
        website_url: input.websiteUrl,
        status: "discovering",
        total_pages: 0,
        completed_pages: 0,
        failed_pages: 0,
        current_page_index: 0,
        error_message: null,
        refresh_error_message: null,
        selected_urls: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "bot_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export function toWebsiteStatusResponse(source: WebsiteSourceRecord | null) {
  if (!source) {
    return {
      status: "idle" as const,
      websiteUrl: "",
      totalPages: 0,
      completedPages: 0,
      failedPages: 0,
      currentPageIndex: 0,
      errorMessage: null as string | null,
      refreshErrorMessage: null as string | null,
      lastProcessedAt: null as string | null,
      updatedAt: null as string | null,
    };
  }

  return {
    status: source.status,
    websiteUrl: source.website_url,
    totalPages: source.total_pages,
    completedPages: source.completed_pages,
    failedPages: source.failed_pages,
    currentPageIndex: source.current_page_index,
    errorMessage: source.error_message,
    refreshErrorMessage: source.refresh_error_message,
    lastProcessedAt: source.last_processed_at,
    updatedAt: source.updated_at,
  };
}
