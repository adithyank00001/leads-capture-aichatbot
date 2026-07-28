import { serverEnv } from "@/lib/env.server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ApiValidationError } from "@/lib/validation/errors";

export function normalizeDomain(value: string) {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return null;
  }

  try {
    const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^www\./, "").split("/")[0] ?? null;
  }
}

export function extractHostFromUrl(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function getAppHostname() {
  return normalizeDomain(serverEnv.appUrl);
}

export function extractRequestHost(request: Request, pageUrl?: string | null) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  for (const candidate of [pageUrl, origin, referer]) {
    if (!candidate) {
      continue;
    }

    const host = extractHostFromUrl(candidate);
    if (host) {
      return host;
    }
  }

  return null;
}

const LOCAL_DEVELOPMENT_HOSTS = ["localhost", "127.0.0.1"] as const;

export function isHostAllowed(host: string, allowedDomains: string[]) {
  const normalizedHost = host.replace(/^www\./, "");

  return allowedDomains.some(
    (domain) =>
      normalizedHost === domain || normalizedHost.endsWith(`.${domain}`),
  );
}

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
  const allowedDomains = withLocalDevelopmentHosts(
    await getAllowedDomainsForBot(botId),
  );

  if (allowedDomains.length === 0) {
    return;
  }

  const appHostname = getAppHostname();
  const requestHost = extractRequestHost(request, null);

  if (pageUrl) {
    const pageHost = extractHostFromUrl(pageUrl);

    if (pageHost && isHostAllowed(pageHost, allowedDomains)) {
      return;
    }

    throw new ApiValidationError(
      "DOMAIN_NOT_ALLOWED",
      "This chatbot can only be used from an approved website.",
      403,
    );
  }

  if (appHostname && requestHost === appHostname) {
    return;
  }

  if (requestHost && isHostAllowed(requestHost, allowedDomains)) {
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
