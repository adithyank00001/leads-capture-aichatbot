import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ApiValidationError } from "@/lib/validation/errors";

type BotUsageRow = {
  bot_id: string;
  monthly_message_limit: number;
  messages_used_this_period: number;
  leads_captured_this_period: number;
  billing_period_start: string;
  billing_period_end: string;
};

function getDefaultPeriod() {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);

  return { start, end };
}

async function getBotUsage(botId: string): Promise<BotUsageRow | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("bots")
    .select(
      "bot_id, monthly_message_limit, messages_used_this_period, leads_captured_this_period, billing_period_start, billing_period_end",
    )
    .eq("bot_id", botId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as BotUsageRow | null;
}

async function resetPeriodIfNeeded(bot: BotUsageRow) {
  const now = new Date();
  const periodEnd = new Date(bot.billing_period_end);

  if (now < periodEnd) {
    return bot;
  }

  const { start, end } = getDefaultPeriod();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("bots")
    .update({
      messages_used_this_period: 0,
      leads_captured_this_period: 0,
      billing_period_start: start.toISOString(),
      billing_period_end: end.toISOString(),
    })
    .eq("bot_id", bot.bot_id)
    .select(
      "bot_id, monthly_message_limit, messages_used_this_period, leads_captured_this_period, billing_period_start, billing_period_end",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BotUsageRow;
}

export async function assertBotCanUseAi(botId: string) {
  const bot = await getBotUsage(botId);

  if (!bot) {
    return;
  }

  const current = await resetPeriodIfNeeded(bot);

  if (current.messages_used_this_period >= current.monthly_message_limit) {
    throw new ApiValidationError(
      "USAGE_LIMIT_REACHED",
      "This chatbot has reached its monthly message limit. Please try again later.",
      403,
    );
  }
}

export async function incrementMessageUsage(botId: string) {
  const bot = await getBotUsage(botId);

  if (!bot) {
    return;
  }

  const current = await resetPeriodIfNeeded(bot);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("bots")
    .update({
      messages_used_this_period: current.messages_used_this_period + 1,
    })
    .eq("bot_id", botId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function incrementLeadCount(botId: string) {
  const bot = await getBotUsage(botId);

  if (!bot) {
    return;
  }

  const current = await resetPeriodIfNeeded(bot);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("bots")
    .update({
      leads_captured_this_period: current.leads_captured_this_period + 1,
    })
    .eq("bot_id", botId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getBotUsageSummary(botId: string) {
  const bot = await getBotUsage(botId);

  if (!bot) {
    return null;
  }

  const current = await resetPeriodIfNeeded(bot);

  return {
    monthlyMessageLimit: current.monthly_message_limit,
    messagesUsedThisPeriod: current.messages_used_this_period,
    leadsCapturedThisPeriod: current.leads_captured_this_period,
    billingPeriodStart: current.billing_period_start,
    billingPeriodEnd: current.billing_period_end,
  };
}
