import "server-only";

import type { getDashboardBundle } from "@/lib/auth/dashboard-session";
import type { WebsiteBuildStatus } from "@/lib/dashboard/setup-status";

export type DashboardOverviewData = {
  botId: string;
  businessName: string;
  knowledge: {
    description: string;
    location: string;
    services: string;
    pricing_notes: string;
    current_offer: string;
    opening_hours: string;
    contact_method: string;
    extra_notes: string;
  };
  allowedDomains: string[];
  usage: {
    monthlyMessageLimit: number;
    messagesUsedThisPeriod: number;
    leadsCapturedThisPeriod: number;
  } | null;
  websiteStatus: WebsiteBuildStatus;
  completedPages: number;
};

type DashboardBundle = NonNullable<Awaited<ReturnType<typeof getDashboardBundle>>>;

export function mapDashboardBundleToOverview(
  bundle: DashboardBundle,
): DashboardOverviewData {
  const bot = bundle.customer.bots;
  const knowledge = bot?.bot_knowledge;

  return {
    botId: bot?.bot_id ?? "",
    businessName: bot?.business_name ?? "",
    knowledge: {
      description: knowledge?.description ?? "",
      location: knowledge?.location ?? "",
      services: knowledge?.services ?? "",
      pricing_notes: knowledge?.pricing_notes ?? "",
      current_offer: knowledge?.current_offer ?? "",
      opening_hours: knowledge?.opening_hours ?? "",
      contact_method: knowledge?.contact_method ?? "",
      extra_notes: knowledge?.extra_notes ?? "",
    },
    allowedDomains: (bot?.bot_allowed_domains ?? []).map((row) => row.domain),
    usage: bot
      ? {
          monthlyMessageLimit: bot.monthly_message_limit,
          messagesUsedThisPeriod: bot.messages_used_this_period,
          leadsCapturedThisPeriod: bot.leads_captured_this_period,
        }
      : null,
    websiteStatus: bot?.bot_website_sources?.status ?? null,
    completedPages: bot?.bot_website_sources?.completed_pages ?? 0,
  };
}

export function mapDashboardBundleToSettings(
  bundle: DashboardBundle,
): BotSettingsInitialData {
  const overview = mapDashboardBundleToOverview(bundle);

  return {
    businessName: overview.businessName,
    knowledge: overview.knowledge,
    allowedDomains: overview.allowedDomains,
    usage: overview.usage,
  };
}

export type BotSettingsInitialData = {
  businessName: string;
  knowledge: DashboardOverviewData["knowledge"];
  allowedDomains: string[];
  usage: DashboardOverviewData["usage"];
};

export async function loadDashboardOverviewData(
  bundle: DashboardBundle,
): Promise<DashboardOverviewData> {
  return mapDashboardBundleToOverview(bundle);
}
