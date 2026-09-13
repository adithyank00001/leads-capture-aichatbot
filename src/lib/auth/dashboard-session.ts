import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/admin";
import { claimPendingLifetimePurchase } from "@/lib/billing/claim-pending-purchase";
import { syncMapsAccessForEmail } from "@/lib/billing/sync-maps-access";
import { ensureCustomerOnboarding } from "@/lib/dashboard/onboarding";
import { ApiValidationError } from "@/lib/validation/errors";
import type { WebsiteBuildStatus } from "@/lib/dashboard/setup-status";

type Client = SupabaseClient<Database>;

type CustomerAccessRow = {
  id: string;
  has_lifetime_access: boolean;
  has_maps_access: boolean;
  profile_completed_at: string | null;
  full_name: string | null;
  mobile_phone: string | null;
};

async function loadCustomerAccess(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, has_lifetime_access, has_maps_access, profile_completed_at, full_name, mobile_phone",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as CustomerAccessRow | null;
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
  has_maps_access: boolean;
  profile_completed_at: string | null;
  bots: BotBundle | null;
};

const CUSTOMER_BUNDLE_SELECT = `
  id,
  has_lifetime_access,
  has_maps_access,
  profile_completed_at,
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

async function refreshAccessEntitlements(input: {
  supabase: Client;
  userId: string;
  email: string | null | undefined;
}) {
  if (!input.email) {
    return loadCustomerAccess(input.supabase, input.userId);
  }

  let customer = await loadCustomerAccess(input.supabase, input.userId);

  if (!customer?.has_lifetime_access) {
    await claimPendingLifetimePurchase({
      userId: input.userId,
      email: input.email,
    });
  }

  if (!customer?.has_maps_access) {
    await syncMapsAccessForEmail({
      userId: input.userId,
      email: input.email,
    });
  }

  return loadCustomerAccess(input.supabase, input.userId);
}

function toAccess(customer: CustomerAccessRow | null) {
  return {
    hasLifetimeAccess: customer?.has_lifetime_access ?? false,
    hasMapsAccess: customer?.has_maps_access ?? false,
    profileCompleted: Boolean(customer?.profile_completed_at),
    customerId: customer?.id ?? null,
    fullName: customer?.full_name ?? null,
    mobilePhone: customer?.mobile_phone ?? null,
  };
}

export const getDashboardAuth = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const user = await readSessionUser(supabase);

  if (!user) {
    return null;
  }

  if (user.email) {
    await ensureCustomerOnboarding(supabase as Client, {
      userId: user.id,
      email: user.email,
    });
  }

  const customer = await refreshAccessEntitlements({
    supabase: supabase as Client,
    userId: user.id,
    email: user.email,
  });

  return {
    supabase: supabase as Client,
    user,
    access: toAccess(customer),
  };
});

export const getDashboardBundle = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const user = await readSessionUser(supabase);

  if (!user) {
    return null;
  }

  await refreshAccessEntitlements({
    supabase: supabase as Client,
    userId: user.id,
    email: user.email,
  });

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
      hasMapsAccess: customer.has_maps_access,
      profileCompleted: Boolean(customer.profile_completed_at),
      customerId: customer.id,
    },
  };
});

function redirectIfProfileIncomplete(profileCompleted: boolean) {
  if (!profileCompleted) {
    redirect("/complete-profile");
  }
}

/** Any logged-in user with Product 1 and/or Product 2 access (after profile). */
export async function requireAnyProductAuth() {
  const auth = await getDashboardAuth();

  if (!auth) {
    redirect("/login");
  }

  redirectIfProfileIncomplete(auth.access.profileCompleted);

  if (!auth.access.hasLifetimeAccess && !auth.access.hasMapsAccess) {
    redirect("/checkout");
  }

  return auth;
}

/** Product 1 (AI Sales Agent) only. */
export async function requireDashboardAuth() {
  const auth = await getDashboardAuth();

  if (!auth) {
    redirect("/login");
  }

  redirectIfProfileIncomplete(auth.access.profileCompleted);

  if (!auth.access.hasLifetimeAccess) {
    redirect(auth.access.hasMapsAccess ? "/products" : "/checkout");
  }

  return auth;
}

export async function requireDashboardBundle() {
  const bundle = await getDashboardBundle();

  if (!bundle) {
    redirect("/login");
  }

  redirectIfProfileIncomplete(bundle.access.profileCompleted);

  if (!bundle.access.hasLifetimeAccess) {
    redirect(bundle.access.hasMapsAccess ? "/products" : "/checkout");
  }

  return bundle;
}

export async function requireDashboardApiUser() {
  const auth = await getDashboardAuth();

  if (!auth) {
    throw new ApiValidationError("UNAUTHORIZED", "Please log in to continue.", 401);
  }

  if (!auth.access.profileCompleted) {
    throw new ApiValidationError(
      "PROFILE_REQUIRED",
      "Complete your profile to continue.",
      403,
    );
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

/** Product 2 (Location Leads) pages. */
export async function requireMapsAuth() {
  const auth = await getDashboardAuth();

  if (!auth) {
    redirect("/login");
  }

  redirectIfProfileIncomplete(auth.access.profileCompleted);

  if (!auth.access.hasMapsAccess) {
    redirect(auth.access.hasLifetimeAccess ? "/products" : "/checkout");
  }

  return auth;
}

export async function requireMapsApiUser() {
  const auth = await getDashboardAuth();

  if (!auth) {
    throw new ApiValidationError("UNAUTHORIZED", "Please log in to continue.", 401);
  }

  if (!auth.access.profileCompleted) {
    throw new ApiValidationError(
      "PROFILE_REQUIRED",
      "Complete your profile to continue.",
      403,
    );
  }

  if (!auth.access.hasMapsAccess) {
    throw new ApiValidationError(
      "MAPS_ACCESS_REQUIRED",
      "You do not have access to Location B2B Leads yet.",
      403,
    );
  }

  return auth;
}

/** Logged in only — used by complete-profile. */
export async function requireLoggedInAuth() {
  const auth = await getDashboardAuth();
  if (!auth) {
    redirect("/login");
  }
  return auth;
}

export const getDashboardSession = getDashboardAuth;

export async function requireDashboardSession() {
  return requireDashboardAuth();
}
