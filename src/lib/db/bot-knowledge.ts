import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/admin";

type Client = SupabaseClient<Database>;

export type BotKnowledgeRecord = {
  bot_id: string;
  description: string;
  location: string;
  services: string;
  pricing_notes: string;
  current_offer: string;
  opening_hours: string;
  contact_method: string;
  extra_notes: string;
  updated_at: string;
};

export type BotKnowledgeInput = Omit<BotKnowledgeRecord, "bot_id" | "updated_at">;

export async function getBotKnowledge(supabase: Client, botId: string) {
  const { data, error } = await supabase
    .from("bot_knowledge")
    .select(
      "bot_id, description, location, services, pricing_notes, current_offer, opening_hours, contact_method, extra_notes, updated_at",
    )
    .eq("bot_id", botId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createEmptyBotKnowledge(supabase: Client, botId: string) {
  const { data, error } = await supabase
    .from("bot_knowledge")
    .insert({ bot_id: botId })
    .select(
      "bot_id, description, location, services, pricing_notes, current_offer, opening_hours, contact_method, extra_notes, updated_at",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function upsertBotKnowledge(
  supabase: Client,
  botId: string,
  input: BotKnowledgeInput,
) {
  const { data, error } = await supabase
    .from("bot_knowledge")
    .upsert({
      bot_id: botId,
      description: input.description,
      location: input.location,
      services: input.services,
      pricing_notes: input.pricing_notes,
      current_offer: input.current_offer,
      opening_hours: input.opening_hours,
      contact_method: input.contact_method,
      extra_notes: input.extra_notes,
      updated_at: new Date().toISOString(),
    })
    .select(
      "bot_id, description, location, services, pricing_notes, current_offer, opening_hours, contact_method, extra_notes, updated_at",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
