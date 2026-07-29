import { getSupabaseAdmin } from "@/lib/supabase/admin";

import { getWebsiteSourceByBotId } from "./website-source";

export async function clearWebsiteKnowledgeForBot(botId: string) {
  const supabase = getSupabaseAdmin();
  const existingSource = await getWebsiteSourceByBotId(supabase, botId);

  const { count: chunkCount, error: chunkCountError } = await supabase
    .from("bot_website_chunks")
    .select("id", { count: "exact", head: true })
    .eq("bot_id", botId);

  if (chunkCountError) {
    throw new Error(chunkCountError.message);
  }

  const { error: chunkDeleteError } = await supabase
    .from("bot_website_chunks")
    .delete()
    .eq("bot_id", botId);

  if (chunkDeleteError) {
    throw new Error(chunkDeleteError.message);
  }

  let deletedPages = 0;

  if (existingSource) {
    const { count: pageCount, error: pageCountError } = await supabase
      .from("bot_website_pages")
      .select("id", { count: "exact", head: true })
      .eq("source_id", existingSource.id);

    if (pageCountError) {
      throw new Error(pageCountError.message);
    }

    deletedPages = pageCount ?? 0;

    const { error: pageDeleteError } = await supabase
      .from("bot_website_pages")
      .delete()
      .eq("source_id", existingSource.id);

    if (pageDeleteError) {
      throw new Error(pageDeleteError.message);
    }
  }

  return {
    deletedChunks: chunkCount ?? 0,
    deletedPages,
  };
}
