import { createBotForCustomer, getBotByCustomerId } from "@/lib/db/bots";
import { createEmptyBotKnowledge } from "@/lib/db/bot-knowledge";
import { createCustomer, getCustomerByUserId } from "@/lib/db/customers";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/admin";

type Client = SupabaseClient<Database>;

export async function ensureCustomerOnboarding(
  supabase: Client,
  input: { userId: string; email: string },
) {
  let customer = await getCustomerByUserId(supabase, input.userId);

  if (!customer) {
    customer = await createCustomer(supabase, {
      userId: input.userId,
      email: input.email,
    });
  }

  let bot = await getBotByCustomerId(supabase, customer.id);

  if (!bot) {
    bot = await createBotForCustomer(supabase, {
      customerId: customer.id,
    });
  }

  const existingKnowledge = await supabase
    .from("bot_knowledge")
    .select("bot_id")
    .eq("bot_id", bot.bot_id)
    .maybeSingle();

  if (!existingKnowledge.data) {
    await createEmptyBotKnowledge(supabase, bot.bot_id);
  }

  return {
    customer,
    bot,
  };
}
