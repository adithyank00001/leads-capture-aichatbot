import { createBrowserClient } from "@supabase/ssr";

import { publicSupabaseConfig } from "@/lib/supabase/config";

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    publicSupabaseConfig.url,
    publicSupabaseConfig.anonKey,
  );
}
