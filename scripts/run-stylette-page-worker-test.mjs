/**
 * Fallback E2E: seed Stylette pages in DB + fan-out to page worker (bypasses master).
 * Use when testing page worker + finalize without master discover.
 */
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
const pageWorkerUrl = env.GAS_INGESTION_WEB_APP_URL;

const STYLETTE_PAGES = [
  "https://stylette.in/",
  "https://stylette.in/about-us",
  "https://stylette.in/services",
  "https://stylette.in/gents",
  "https://stylette.in/ladies",
  "https://stylette.in/contact",
  "https://stylette.in/offers",
];

function normalizePathKey(url) {
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  let path = parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/$/, "");
  return host + path;
}

function signProcessPage(pageId) {
  const exp = Math.floor(Date.now() / 1000) + 600;
  const body = {
    action: "process_page",
    sourceId,
    botId,
    websiteUrl,
    pageId,
    exp,
  };
  body.sig = createHmac("sha256", env.GAS_INGESTION_HMAC_SECRET)
    .update(JSON.stringify(body))
    .digest("hex");
  return body;
}

console.log("Clearing website RAG data...");
await supabase.from("bot_website_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
await supabase.from("bot_website_pages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
await supabase.from("bot_website_build_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
await supabase.from("bot_website_sources").delete().neq("id", "00000000-0000-0000-0000-000000000000");

console.log("Creating source + pages...");
await supabase.from("bot_website_sources").upsert({
  id: sourceId,
  bot_id: botId,
  website_url: websiteUrl,
  status: "processing",
  total_pages: STYLETTE_PAGES.length,
  completed_pages: 0,
  failed_pages: 0,
  current_page_index: 0,
  selected_urls: { urls: STYLETTE_PAGES, normalized_urls: STYLETTE_PAGES.map(normalizePathKey) },
  updated_at: new Date().toISOString(),
});

const pageRows = STYLETTE_PAGES.map((url, index) => ({
  source_id: sourceId,
  bot_id: botId,
  page_url: url,
  normalized_url: normalizePathKey(url),
  page_title: "",
  sort_order: index,
  status: "pending",
}));

const { data: insertedPages, error: pageError } = await supabase
  .from("bot_website_pages")
  .upsert(pageRows, { onConflict: "source_id,normalized_url" })
  .select("id, page_url");

if (pageError) {
  throw pageError;
}

console.log(`Fanning out ${insertedPages.length} page worker requests...`);
const results = await Promise.all(
  insertedPages.map(async (page) => {
    const response = await fetch(pageWorkerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signProcessPage(page.id)),
    });
    const text = await response.text();
    console.log(`  ${page.page_url} → ${response.status} ${text.slice(0, 120)}`);
    return { page, status: response.status, text };
  }),
);

const startWall = Date.now();
let finalSource = null;

for (let poll = 1; poll <= 30; poll += 1) {
  await new Promise((resolve) => setTimeout(resolve, 10000));
  const { data, error } = await supabase
    .from("bot_website_sources")
    .select("*")
    .eq("id", sourceId)
    .single();

  if (error) {
    throw error;
  }

  console.log(
    `Poll ${poll} status=${data.status} completed=${data.completed_pages}/${data.total_pages} failed=${data.failed_pages}`,
  );

  if (["ready", "partial", "failed"].includes(data.status)) {
    finalSource = data;
    break;
  }
}

const { data: pages } = await supabase
  .from("bot_website_pages")
  .select("page_url, status, error_message")
  .eq("source_id", sourceId)
  .order("sort_order");

const { data: chunkCount } = await supabase.rpc("count_valid_website_chunks", {
  p_bot_id: botId,
});

console.log("\n=== PAGE WORKER TEST RESULT ===");
console.log("Final status:", finalSource?.status ?? "TIMEOUT");
console.log("Wall time:", Math.round((Date.now() - startWall) / 1000), "s");
console.log("Chunks:", chunkCount);
console.log(
  "Pages:",
  (pages ?? []).map((p) => `${p.page_url} [${p.status}]`).join("\n"),
);

process.exit(finalSource && ["ready", "partial"].includes(finalSource.status) ? 0 : 1);
