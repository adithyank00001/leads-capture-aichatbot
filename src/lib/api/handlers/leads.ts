import { createLead, getLeadBySession } from "@/lib/db/leads";
import { assertLeadRateLimits } from "@/lib/rate-limit";
import { assertAllowedDomain } from "@/lib/security/domain";
import { incrementLeadCount } from "@/lib/usage/bot-usage";
import { ApiValidationError } from "@/lib/validation/errors";
import { parseLeadPayload } from "@/lib/validation/requests";

export async function captureLead(body: unknown, request: Request) {
  const input = parseLeadPayload(body);

  await assertLeadRateLimits(request, input.botId);
  await assertAllowedDomain(request, input.botId, input.pageUrl);

  if (!input.consentAccepted) {
    throw new ApiValidationError(
      "CONSENT_REQUIRED",
      "Please accept the privacy notice before continuing.",
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

  const lead = await createLead({
    botId: input.botId,
    name: input.name,
    phone: input.phone,
    email: input.email,
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
  const lead = await getLeadBySession(botId, sessionId);

  if (!lead) {
    throw new ApiValidationError(
      "LEAD_REQUIRED",
      "Please submit your name and phone before sending a message.",
      400,
    );
  }

  return lead;
}
