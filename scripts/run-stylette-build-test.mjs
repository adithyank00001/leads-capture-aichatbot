import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      const key = line.slice(0, index);
      let value = line.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return [key, value];
    }),
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const sourceId = "1cb711df-22dd-473f-918e-cd27e565253a";
const botId = "bot_d87147f9a596";
const websiteUrl = "https://stylette.in/";

const masterUrl = env.GAS_MASTER_WEB_APP_URL || env.GAS_INGESTION_WEB_APP_URL;

const startWall = Date.now();
console.log("Resetting source to discovering...");

await supabase.from("bot_website_sources").upsert(
  {
    id: sourceId,
    bot_id: botId,
    website_url: websiteUrl,
    status: "discovering",
    total_pages: 0,
    completed_pages: 0,
    failed_pages: 0,
    current_page_index: 0,
    error_message: null,
    refresh_error_message: null,
    selected_urls: null,
    updated_at: new Date().toISOString(),
  },
  { onConflict: "bot_id" },
);

const exp = Math.floor(Date.now() / 1000) + 600;
const body = { action: "discover", sourceId, botId, websiteUrl, exp };
body.sig = createHmac("sha256", env.GAS_INGESTION_HMAC_SECRET)
  .update(JSON.stringify(body))
  .digest("hex");

console.log("Calling master GAS at", masterUrl);
const gasRes = await fetch(masterUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const gasText = await gasRes.text();
console.log("GAS", gasRes.status, gasText);

const triggerAcceptedAt = Date.now();
let finalSource = null;

for (let poll = 1; poll <= 40; poll += 1) {
  await new Promise((resolve) => setTimeout(resolve, 15000));
  const { data, error } = await supabase
    .from("bot_website_sources")
    .select("*")
    .eq("id", sourceId)
    .single();

  if (error) {
    throw error;
  }

  const elapsed = Math.round((Date.now() - triggerAcceptedAt) / 1000);
  console.log(
    `Poll ${poll} ${elapsed}s status=${data.status} pages=${data.completed_pages}/${data.total_pages} failed=${data.failed_pages}`,
  );

  if (
    data.status === "ready" ||
    data.status === "partial" ||
    data.status === "failed"
  ) {
    finalSource = data;
    break;
  }
}

if (!finalSource) {
  console.error("TIMEOUT after", Math.round((Date.now() - startWall) / 1000), "seconds");
  process.exit(1);
}

const { data: pages } = await supabase
  .from("bot_website_pages")
  .select("id, page_url, status, error_message, sort_order")
  .eq("source_id", sourceId)
  .order("sort_order");

const { data: logs } = await supabase
  .from("bot_website_build_logs")
  .select("created_at, step, status, message")
  .gte("created_at", new Date(triggerAcceptedAt - 5000).toISOString())
  .order("created_at");

const { data: chunkCount } = await supabase.rpc("count_valid_website_chunks", {
  p_bot_id: botId,
});

console.log("\n=== RESULT ===");
console.log("Final status:", finalSource.status);
console.log(
  "Total wall time (trigger to finish):",
  Math.round((Date.now() - startWall) / 1000),
  "seconds",
);
console.log(
  "Pages in DB:",
  (pages ?? []).map((page) => `${page.page_url} [${page.status}]`).join("\n"),
);
console.log("Chunk count:", chunkCount);

const failedPage = (pages ?? []).find((page) => page.status === "failed");
if (failedPage) {
  console.log("\nFailed page available for manual retry test:", failedPage.page_url);
}

const keySteps = new Set([
  "config",
  "firecrawl",
  "discover",
  "fanout",
  "process_page",
  "finalize",
  "master_trigger",
]);

console.log("\n=== KEY LOGS ===");
for (const log of logs ?? []) {
  if (!keySteps.has(log.step)) {
    continue;
  }
  console.log(log.created_at, log.step, log.status, (log.message ?? "").slice(0, 400));
}
