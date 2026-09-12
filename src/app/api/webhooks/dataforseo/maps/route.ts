import { gunzipSync } from "node:zlib";

import { NextResponse, type NextRequest } from "next/server";

import { serverEnv } from "@/lib/env.server";
import { mapDataForSeoItemsToLeads } from "@/lib/location-leads/map-lead-fields";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
    const searchId = request.nextUrl.searchParams.get("search_id");

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

    if (!searchId) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "MISSING_SEARCH_ID", message: "search_id is required." },
        },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    const { data: search, error: searchError } = await admin
      .from("maps_searches")
      .select("id, customer_id, status")
      .eq("id", searchId)
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

    // Idempotent: already completed.
    if (search.status === "completed") {
      return NextResponse.json({ ok: true, data: { status: "completed" } });
    }

    const payload = await readPostbackJson(request);
    const task = payload.tasks?.[0];
    const taskStatus = task?.status_code ?? 0;

    if (taskStatus >= 40000) {
      await admin
        .from("maps_searches")
        .update({
          status: "failed",
          error_message:
            task?.status_message ?? `Provider task failed (${taskStatus}).`,
        })
        .eq("id", searchId);

      return NextResponse.json({ ok: true, data: { status: "failed" } });
    }

    const items = task?.result?.[0]?.items ?? [];
    const leads = mapDataForSeoItemsToLeads({
      searchId: search.id,
      customerId: search.customer_id,
      items,
    });

    // Replace any prior partial leads for this search, then insert.
    await admin.from("maps_leads").delete().eq("search_id", search.id);

    if (leads.length > 0) {
      const { error: insertError } = await admin.from("maps_leads").insert(leads);
      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    const { error: completeError } = await admin
      .from("maps_searches")
      .update({
        status: "completed",
        results_count: leads.length,
        completed_at: new Date().toISOString(),
        error_message: null,
        dataforseo_task_id: task?.id ?? null,
      })
      .eq("id", searchId);

    if (completeError) {
      throw new Error(completeError.message);
    }

    return NextResponse.json({
      ok: true,
      data: { status: "completed", resultsCount: leads.length },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        route: "webhooks/dataforseo/maps",
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
