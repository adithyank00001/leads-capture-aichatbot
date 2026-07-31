import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Client = SupabaseClient<Database>;

export type CreateLeadInput = {
  botId: string;
  name: string | null;
  phone: string | null;
  email?: string | null;
  customFields?: Record<string, string>;
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
      custom_fields: input.customFields ?? {},
      session_id: input.sessionId,
      page_url: input.pageUrl ?? null,
    })
    .select(
      "id, bot_id, name, phone, email, custom_fields, session_id, page_url, created_at",
    )
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
    .select(
      "id, bot_id, name, phone, email, custom_fields, session_id, page_url, created_at",
    )
    .eq("bot_id", botId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getLeadByIdForBot(
  supabase: Client,
  botId: string,
  leadId: string,
) {
  const { data, error } = await supabase
    .from("chatbot_leads")
    .select(
      "id, bot_id, name, phone, email, custom_fields, session_id, page_url, created_at",
    )
    .eq("bot_id", botId)
    .eq("id", leadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteLeadByIdForBot(
  supabase: Client,
  botId: string,
  leadId: string,
) {
  const lead = await getLeadByIdForBot(supabase, botId, leadId);

  if (!lead) {
    return null;
  }

  const admin = getSupabaseAdmin();

  const { error: messageError } = await admin
    .from("chatbot_messages")
    .delete()
    .eq("bot_id", botId)
    .eq("session_id", lead.session_id);

  if (messageError) {
    throw new Error(messageError.message);
  }

  const { error: leadError } = await admin
    .from("chatbot_leads")
    .delete()
    .eq("bot_id", botId)
    .eq("id", leadId);

  if (leadError) {
    throw new Error(leadError.message);
  }

  return lead;
}
