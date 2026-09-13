import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * If this email is on the manual Product 2 allowlist, grant has_maps_access.
 * Safe to call on every login / customer create.
 */
export async function syncMapsAccessForEmail(input: {
  userId: string;
  email: string;
}): Promise<boolean> {
  const email = normalizeEmail(input.email);
  if (!email) {
    return false;
  }

  const admin = getSupabaseAdmin();

  const { data: allow, error: allowError } = await admin
    .from("maps_access_emails")
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
      has_maps_access: true,
      maps_access_granted_at: new Date().toISOString(),
    })
    .eq("user_id", input.userId)
    .eq("has_maps_access", false);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return true;
}
