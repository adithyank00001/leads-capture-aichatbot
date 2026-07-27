import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";
import { requireAuthUser } from "@/lib/auth/dashboard";
import { appendWebsiteBuildLog } from "@/lib/db/website-build-log";
import {
  getWebsiteSourceByBotId,
  upsertWebsiteSourceForBuild,
} from "@/lib/db/website-source";
import { ensureCustomerOnboarding } from "@/lib/dashboard/onboarding";
import { extractHostFromUrl, isHostAllowed } from "@/lib/security/domain";
import { triggerGasIngestionStart } from "@/lib/website/ingestion";
import { normalizeWebsiteUrl } from "@/lib/website/url";
import { ApiValidationError } from "@/lib/validation/errors";

type BuildPayload = {
  websiteUrl?: string;
};

export async function POST(request: Request) {
  let botId = "";
  let sourceId: string | null = null;

  try {
    const { supabase, user } = await requireAuthUser();
    const body = (await parseJsonBody(request)) as BuildPayload;
    const websiteUrl = normalizeWebsiteUrl(body.websiteUrl ?? "");

    if (!websiteUrl) {
      throw new ApiValidationError(
        "INVALID_WEBSITE_URL",
        "Please enter a valid website URL.",
      );
    }

    const { bot } = await ensureCustomerOnboarding(supabase, {
      userId: user.id,
      email: user.email ?? "",
    });
    botId = bot.bot_id;

    await appendWebsiteBuildLog(
      {
        botId,
        step: "build_request",
        status: "started",
        message: `Build requested for ${websiteUrl}`,
      },
      supabase,
    );

    const { data: allowedDomains, error: domainsError } = await supabase
      .from("bot_allowed_domains")
      .select("domain")
      .eq("bot_id", bot.bot_id);

    if (domainsError) {
      throw new Error(domainsError.message);
    }

    const normalizedAllowed = (allowedDomains ?? [])
      .map((row) => row.domain)
      .filter(Boolean);

    await appendWebsiteBuildLog(
      {
        botId,
        step: "domain_check",
        status: "info",
        message: `Allowed domains: ${normalizedAllowed.join(", ") || "(none)"}`,
      },
      supabase,
    );

    if (normalizedAllowed.length === 0) {
      throw new ApiValidationError(
        "DOMAIN_NOT_CONFIGURED",
        "Add an allowed website domain in Settings before building website knowledge.",
      );
    }

    const websiteHost = extractHostFromUrl(websiteUrl);

    if (!websiteHost || !isHostAllowed(websiteHost, normalizedAllowed)) {
      await appendWebsiteBuildLog(
        {
          botId,
          step: "domain_check",
          status: "failed",
          message: `Website host "${websiteHost ?? "unknown"}" does not match allowed domains.`,
        },
        supabase,
      );

      throw new ApiValidationError(
        "DOMAIN_MISMATCH",
        "The website URL must match your allowed domain in Settings.",
      );
    }

    await appendWebsiteBuildLog(
      {
        botId,
        step: "domain_check",
        status: "passed",
        message: `Website host "${websiteHost}" matches allowed domains.`,
      },
      supabase,
    );

    const existing = await getWebsiteSourceByBotId(supabase, bot.bot_id);

    if (
      existing &&
      (existing.status === "discovering" || existing.status === "processing")
    ) {
      throw new ApiValidationError(
        "BUILD_ALREADY_RUNNING",
        "A website knowledge build is already running.",
        409,
      );
    }

    const source = await upsertWebsiteSourceForBuild(supabase, {
      botId: bot.bot_id,
      websiteUrl,
    });
    sourceId = source.id;

    await appendWebsiteBuildLog(
      {
        sourceId: source.id,
        botId,
        step: "database",
        status: "saved",
        message: `Source row saved with status "${source.status}". ID: ${source.id}`,
      },
      supabase,
    );

    await triggerGasIngestionStart({
      sourceId: source.id,
      botId: bot.bot_id,
      websiteUrl,
    });

    return apiSuccess({
      sourceId: source.id,
      status: source.status,
    });
  } catch (error) {
    if (botId) {
      await appendWebsiteBuildLog({
        sourceId,
        botId,
        step: "build_request",
        status: "error",
        message: error instanceof Error ? error.message : "Build failed.",
      });
    }

    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
