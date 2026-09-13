import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * If this email is on the manual Product 1 allowlist, grant has_lifetime_access.
 * Safe to call on every login / customer create.
 */
export async function syncLifetimeAccessForEmail(input: {
  userId: string;
  email: string;
}): Promise<boolean> {
  const email = normalizeEmail(input.email);
  if (!email) {
    return false;
  }

  const admin = getSupabaseAdmin();

  const { data: allow, error: allowError } = await admin
    .from("lifetime_access_emails")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (allowError) {
    throw new Error(allowError.message);
  }

  if (!allow) {
    return false;
  }

  const { error: updateError } = await admin
    .from("customers")
    .update({
      has_lifetime_access: true,
      lifetime_access_granted_at: new Date().toISOString(),
    })
    .eq("user_id", input.userId)
    .eq("has_lifetime_access", false);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return true;
}
