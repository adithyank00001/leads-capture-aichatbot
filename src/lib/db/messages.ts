import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type MessageRole = "user" | "assistant";

export type CreateMessageInput = {
  botId: string;
  sessionId: string;
  role: MessageRole;
  content: string;
};

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
    .select("id, bot_id, session_id, role, content, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getMessagesBySession(
  botId: string,
  sessionId: string,
  limit = 20,
) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("chatbot_messages")
    .select("id, bot_id, session_id, role, content, created_at")
    .eq("bot_id", botId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
