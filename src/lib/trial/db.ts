import "server-only";

import { randomBytes } from "node:crypto";

import { serverEnv } from "@/lib/env.server";
import {
  TRIAL_TOKEN_BYTES,
  trialExpiresAtIso,
} from "@/lib/trial/constants";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/admin";

export type TrialLinkRow = Database["public"]["Tables"]["trial_links"]["Row"];
export type TrialSearchRow =
  Database["public"]["Tables"]["trial_searches"]["Row"];
export type TrialLeadRow = Database["public"]["Tables"]["trial_leads"]["Row"];

export type TrialPublicLead = {
  title: string | null;
  category: string | null;
  phone: string;
};

export function generateTrialToken(): string {
  return randomBytes(TRIAL_TOKEN_BYTES).toString("base64url");
}

export function buildTrialPublicUrl(token: string): string {
  const origin = serverEnv.appUrl.replace(/\/+$/, "");
  return `${origin}/trial/${encodeURIComponent(token)}`;
}

export async function getTrialLinkByToken(token: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("trial_links")
    .select(
      "id, token, note, status, search_used, trial_started_at, expires_at, created_at, disabled_at",
    )
    .eq("token", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/** Expire in-memory / on-read if past expires_at (cron is backup). */
export async function refreshTrialLinkExpiry(link: TrialLinkRow) {
  if (
    link.status !== "expired" &&
    link.status !== "disabled" &&
    link.expires_at &&
    new Date(link.expires_at).getTime() <= Date.now()
  ) {
    const admin = getSupabaseAdmin();
    await admin
      .from("trial_links")
      .update({ status: "expired" })
      .eq("id", link.id);

    await admin.from("trial_leads").delete().eq("trial_link_id", link.id);
    await admin.from("trial_searches").delete().eq("trial_link_id", link.id);

    return {
      ...link,
      status: "expired" as const,
    };
  }

  return link;
}

export async function getLatestTrialSearch(trialLinkId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("trial_searches")
    .select(
      "id, trial_link_id, keyword, country, state, city, location_name, depth, status, dataforseo_task_id, error_message, results_count, created_at, updated_at, completed_at",
    )
    .eq("trial_link_id", trialLinkId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function listTrialPublicLeads(
  trialLinkId: string,
): Promise<TrialPublicLead[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("trial_leads")
    .select("title, category, phone")
    .eq("trial_link_id", trialLinkId)
    .order("rank_absolute", { ascending: true })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    title: row.title,
    category: row.category,
    phone: row.phone,
  }));
}

export async function createTrialLink(note?: string | null) {
  const admin = getSupabaseAdmin();
  const token = generateTrialToken();
  const { data, error } = await admin
    .from("trial_links")
    .insert({
      token,
      note: note?.trim() || null,
      status: "unused",
    })
    .select(
      "id, token, note, status, search_used, trial_started_at, expires_at, created_at, disabled_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create trial link.");
  }

  return {
    link: data,
    url: buildTrialPublicUrl(data.token),
  };
}

export async function listTrialLinks() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("trial_links")
    .select(
      "id, token, note, status, search_used, trial_started_at, expires_at, created_at, disabled_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((link) => ({
    ...link,
    url: buildTrialPublicUrl(link.token),
  }));
}

export async function disableTrialLink(id: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("trial_links")
    .update({
      status: "disabled",
      disabled_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(
      "id, token, note, status, search_used, trial_started_at, expires_at, created_at, disabled_at",
    )
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Trial link not found.");
  }

  return data;
}

export async function markTrialSearchCompleted(input: {
  trialLinkId: string;
  trialSearchId: string;
  resultsCount: number;
  taskId?: string | null;
}) {
  const admin = getSupabaseAdmin();
  const startedAt = new Date();
  const expiresAt = trialExpiresAtIso(startedAt);

  const { error: searchError } = await admin
    .from("trial_searches")
    .update({
      status: "completed",
      results_count: input.resultsCount,
      completed_at: startedAt.toISOString(),
      error_message: null,
      dataforseo_task_id: input.taskId ?? null,
    })
    .eq("id", input.trialSearchId);

  if (searchError) {
    throw new Error(searchError.message);
  }

  const { error: linkError } = await admin
    .from("trial_links")
    .update({
      status: "active",
      search_used: true,
      trial_started_at: startedAt.toISOString(),
      expires_at: expiresAt,
    })
    .eq("id", input.trialLinkId);

  if (linkError) {
    throw new Error(linkError.message);
  }

  return { expiresAt };
}

export async function markTrialSearchFailed(input: {
  trialSearchId: string;
  message: string;
}) {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("trial_searches")
    .update({
      status: "failed",
      error_message: input.message,
    })
    .eq("id", input.trialSearchId);

  if (error) {
    throw new Error(error.message);
  }
}

export function canStartTrialSearch(link: TrialLinkRow): {
  ok: boolean;
  code?: string;
  message?: string;
} {
  if (link.status === "disabled") {
    return {
      ok: false,
      code: "TRIAL_DISABLED",
      message: "This trial link was disabled.",
    };
  }
  if (link.status === "expired") {
    return {
      ok: false,
      code: "TRIAL_EXPIRED",
      message: "This trial link has expired.",
    };
  }
  if (link.search_used) {
    return {
      ok: false,
      code: "TRIAL_SEARCH_USED",
      message:
        "This trial already used its one search. You can view results until the link expires.",
    };
  }
  return { ok: true };
}
