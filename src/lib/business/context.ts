import { ApiValidationError } from "@/lib/validation/errors";
import { getBotKnowledge } from "@/lib/db/bot-knowledge";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type BusinessContext = {
  botId: string;
  name: string;
  description: string;
  location: string;
  services: string;
  pricingNotes: string;
  currentOffer: string;
  openingHours: string;
  contactMethod: string;
  extraNotes: string;
};

const PLATFORM_RULES = [
  "Do not promise same-day service unless it is explicitly stated in the business information.",
  "Do not offer services that are not listed in the business information.",
  "Do not invent prices, discounts, locations, or hours.",
];

export async function getBusinessContext(botId: string): Promise<BusinessContext> {
  const supabase = getSupabaseAdmin();

  const { data: bot, error: botError } = await supabase
    .from("bots")
    .select("bot_id, business_name, is_active")
    .eq("bot_id", botId)
    .maybeSingle();

  if (botError) {
    throw new Error(botError.message);
  }

  if (!bot || !bot.is_active) {
    throw new ApiValidationError(
      "UNKNOWN_BOT",
      "This chatbot is not available.",
      404,
    );
  }

  const knowledge = await getBotKnowledge(supabase, botId);

  return {
    botId: bot.bot_id,
    name: bot.business_name,
    description: knowledge?.description ?? "",
    location: knowledge?.location ?? "",
    services: knowledge?.services ?? "",
    pricingNotes: knowledge?.pricing_notes ?? "",
    currentOffer: knowledge?.current_offer ?? "",
    openingHours: knowledge?.opening_hours ?? "",
    contactMethod: knowledge?.contact_method ?? "",
    extraNotes: knowledge?.extra_notes ?? "",
  };
}

export function getPlatformRules() {
  return PLATFORM_RULES;
}
