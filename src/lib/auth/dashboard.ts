import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiValidationError } from "@/lib/validation/errors";

export const requireAuthUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiValidationError("UNAUTHORIZED", "Please log in to continue.", 401);
  }

  return { supabase, user };
});
