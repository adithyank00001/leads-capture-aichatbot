import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      let v = line.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      return [line.slice(0, i), v];
    }),
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const question = "what is your location";

const embedRes = await fetch("https://openrouter.ai/api/v1/embeddings", {
  method: "POST",
  headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ model: env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small", input: question }),
});
const embedding = (await embedRes.json()).data[0].embedding;

const { data } = await supabase.rpc("match_website_chunks", {
  p_bot_id: "bot_d87147f9a596",
  p_query_embedding: `[${embedding.join(",")}]`,
  p_match_threshold: Number(env.RAG_SIMILARITY_THRESHOLD || 0.1),
  p_match_count: 5,
});

console.log(`Top 5 chunks for: ${question}\n`);
for (const row of data ?? []) {
  const hasAddress = /calicut|npk arcade|kallai/i.test(row.chunk_content);
  console.log(`${row.similarity.toFixed(3)} | ${row.heading} | ${hasAddress ? "HAS ADDRESS" : "no address"}`);
  console.log(`  ${row.source_url}`);
}
