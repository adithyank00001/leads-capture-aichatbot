import { serverEnv } from "@/lib/env.server";
import { enrollBotWidgetMonitor } from "@/lib/monitoring/enroll";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  extractHostFromUrl,
  isHostAllowed,
  normalizeDomain,
} from "@/lib/security/domain-shared";
import { ApiValidationError } from "@/lib/validation/errors";

export {
  extractHostFromUrl,
  isHostAllowed,
  normalizeDomain,
} from "@/lib/security/domain-shared";

export function getAppHostname() {
  return normalizeDomain(serverEnv.appUrl);
}

export function extractOriginHost(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  return extractHostFromUrl(origin);
}

export function extractRefererHost(request: Request) {
  const referer = request.headers.get("referer");

  if (!referer) {
    return null;
  }

  return extractHostFromUrl(referer);
}

const LOCAL_DEVELOPMENT_HOSTS = ["localhost", "127.0.0.1"] as const;

function isLocalDevelopment() {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const appHostname = getAppHostname();
  return appHostname
    ? isHostAllowed(appHostname, [...LOCAL_DEVELOPMENT_HOSTS])
    : false;
}

function withLocalDevelopmentHosts(allowedDomains: string[]) {
  if (!isLocalDevelopment()) {
    return allowedDomains;
  }

  return [
    ...new Set([...allowedDomains, ...LOCAL_DEVELOPMENT_HOSTS]),
  ];
}

export async function getAllowedDomainsForBot(botId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("bot_allowed_domains")
    .select("domain")
    .eq("bot_id", botId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => normalizeDomain(row.domain))
    .filter((domain): domain is string => Boolean(domain));
}

export async function assertAllowedDomain(
  request: Request,
  botId: string,
  pageUrl?: string | null,
) {
  const configuredDomains = await getAllowedDomainsForBot(botId);

  if (configuredDomains.length === 0) {
    throw new ApiValidationError(
      "DOMAIN_NOT_CONFIGURED",
      "Add an allowed website domain in Settings before using the chatbot.",
      403,
    );
  }

  const allowedDomains = withLocalDevelopmentHosts(configuredDomains);

  const appHostname = getAppHostname();
  const originHost = extractOriginHost(request);
  const refererHost = extractRefererHost(request);
  const pageHost = pageUrl ? extractHostFromUrl(pageUrl) : null;

  if (appHostname && originHost === appHostname) {
    if (pageHost) {
      if (isHostAllowed(pageHost, allowedDomains)) {
        return;
      }

      throw new ApiValidationError(
        "DOMAIN_NOT_ALLOWED",
        "This chatbot can only be used from an approved website.",
        403,
      );
    }

    return;
  }

  if (originHost && isHostAllowed(originHost, allowedDomains)) {
    return;
  }

  if (refererHost && isHostAllowed(refererHost, allowedDomains)) {
    return;
  }

  throw new ApiValidationError(
    "DOMAIN_NOT_ALLOWED",
    "This chatbot can only be used from an approved website.",
    403,
  );
}

export async function replaceAllowedDomains(botId: string, domains: string[]) {
  const supabase = getSupabaseAdmin();
  const normalized = [
    ...new Set(
      domains
        .map((domain) => normalizeDomain(domain))
        .filter((domain): domain is string => Boolean(domain)),
    ),
  ];

  const { error: deleteError } = await supabase
    .from("bot_allowed_domains")
    .delete()
    .eq("bot_id", botId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (normalized.length === 0) {
    await enrollBotWidgetMonitor(botId);
    return [];
  }

  const { data, error } = await supabase
    .from("bot_allowed_domains")
    .insert(
      normalized.map((domain) => ({
        bot_id: botId,
        domain,
      })),
    )
    .select("domain");

  if (error) {
    throw new Error(error.message);
  }

  await enrollBotWidgetMonitor(botId);

  return (data ?? []).map((row) => row.domain);
}

export async function listAllowedDomainsForDashboard(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  botId: string,
) {
  const { data, error } = await supabase
    .from("bot_allowed_domains")
    .select("domain")
    .eq("bot_id", botId)
    .order("domain", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.domain);
}
