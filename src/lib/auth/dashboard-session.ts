import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/admin";
import { claimPendingLifetimePurchase } from "@/lib/billing/claim-pending-purchase";
import { ensureCustomerOnboarding } from "@/lib/dashboard/onboarding";
import { ApiValidationError } from "@/lib/validation/errors";
import type { WebsiteBuildStatus } from "@/lib/dashboard/setup-status";

type Client = SupabaseClient<Database>;

async function loadCustomerAccess(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("id, has_lifetime_access")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

type BotBundle = {
  bot_id: string;
  business_name: string;
  monthly_message_limit: number;
  messages_used_this_period: number;
  leads_captured_this_period: number;
  bot_knowledge: {
    description: string;
    location: string;
    services: string;
    pricing_notes: string;
    current_offer: string;
    opening_hours: string;
    contact_method: string;
    extra_notes: string;
  } | null;
  bot_allowed_domains: Array<{ domain: string }> | null;
  bot_website_sources: {
    status: WebsiteBuildStatus;
    completed_pages: number;
  } | null;
  bot_widget_monitors: {
    install_status: "never_seen" | "installed" | "removed";
    first_installed_at: string | null;
    last_seen_at: string | null;
    last_checked_at: string | null;
    next_check_at: string | null;
    completed_at: string | null;
  } | null;
};

type CustomerBundle = {
  id: string;
  has_lifetime_access: boolean;
  bots: BotBundle | null;
};

const CUSTOMER_BUNDLE_SELECT = `
  id,
  has_lifetime_access,
  bots (
    bot_id,
    business_name,
    monthly_message_limit,
    messages_used_this_period,
    leads_captured_this_period,
    bot_knowledge (
      description,
      location,
      services,
      pricing_notes,
      current_offer,
      opening_hours,
      contact_method,
      extra_notes
    ),
    bot_allowed_domains (domain),
    bot_website_sources (status, completed_pages),
    bot_widget_monitors (
      install_status,
      first_installed_at,
      last_seen_at,
      last_checked_at,
      next_check_at,
      completed_at
    )
  )
`;

async function readSessionUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user ?? null;
}

async function fetchCustomerBundle(
  supabase: Client,
  userId: string,
): Promise<CustomerBundle | null> {
  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_BUNDLE_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as CustomerBundle | null;
}

export const getDashboardAuth = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const user = await readSessionUser(supabase);

  if (!user) {
    return null;
  }

  let customer = await loadCustomerAccess(supabase as Client, user.id);

  if (!customer?.has_lifetime_access && user.email) {
    await claimPendingLifetimePurchase({
      userId: user.id,
      email: user.email,
    });
    customer = await loadCustomerAccess(supabase as Client, user.id);
  }

  return {
    supabase: supabase as Client,
    user,
    access: {
      hasLifetimeAccess: customer?.has_lifetime_access ?? false,
      customerId: customer?.id ?? null,
    },
  };
});

export const getDashboardBundle = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const user = await readSessionUser(supabase);

  if (!user) {
    return null;
  }

  let customer = await fetchCustomerBundle(supabase as Client, user.id);

  if (!customer || !customer.bots) {
    await ensureCustomerOnboarding(supabase as Client, {
      userId: user.id,
      email: user.email ?? "",
    });
    customer = await fetchCustomerBundle(supabase as Client, user.id);
  }

  if (!customer) {
    throw new Error("Could not load customer account.");
  }

  return {
    supabase: supabase as Client,
    user,
    customer,
    access: {
      hasLifetimeAccess: customer.has_lifetime_access,
      customerId: customer.id,
    },
  };
});

export async function requireDashboardAuth() {
  const auth = await getDashboardAuth();

  if (!auth) {
    redirect("/login");
  }

  if (!auth.access.hasLifetimeAccess) {
    redirect("/checkout");
  }

  return auth;
}

export async function requireDashboardBundle() {
  const bundle = await getDashboardBundle();

  if (!bundle) {
    redirect("/login");
  }

  if (!bundle.access.hasLifetimeAccess) {
    redirect("/checkout");
  }

  return bundle;
}

export async function requireDashboardApiUser() {
  const auth = await getDashboardAuth();

  if (!auth) {
    throw new ApiValidationError("UNAUTHORIZED", "Please log in to continue.", 401);
  }

  if (!auth.access.hasLifetimeAccess) {
    throw new ApiValidationError(
      "PAYMENT_REQUIRED",
      "Please purchase lifetime access to continue.",
      402,
    );
  }

  return auth;
}

// Backwards-compatible aliases used by existing imports.
export const getDashboardSession = getDashboardAuth;

export async function requireDashboardSession() {
  return requireDashboardAuth();
}
