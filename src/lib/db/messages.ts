import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Client = SupabaseClient<Database>;

export type MessageRole = "user" | "assistant";

export type CreateMessageInput = {
  botId: string;
  sessionId: string;
  role: MessageRole;
  content: string;
};

const MESSAGE_SELECT =
  "id, bot_id, session_id, role, content, created_at" as const;

export async function createMessage(input: CreateMessageInput) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("chatbot_messages")
    .insert({
      bot_id: input.botId,
      session_id: input.sessionId,
      role: input.role,
      content: input.content,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getMessagesForDisplay(
  botId: string,
  sessionId: string,
  sinceDate?: Date,
) {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("chatbot_messages")
    .select(MESSAGE_SELECT)
    .eq("bot_id", botId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (sinceDate) {
    query = query.gte("created_at", sinceDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getRecentMessagesForAi(
  botId: string,
  sessionId: string,
  limit = 5,
) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("chatbot_messages")
    .select(MESSAGE_SELECT)
    .eq("bot_id", botId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reverse();
}

/** @deprecated Use getMessagesForDisplay or getRecentMessagesForAi */
export async function getMessagesBySession(
  botId: string,
  sessionId: string,
  options: { limit?: number; sinceDate?: Date } = {},
) {
  if (options.limit !== undefined) {
    return getRecentMessagesForAi(botId, sessionId, options.limit);
  }

  return getMessagesForDisplay(botId, sessionId, options.sinceDate);
}

export async function getMessagesBySessionSince(
  supabase: Client,
  botId: string,
  sessionId: string,
  sinceDate: Date,
  limit = 500,
) {
  let query = supabase
    .from("chatbot_messages")
    .select(MESSAGE_SELECT)
    .eq("bot_id", botId)
    .eq("session_id", sessionId)
    .gte("created_at", sinceDate.toISOString())
    .order("created_at", { ascending: true });

  if (limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function deleteMessagesBySession(
  botId: string,
  sessionId: string,
) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("chatbot_messages")
    .delete()
    .eq("bot_id", botId)
    .eq("session_id", sessionId);

  if (error) {
    throw new Error(error.message);
  }
}
