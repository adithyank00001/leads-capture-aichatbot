import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiValidationError } from "@/lib/validation/errors";

export async function requireAuthUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiValidationError("UNAUTHORIZED", "Please log in to continue.", 401);
  }

  return { supabase, user };
}
