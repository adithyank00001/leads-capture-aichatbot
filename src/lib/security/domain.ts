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

export function extractRequestHost(request: Request, pageUrl?: string | null) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  for (const candidate of [pageUrl, origin, referer]) {
    if (!candidate) {
      continue;
    }

    try {
      const host = new URL(candidate).hostname.replace(/^www\./, "");
      if (host) {
        return host;
      }
    } catch {
      continue;
    }
  }

  return null;
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
  const allowedDomains = await getAllowedDomainsForBot(botId);

  if (allowedDomains.length === 0) {
    return;
  }

  const requestHost = extractRequestHost(request, pageUrl);

  if (!requestHost) {
    throw new ApiValidationError(
      "DOMAIN_NOT_ALLOWED",
      "This chatbot can only be used from an approved website.",
      403,
    );
  }

  const normalizedRequestHost = requestHost.replace(/^www\./, "");
  const isAllowed = allowedDomains.some(
    (domain) =>
      normalizedRequestHost === domain ||
      normalizedRequestHost.endsWith(`.${domain}`),
  );

  if (!isAllowed) {
    throw new ApiValidationError(
      "DOMAIN_NOT_ALLOWED",
      "This chatbot can only be used from an approved website.",
      403,
    );
  }
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
