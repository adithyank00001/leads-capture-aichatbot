import { createEmbedding, formatEmbeddingForPostgres } from "@/lib/ai/embeddings";
import { serverEnv } from "@/lib/env.server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type WebsiteChunkMatch = {
  chunkContent: string;
  sourceUrl: string;
  pageTitle: string;
  heading: string;
  similarity: number;
};

async function countValidWebsiteChunks(botId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("count_valid_website_chunks", {
    p_bot_id: botId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? 0;
}

export async function retrieveWebsiteChunks(
  botId: string,
  question: string,
): Promise<WebsiteChunkMatch[]> {
  const validChunkCount = await countValidWebsiteChunks(botId);

  if (validChunkCount < 1) {
    return [];
  }

  const embedding = await createEmbedding(question);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc("match_website_chunks", {
    p_bot_id: botId,
    p_query_embedding: formatEmbeddingForPostgres(embedding),
    p_match_threshold: serverEnv.ragSimilarityThreshold,
    p_match_count: serverEnv.ragTopK,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    chunkContent: row.chunk_content,
    sourceUrl: row.source_url,
    pageTitle: row.page_title,
    heading: row.heading,
    similarity: row.similarity,
  }));
}
