import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type CreateLeadInput = {
  botId: string;
  name: string;
  phone: string;
  email?: string | null;
  sessionId: string;
  pageUrl?: string | null;
};

export async function createLead(input: CreateLeadInput) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("chatbot_leads")
    .insert({
      bot_id: input.botId,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      session_id: input.sessionId,
      page_url: input.pageUrl ?? null,
    })
    .select("id, bot_id, name, phone, email, session_id, page_url, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getLeadBySession(botId: string, sessionId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("chatbot_leads")
    .select("id, bot_id, name, phone, email, session_id, page_url, created_at")
    .eq("bot_id", botId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
