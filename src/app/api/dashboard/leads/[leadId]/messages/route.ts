import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/dashboard";
import {
  CHAT_RETENTION_DAYS,
  getChatRetentionCutoffDate,
} from "@/lib/chat/retention";
import { getBotByCustomerId } from "@/lib/db/bots";
import { getCustomerByUserId } from "@/lib/db/customers";
import { getLeadByIdForBot } from "@/lib/db/leads";
import { getMessagesBySessionSince } from "@/lib/db/messages";
import { handleRouteError } from "@/lib/api/request";
import { ApiValidationError } from "@/lib/validation/errors";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { leadId } = await context.params;
    const trimmedLeadId = leadId?.trim();

    if (!trimmedLeadId) {
      throw new ApiValidationError("MISSING_LEAD_ID", "Lead id is required.");
    }

    const { supabase, user } = await requireAuthUser();
    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      throw new ApiValidationError("LEAD_NOT_FOUND", "Lead not found.", 404);
    }

    const bot = await getBotByCustomerId(supabase, customer.id);

    if (!bot) {
      throw new ApiValidationError("LEAD_NOT_FOUND", "Lead not found.", 404);
    }

    const lead = await getLeadByIdForBot(supabase, bot.bot_id, trimmedLeadId);

    if (!lead) {
      throw new ApiValidationError("LEAD_NOT_FOUND", "Lead not found.", 404);
    }

    const sinceDate = getChatRetentionCutoffDate();
    const messages = await getMessagesBySessionSince(
      supabase,
      bot.bot_id,
      lead.session_id,
      sinceDate,
    );

    return apiSuccess({
      lead: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        created_at: lead.created_at,
      },
      messages,
      retentionDays: CHAT_RETENTION_DAYS,
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
