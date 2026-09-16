import type { Database } from "@/lib/supabase/admin";
import { TRIAL_VISIBLE_LEADS } from "@/lib/trial/constants";

type TrialLeadInsert = Database["public"]["Tables"]["trial_leads"]["Insert"];

type DataForSeoMapsItem = {
  type?: string;
  rank_absolute?: number | null;
  title?: string | null;
  category?: string | null;
  phone?: string | null;
  place_id?: string | null;
};

function hasPhone(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Map provider items → top N leads that have a phone number.
 * Does not use customers / maps_leads tables.
 */
export function mapDataForSeoItemsToTrialLeads(input: {
  trialLinkId: string;
  trialSearchId: string;
  items: unknown[];
}): TrialLeadInsert[] {
  const candidates: TrialLeadInsert[] = [];
  const seenPlaceIds = new Set<string>();

  for (const raw of input.items) {
    if (!raw || typeof raw !== "object") {
      continue;
    }

    const item = raw as DataForSeoMapsItem;
    if (item.type !== "maps_search") {
      continue;
    }

    if (!hasPhone(item.phone)) {
      continue;
    }

    const placeId =
      typeof item.place_id === "string" && item.place_id.trim()
        ? item.place_id.trim()
        : null;

    if (placeId) {
      if (seenPlaceIds.has(placeId)) {
        continue;
      }
      seenPlaceIds.add(placeId);
    }

    candidates.push({
      trial_link_id: input.trialLinkId,
      trial_search_id: input.trialSearchId,
      place_id: placeId,
      title: item.title ?? null,
      category: item.category ?? null,
      phone: item.phone.trim(),
      rank_absolute:
        typeof item.rank_absolute === "number" ? item.rank_absolute : null,
    });
  }

  candidates.sort((a, b) => {
    const aRank = a.rank_absolute ?? Number.MAX_SAFE_INTEGER;
    const bRank = b.rank_absolute ?? Number.MAX_SAFE_INTEGER;
    return aRank - bRank;
  });

  return candidates.slice(0, TRIAL_VISIBLE_LEADS);
}
