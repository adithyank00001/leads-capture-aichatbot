import { gunzipSync } from "node:zlib";

import { NextResponse, type NextRequest } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  markTrialSearchCompleted,
  markTrialSearchFailed,
} from "@/lib/trial/db";
import { mapDataForSeoItemsToTrialLeads } from "@/lib/trial/map-lead-fields";

type PostbackPayload = {
  tasks?: Array<{
    id?: string;
    status_code?: number;
    status_message?: string;
    result?: Array<{
      items?: unknown[];
    }> | null;
  }>;
};

async function readPostbackJson(request: NextRequest): Promise<PostbackPayload> {
  const encoding = (request.headers.get("content-encoding") ?? "").toLowerCase();
  const buffer = Buffer.from(await request.arrayBuffer());

  const looksGzip =
    encoding.includes("gzip") ||
    (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b);

  const raw = looksGzip ? gunzipSync(buffer) : buffer;
  const text = raw.toString("utf8");

  try {
    return JSON.parse(text) as PostbackPayload;
  } catch {
    throw new Error("Invalid JSON in postback body.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get("secret");
    const trialSearchId = request.nextUrl.searchParams.get("trial_search_id");

    if (
      !serverEnv.dataforseoPostbackSecret ||
      !secret ||
      secret !== serverEnv.dataforseoPostbackSecret
    ) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid secret." } },
        { status: 401 },
      );
    }

    if (!trialSearchId) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "MISSING_TRIAL_SEARCH_ID",
            message: "trial_search_id is required.",
          },
        },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    const { data: search, error: searchError } = await admin
      .from("trial_searches")
      .select("id, trial_link_id, status")
      .eq("id", trialSearchId)
      .maybeSingle();

    if (searchError) {
      throw new Error(searchError.message);
    }

    if (!search) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Search not found." } },
        { status: 404 },
      );
    }

    if (search.status === "completed") {
      return NextResponse.json({ ok: true, data: { status: "completed" } });
    }

    const payload = await readPostbackJson(request);
    const task = payload.tasks?.[0];
    const taskStatus = task?.status_code ?? 0;

    if (taskStatus >= 40000) {
      await markTrialSearchFailed({
        trialSearchId: search.id,
        message:
          task?.status_message ?? `Provider task failed (${taskStatus}).`,
      });

      return NextResponse.json({ ok: true, data: { status: "failed" } });
    }

    const items = task?.result?.[0]?.items ?? [];
    const leads = mapDataForSeoItemsToTrialLeads({
      trialLinkId: search.trial_link_id,
      trialSearchId: search.id,
      items,
    });

    await admin.from("trial_leads").delete().eq("trial_search_id", search.id);

    if (leads.length > 0) {
      const { error: insertError } = await admin.from("trial_leads").insert(leads);
      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    await markTrialSearchCompleted({
      trialLinkId: search.trial_link_id,
      trialSearchId: search.id,
      resultsCount: leads.length,
      taskId: task?.id ?? null,
    });

    return NextResponse.json({
      ok: true,
      data: { status: "completed", resultsCount: leads.length },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        route: "webhooks/dataforseo/maps-trial",
        message: error instanceof Error ? error.message : "Postback failed.",
        timestamp: new Date().toISOString(),
      }),
    );

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "POSTBACK_FAILED",
          message: "Could not process postback.",
        },
      },
      { status: 500 },
    );
  }
}
