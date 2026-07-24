import { createLead, getLeadBySession } from "@/lib/db/leads";
import { ApiValidationError } from "@/lib/validation/errors";
import { parseLeadPayload } from "@/lib/validation/requests";

export async function captureLead(body: unknown) {
  const input = parseLeadPayload(body);
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
