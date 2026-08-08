import { apiError, apiSuccess } from "@/lib/api-response";
import { requireDashboardApiUser } from "@/lib/auth/dashboard-session";
import { getBotByCustomerId } from "@/lib/db/bots";
import { getCustomerByUserId } from "@/lib/db/customers";
import { deleteLeadByIdForBot } from "@/lib/db/leads";
import { handleRouteError } from "@/lib/api/request";
import { ApiValidationError } from "@/lib/validation/errors";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { leadId } = await context.params;
    const trimmedLeadId = leadId?.trim();

    if (!trimmedLeadId) {
      throw new ApiValidationError("MISSING_LEAD_ID", "Lead id is required.");
    }

    const { supabase, user } = await requireDashboardApiUser();
    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      throw new ApiValidationError("LEAD_NOT_FOUND", "Lead not found.", 404);
    }

    const bot = await getBotByCustomerId(supabase, customer.id);

    if (!bot) {
      throw new ApiValidationError("LEAD_NOT_FOUND", "Lead not found.", 404);
    }

    const deletedLead = await deleteLeadByIdForBot(
      supabase,
      bot.bot_id,
      trimmedLeadId,
    );

    if (!deletedLead) {
      throw new ApiValidationError("LEAD_NOT_FOUND", "Lead not found.", 404);
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
