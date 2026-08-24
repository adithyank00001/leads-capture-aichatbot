import type { SupabaseClient } from "@supabase/supabase-js";

import {
  CHAT_RETENTION_DAYS,
  getChatRetentionCutoffDate,
} from "@/lib/chat/retention";
import type { Database } from "@/lib/supabase/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Client = SupabaseClient<Database>;

const LEAD_SELECT_COLUMNS =
  "id, bot_id, name, phone, email, custom_fields, session_id, page_url, created_at, deleted_at";

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
    .select(LEAD_SELECT_COLUMNS)
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
    .select(LEAD_SELECT_COLUMNS)
    .eq("bot_id", botId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/** Dashboard-visible lead only (excludes soft-hidden). */
export async function getLeadByIdForBot(
  supabase: Client,
  botId: string,
  leadId: string,
) {
  const { data, error } = await supabase
    .from("chatbot_leads")
    .select(LEAD_SELECT_COLUMNS)
    .eq("bot_id", botId)
    .eq("id", leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Soft-hide a lead from the dashboard. Keeps the row (and messages) for
 * CHAT_RETENTION_DAYS, then lazy purge hard-deletes them.
 */
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
  const deletedAt = new Date().toISOString();

  const { data, error } = await admin
    .from("chatbot_leads")
    .update({ deleted_at: deletedAt })
    .eq("bot_id", botId)
    .eq("id", leadId)
    .is("deleted_at", null)
    .select(LEAD_SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? lead;
}

/**
 * Hard-delete soft-hidden leads older than the retention window (and their messages).
 * Safe to call often; never throws into the caller if you wrap — callers may await and ignore soft failures.
 */
export async function purgeSoftDeletedLeadsOlderThanRetention(
  now = new Date(),
): Promise<void> {
  const admin = getSupabaseAdmin();
  const cutoff = getChatRetentionCutoffDate(now).toISOString();

  const { data: expiredLeads, error: listError } = await admin
    .from("chatbot_leads")
    .select("id, bot_id, session_id")
    .not("deleted_at", "is", null)
    .lte("deleted_at", cutoff)
    .limit(100);

  if (listError) {
    throw new Error(listError.message);
  }

  if (!expiredLeads?.length) {
    return;
  }

  for (const lead of expiredLeads) {
    const { error: messageError } = await admin
      .from("chatbot_messages")
      .delete()
      .eq("bot_id", lead.bot_id)
      .eq("session_id", lead.session_id);

    if (messageError) {
      throw new Error(messageError.message);
    }

    const { error: leadError } = await admin
      .from("chatbot_leads")
      .delete()
      .eq("id", lead.id)
      .eq("bot_id", lead.bot_id);

    if (leadError) {
      throw new Error(leadError.message);
    }
  }
}

/** Retention days for soft-hidden leads (same as chat). */
export const LEAD_SOFT_DELETE_RETENTION_DAYS = CHAT_RETENTION_DAYS;
