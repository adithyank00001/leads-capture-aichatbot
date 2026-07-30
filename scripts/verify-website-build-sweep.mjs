/**
 * Read-only manual check for the website build sweep / finalize setup.
 *
 * Safe to run anytime:
 * - Only reads your website build tables
 * - RPC smoke tests use a fake source id (no real rows touched)
 * - Does NOT start builds, retries, or cron jobs manually
 *
 * Run:
 *   npm run test:website-sweep
 *
 * Optional env (from .env.local):
 *   VERIFY_BOT_ID=bot_d87147f9a596
 *   VERIFY_SOURCE_ID=1cb711df-22dd-473f-918e-cd27e565253a
 */

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const verifyBotId = process.env.VERIFY_BOT_ID ?? "bot_d87147f9a596";
const verifySourceId =
  process.env.VERIFY_SOURCE_ID ?? "1cb711df-22dd-473f-918e-cd27e565253a";
const fakeSourceId = "00000000-0000-0000-0000-000000000000";

function pass(name, detail = "") {
  console.log(`PASS  ${name}${detail ? ` -> ${detail}` : ""}`);
}

function fail(name, detail) {
  console.log(`FAIL  ${name} -> ${detail}`);
  process.exitCode = 1;
}

function skip(name, detail) {
  console.log(`SKIP  ${name} -> ${detail}`);
}

async function run() {
  console.log("Website build sweep verification (read-only)\n");

  if (!supabaseUrl || !serviceRoleKey) {
    fail(
      "environment",
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with: npm run test:website-sweep",
    );
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: failPendingData, error: failPendingError } = await supabase.rpc(
    "fail_stale_pending_pages",
    { p_source_id: fakeSourceId, p_stale_minutes: 10 },
  );

  if (failPendingError) {
    fail("fail_stale_pending_pages RPC exists", failPendingError.message);
  } else if (failPendingData?.failed === 0) {
    pass(
      "fail_stale_pending_pages RPC responds safely",
      "fake source id changed 0 pages",
    );
  } else {
    fail(
      "fail_stale_pending_pages RPC responds safely",
      JSON.stringify(failPendingData),
    );
  }

  const { data: sweepData, error: sweepError } = await supabase.rpc(
    "sweep_stuck_website_builds",
    { p_stale_minutes: 10 },
  );

  if (sweepError) {
    fail("sweep_stuck_website_builds RPC exists", sweepError.message);
  } else if (
    typeof sweepData?.sources_checked === "number" &&
    Array.isArray(sweepData?.finalized)
  ) {
    pass(
      "sweep_stuck_website_builds RPC responds",
      `${sweepData.sources_checked} processing source(s) checked, ${sweepData.finalized.length} finalized`,
    );

    if (sweepData.sources_checked > 0 && sweepData.finalized.length > 0) {
      console.log(
        "INFO  Sweep finalized stuck source(s) during this check. That is expected if a build was stuck in processing.",
      );
    }
  } else {
    fail("sweep_stuck_website_builds RPC responds", JSON.stringify(sweepData));
  }

  const { count: processingCount, error: processingError } = await supabase
    .from("bot_website_sources")
    .select("id", { count: "exact", head: true })
    .eq("status", "processing");

  if (processingError) {
    fail("processing source count", processingError.message);
  } else if ((processingCount ?? 0) === 0) {
    pass("no sources stuck in processing", "count = 0");
  } else {
    console.log(
      `WARN  ${processingCount} source(s) still processing. Cron should finalize stale pages within ~10-15 minutes.`,
    );
  }

  const { data: source, error: sourceError } = await supabase
    .from("bot_website_sources")
    .select(
      "id, bot_id, status, failed_pages, completed_pages, refresh_error_message",
    )
    .eq("id", verifySourceId)
    .maybeSingle();

  if (sourceError) {
    fail("known source lookup", sourceError.message);
  } else if (!source) {
    skip(
      "known source state",
      `source ${verifySourceId} not found (set VERIFY_SOURCE_ID to test your bot)`,
    );
  } else if (source.bot_id !== verifyBotId) {
    skip(
      "known source state",
      `source belongs to ${source.bot_id}, not ${verifyBotId}`,
    );
  } else if (source.status === "partial") {
    pass(
      "known bot source finalized",
      `status=partial, completed=${source.completed_pages}, failed=${source.failed_pages}`,
    );
  } else if (source.status === "ready") {
    pass("known bot source finalized", "status=ready");
  } else if (source.status === "processing" || source.status === "discovering") {
    fail(
      "known bot source finalized",
      `still ${source.status} — wait for cron or check GAS workers`,
    );
  } else {
    console.log(
      `INFO  known source status is ${source.status} (not partial/ready). Check manually if that is expected.`,
    );
  }

  const { data: pages, error: pagesError } = await supabase
    .from("bot_website_pages")
    .select("id, page_url, status, error_message")
    .eq("source_id", verifySourceId);

  if (pagesError) {
    fail("known source pages", pagesError.message);
  } else {
    const failedPages = (pages ?? []).filter((page) => page.status === "failed");
    const pendingPages = (pages ?? []).filter((page) => page.status === "pending");
    const processingPages = (pages ?? []).filter(
      (page) => page.status === "processing",
    );

    if (pendingPages.length > 0 || processingPages.length > 0) {
      fail(
        "no stuck pages on known source",
        `pending=${pendingPages.length}, processing=${processingPages.length}`,
      );
    } else {
      pass(
        "no stuck pages on known source",
        `failed=${failedPages.length}, total=${pages?.length ?? 0}`,
      );
    }

    const modularKitchen = failedPages.find((page) =>
      page.page_url?.includes("modular-kitchen"),
    );

    if (modularKitchen) {
      pass(
        "failed page ready for Retry button",
        modularKitchen.page_url,
      );
    } else if (failedPages.length > 0) {
      pass(
        "failed page(s) ready for Retry button",
        `${failedPages.length} failed page(s)`,
      );
    } else if (source?.status === "ready") {
      pass("failed page check", "no failed pages (build is ready)");
    } else {
      skip(
        "failed page ready for Retry button",
        "no failed pages on this source right now",
      );
    }

    if (source && source.failed_pages !== failedPages.length) {
      fail(
        "failed_pages counter matches rows",
        `source says ${source.failed_pages}, table has ${failedPages.length}`,
      );
    } else if (source) {
      pass(
        "failed_pages counter matches rows",
        String(source.failed_pages ?? 0),
      );
    }
  }

  console.log("\nFor cron + function existence checks, run the SQL file in Supabase:");
  console.log("  scripts/verify-website-build-sweep.sql");
  console.log("\nVerification finished.");
}

run().catch((error) => {
  fail("verification runner", error instanceof Error ? error.message : String(error));
});
