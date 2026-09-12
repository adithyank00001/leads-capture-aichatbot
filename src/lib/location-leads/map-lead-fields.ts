import type { Database, Json } from "@/lib/supabase/admin";

type MapsLeadInsert = Database["public"]["Tables"]["maps_leads"]["Insert"];

type DataForSeoMapsItem = {
  type?: string;
  rank_absolute?: number | null;
  title?: string | null;
  category?: string | null;
  phone?: string | null;
  address?: string | null;
  url?: string | null;
  domain?: string | null;
  place_id?: string | null;
  cid?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_claimed?: boolean | null;
  snippet?: string | null;
  additional_categories?: string[] | null;
  rating?: {
    value?: number | null;
    votes_count?: number | null;
  } | null;
};

function asJson(value: unknown): Json {
  return value as Json;
}

export function mapDataForSeoItemsToLeads(input: {
  searchId: string;
  customerId: string;
  items: unknown[];
}): MapsLeadInsert[] {
  const leads: MapsLeadInsert[] = [];
  const seenPlaceIds = new Set<string>();

  for (const raw of input.items) {
    if (!raw || typeof raw !== "object") {
      continue;
    }

    const item = raw as DataForSeoMapsItem;
    if (item.type !== "maps_search") {
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

    const website =
      (typeof item.url === "string" && item.url.trim()) ||
      (typeof item.domain === "string" && item.domain.trim()
        ? `https://${item.domain.trim()}`
        : null);

    leads.push({
      search_id: input.searchId,
      customer_id: input.customerId,
      place_id: placeId,
      title: item.title ?? null,
      category: item.category ?? null,
      phone: item.phone ?? null,
      address: item.address ?? null,
      website,
      rating_value:
        typeof item.rating?.value === "number" ? item.rating.value : null,
      rating_votes:
        typeof item.rating?.votes_count === "number"
          ? item.rating.votes_count
          : null,
      latitude: typeof item.latitude === "number" ? item.latitude : null,
      longitude: typeof item.longitude === "number" ? item.longitude : null,
      cid: item.cid ?? null,
      is_claimed: typeof item.is_claimed === "boolean" ? item.is_claimed : null,
      snippet: item.snippet ?? null,
      additional_categories: item.additional_categories
        ? asJson(item.additional_categories)
        : null,
      raw_item: asJson(item),
      is_saved: false,
      rank_absolute:
        typeof item.rank_absolute === "number" ? item.rank_absolute : null,
    });
  }

  return leads;
}
