import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdmin, type Database } from "@/lib/supabase/admin";
import { ApiValidationError } from "@/lib/validation/errors";

type Client = SupabaseClient<Database>;

export type WebsitePageStatus =
  Database["public"]["Tables"]["bot_website_pages"]["Row"]["status"];

export type WebsitePageRecord =
  Database["public"]["Tables"]["bot_website_pages"]["Row"];

export async function getWebsitePagesBySourceId(
  supabase: Client,
  sourceId: string,
) {
  const { data, error } = await supabase
    .from("bot_website_pages")
    .select("*")
    .eq("source_id", sourceId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getWebsitePageById(supabase: Client, pageId: string) {
  const { data, error } = await supabase
    .from("bot_website_pages")
    .select("*")
    .eq("id", pageId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getWebsitePageForBot(
  supabase: Client,
  pageId: string,
  botId: string,
) {
  const page = await getWebsitePageById(supabase, pageId);

  if (!page) {
    throw new ApiValidationError("PAGE_NOT_FOUND", "Page not found.", 404);
  }

  if (page.bot_id !== botId) {
    throw new ApiValidationError("PAGE_NOT_FOUND", "Page not found.", 404);
  }

  return page;
}

export function toWebsitePageStatusItem(page: WebsitePageRecord) {
  return {
    id: page.id,
    pageUrl: page.page_url,
    pageTitle: page.page_title,
    status: page.status,
    errorMessage: page.error_message,
    sortOrder: page.sort_order,
  };
}

export async function retryWebsitePageRpc(pageId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("retry_website_page", {
    p_page_id: pageId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as {
    page: WebsitePageRecord;
    source: Database["public"]["Tables"]["bot_website_sources"]["Row"];
  };
}

export async function countPendingPagesForSource(
  supabase: Client,
  sourceId: string,
) {
  const { count, error } = await supabase
    .from("bot_website_pages")
    .select("id", { count: "exact", head: true })
    .eq("source_id", sourceId)
    .in("status", ["pending", "processing"]);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
