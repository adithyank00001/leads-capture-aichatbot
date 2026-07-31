import { createLead, getLeadBySession } from "@/lib/db/leads";
import { ensureWidgetSettingsForBot } from "@/lib/db/bot-widget-settings";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { assertLeadRateLimits } from "@/lib/rate-limit";
import { assertAllowedDomain } from "@/lib/security/domain";
import { incrementLeadCount } from "@/lib/usage/bot-usage";
import { ApiValidationError } from "@/lib/validation/errors";
import { buildLeadValuesFromConfig } from "@/lib/validation/lead-fields";
import { parseLeadPayload } from "@/lib/validation/requests";

export async function captureLead(body: unknown, request: Request) {
  const input = parseLeadPayload(body);

  await assertLeadRateLimits(request, input.botId);
  await assertAllowedDomain(request, input.botId, input.pageUrl);

  const supabase = getSupabaseAdmin();
  const widgetSettings = await ensureWidgetSettingsForBot(supabase, input.botId);

  if (!widgetSettings.leadFormEnabled) {
    throw new ApiValidationError(
      "LEAD_FORM_DISABLED",
      "This chatbot does not collect visitor details.",
      400,
    );
  }

  const existingLead = await getLeadBySession(input.botId, input.sessionId);

  if (existingLead) {
    return {
      lead: existingLead,
      created: false,
    };
  }

  const leadValues = buildLeadValuesFromConfig(widgetSettings.leadFields, {
    name: input.name,
    phone: input.phone,
    email: input.email,
    customFields: input.customFields,
  });

  const lead = await createLead({
    botId: input.botId,
    name: leadValues.name,
    phone: leadValues.phone,
    email: leadValues.email,
    customFields: leadValues.customFields,
    sessionId: input.sessionId,
    pageUrl: input.pageUrl,
  });

  await incrementLeadCount(input.botId);

  return {
    lead,
    created: true,
  };
}

export async function requireLead(botId: string, sessionId: string) {
  const supabase = getSupabaseAdmin();
  const widgetSettings = await ensureWidgetSettingsForBot(supabase, botId);

  if (!widgetSettings.leadFormEnabled) {
    return null;
  }

  const lead = await getLeadBySession(botId, sessionId);

  if (!lead) {
    throw new ApiValidationError(
      "LEAD_REQUIRED",
      "Please share your details before sending a message.",
      400,
    );
  }

  return lead;
}
