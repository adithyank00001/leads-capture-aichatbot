import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { twentyFourHoursAgoIso } from "@/lib/location-leads/time";
import type { Database } from "@/lib/supabase/admin";

type Client = SupabaseClient<Database>;

export async function listRecentMapsSearches(
  supabase: Client,
  customerId: string,
) {
  const { data, error } = await supabase
    .from("maps_searches")
    .select(
      "id, keyword, country, state, city, location_name, depth, credits_charged, status, results_count, error_message, created_at, completed_at",
    )
    .eq("customer_id", customerId)
    .gt("created_at", twentyFourHoursAgoIso())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getMapsSearchById(
  supabase: Client,
  customerId: string,
  searchId: string,
) {
  const { data, error } = await supabase
    .from("maps_searches")
    .select(
      "id, customer_id, keyword, country, state, city, location_name, depth, credits_charged, status, dataforseo_task_id, results_count, error_message, created_at, updated_at, completed_at",
    )
    .eq("id", searchId)
    .eq("customer_id", customerId)
    .gt("created_at", twentyFourHoursAgoIso())
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function listLeadsForSearch(
  supabase: Client,
  customerId: string,
  searchId: string,
) {
  const search = await getMapsSearchById(supabase, customerId, searchId);
  if (!search) {
    return null;
  }

  const { data, error } = await supabase
    .from("maps_leads")
    .select(
      "id, search_id, place_id, title, category, phone, address, website, rating_value, rating_votes, latitude, longitude, cid, is_claimed, snippet, is_saved, rank_absolute, created_at",
    )
    .eq("search_id", searchId)
    .eq("customer_id", customerId)
    .order("rank_absolute", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return { search, leads: data ?? [] };
}

export async function listSavedMapsLeads(
  supabase: Client,
  customerId: string,
) {
  const cutoff = twentyFourHoursAgoIso();

  const { data, error } = await supabase
    .from("maps_leads")
    .select(
      "id, search_id, place_id, title, category, phone, address, website, rating_value, rating_votes, latitude, longitude, cid, is_claimed, snippet, is_saved, rank_absolute, created_at, maps_searches!inner(created_at, keyword, location_name, status)",
    )
    .eq("customer_id", customerId)
    .eq("is_saved", true)
    .gt("maps_searches.created_at", cutoff)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
