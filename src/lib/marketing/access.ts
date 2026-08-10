import "server-only";

import { getCustomerAccess } from "@/lib/auth/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getHasLifetimeAccessForMarketing() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const access = await getCustomerAccess(supabase, user.id);
  return access.hasLifetimeAccess;
}
