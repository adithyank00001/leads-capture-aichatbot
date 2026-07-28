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

const { data: rows, error } = await supabase
  .from("bot_website_chunks")
  .select(
    "heading, chunk_content, chunk_order, source_url, bot_website_pages(page_url, sort_order)",
  )
  .eq("source_id", sourceId);

if (error) {
  throw error;
}

const sorted = (rows ?? []).sort((a, b) => {
  const aOrder = a.bot_website_pages?.sort_order ?? 0;
  const bOrder = b.bot_website_pages?.sort_order ?? 0;
  if (aOrder !== bOrder) {
    return aOrder - bOrder;
  }
  return a.chunk_order - b.chunk_order;
});

const payload = sorted.map((row, index) => ({
  id: index + 1,
  page: row.bot_website_pages?.page_url || row.source_url,
  heading: row.heading,
  content: row.chunk_content.slice(0, 500),
}));

const prompt = [
  "You are reviewing stored chatbot knowledge sections.",
  "For EACH section below, output search_aliases: 3-10 short phrases customers might use when asking about the SAME information.",
  "Same meaning only — not broader or different terms.",
  "",
  'Return strict JSON only:',
  '{"sections":[{"id":1,"heading":"...","search_aliases":["..."]}]}',
  "",
  "Sections:",
  JSON.stringify(payload, null, 2),
].join("\n");

const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: env.OPENROUTER_PAGE_CLEANUP_MODEL || "deepseek/deepseek-v4-flash",
    messages: [
      { role: "system", content: "Return valid JSON only." },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
  }),
});

const json = await response.json();
let text = json.choices?.[0]?.message?.content ?? "";
text = text.trim().replace(/```json/gi, "").replace(/```/g, "").trim();
const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? text);

let currentPage = "";
let total = 0;

console.log(
  "NOTE: search_aliases are NOT saved in the database. Listed below from saved section text (same rules as build).\n",
);

for (const item of parsed.sections ?? []) {
  const source = payload.find((row) => row.id === item.id);
  const page = source?.page ?? "";

  if (page !== currentPage) {
    currentPage = page;
    console.log(`\n${"=".repeat(70)}`);
    console.log(`PAGE: ${page}`);
    console.log("=".repeat(70));
  }

  const aliases = item.search_aliases ?? [];
  total += aliases.length;
  console.log(`\nSection: ${item.heading || source?.heading}`);
  console.log(`Aliases (${aliases.length}): ${aliases.join(" | ") || "(none)"}`);
}

console.log(`\n${"=".repeat(70)}`);
console.log(`TOTAL ALIASES: ${total}`);
