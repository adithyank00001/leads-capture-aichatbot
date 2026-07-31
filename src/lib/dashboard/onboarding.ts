import { createBotForCustomer, getBotByCustomerId } from "@/lib/db/bots";
import { createEmptyBotKnowledge } from "@/lib/db/bot-knowledge";
import { ensureWidgetSettingsForBot } from "@/lib/db/bot-widget-settings";
import { createCustomer, getCustomerByUserId } from "@/lib/db/customers";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/admin";

type Client = SupabaseClient<Database>;

export async function ensureCustomerOnboarding(
  supabase: SupabaseClient,
  input: { userId: string; email: string },
) {
  const client = supabase as Client;

  const customer =
    (await getCustomerByUserId(client, input.userId)) ??
    (await createCustomer(client, {
      userId: input.userId,
      email: input.email,
    }));

  const bot =
    (await getBotByCustomerId(client, customer.id)) ??
    (await createBotForCustomer(client, {
      customerId: customer.id,
    }));

  const existingKnowledge = await client
    .from("bot_knowledge")
    .select("bot_id")
    .eq("bot_id", bot.bot_id)
    .maybeSingle();

  if (!existingKnowledge.data) {
    await createEmptyBotKnowledge(client, bot.bot_id);
  }

  await ensureWidgetSettingsForBot(client, bot.bot_id);

  return {
    customer,
    bot,
  };
}
