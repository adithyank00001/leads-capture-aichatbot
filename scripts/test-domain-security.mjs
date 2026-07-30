/**
 * Domain security checks against a running app server.
 * Run: npm run test:domain-security
 * Requires: dev server on SMOKE_TEST_BASE_URL (default http://localhost:3000)
 */

const baseUrl = process.env.SMOKE_TEST_BASE_URL ?? "http://localhost:3000";
const botId = process.env.SMOKE_TEST_BOT_ID ?? "test-business-1";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPageUrl = `${baseUrl}/demo-site/index.html`;
const appOrigin = new URL(baseUrl).origin;

function pass(name) {
  console.log(`PASS  ${name}`);
}

function fail(name, detail) {
  console.log(`FAIL  ${name} -> ${detail}`);
  process.exitCode = 1;
}

function sessionId() {
  return `domain-test-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function request(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options;

  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(extraHeaders ?? {}),
    },
  });

  const body = await response.json();
  return { response, body };
}

async function run() {
  console.log(`Domain security tests against ${baseUrl}\n`);

  if (!supabaseUrl || !serviceRoleKey) {
    fail("environment", "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await supabase.from("bot_allowed_domains").delete().eq("bot_id", botId);

  const emptyAllowlist = await request("/api/v1/leads", {
    method: "POST",
    body: JSON.stringify({
      botId,
      sessionId: sessionId(),
      name: "Blocked Visitor",
      phone: "+15550110001",
    }),
  });

  if (
    !emptyAllowlist.body.ok &&
    emptyAllowlist.body.error?.code === "DOMAIN_NOT_CONFIGURED"
  ) {
    pass("empty allowlist blocks public API");
  } else {
    fail("empty allowlist blocks public API", JSON.stringify(emptyAllowlist.body));
  }

  const demoHost = new URL(demoPageUrl).hostname.replace(/^www\./, "");
  await supabase
    .from("bot_allowed_domains")
    .insert([{ bot_id: botId, domain: demoHost }]);

  const fakePageUrlOnly = await request("/api/v1/leads", {
    method: "POST",
    body: JSON.stringify({
      botId,
      sessionId: sessionId(),
      name: "Fake URL Visitor",
      phone: "+15550110002",
      pageUrl: demoPageUrl,
    }),
  });

  if (
    !fakePageUrlOnly.body.ok &&
    fakePageUrlOnly.body.error?.code === "DOMAIN_NOT_ALLOWED"
  ) {
    pass("pageUrl alone cannot bypass domain check");
  } else {
    fail("pageUrl alone cannot bypass domain check", JSON.stringify(fakePageUrlOnly.body));
  }

  const embedSid = sessionId();
  const embedLead = await request("/api/v1/leads", {
    method: "POST",
    headers: { Origin: appOrigin },
    body: JSON.stringify({
      botId,
      sessionId: embedSid,
      name: "Embed Visitor",
      phone: "+15550110003",
      pageUrl: demoPageUrl,
    }),
  });

  if (embedLead.body.ok && embedLead.body.data?.created === true) {
    pass("embed origin with allowed pageUrl works");
  } else {
    fail("embed origin with allowed pageUrl works", JSON.stringify(embedLead.body));
  }

  const previewSid = sessionId();
  const previewLead = await request("/api/v1/leads", {
    method: "POST",
    headers: { Origin: appOrigin },
    body: JSON.stringify({
      botId,
      sessionId: previewSid,
      name: "Preview Visitor",
      phone: "+15550110004",
    }),
  });

  if (previewLead.body.ok && previewLead.body.data?.created === true) {
    pass("direct embed preview without pageUrl works");
  } else {
    fail("direct embed preview without pageUrl works", JSON.stringify(previewLead.body));
  }

  const allowedDomains = await request(
    `/api/v1/embed-allowed-domains?botId=${encodeURIComponent(botId)}`,
  );

  if (
    allowedDomains.body.ok &&
    Array.isArray(allowedDomains.body.data?.domains) &&
    allowedDomains.body.data.domains.length > 0
  ) {
    pass("embed allowed domains endpoint works");
  } else {
    fail("embed allowed domains endpoint works", JSON.stringify(allowedDomains.body));
  }

  await supabase.from("bot_allowed_domains").delete().eq("bot_id", botId);

  console.log("\nDomain security tests finished.");
}

run().catch((error) => {
  fail("domain security runner", error instanceof Error ? error.message : String(error));
});
