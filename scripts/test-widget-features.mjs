/**
 * Extended widget + lead form tests (custom fields, form disable).
 * Run: node --env-file=.env.local scripts/test-widget-features.mjs
 */
import { createClient } from "@supabase/supabase-js";

const baseUrl = process.env.SMOKE_TEST_BASE_URL ?? "http://localhost:3000";
const botId = process.env.SMOKE_TEST_BOT_ID ?? "test-business-1";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPageUrl = `${baseUrl}/demo-site/index.html`;
const appOrigin = new URL(baseUrl).origin;

const DEFAULT_FIELDS = [
  { id: "name", required: true, label: "Your name" },
  { id: "phone", required: true, label: "Phone number" },
];

function pass(name) {
  console.log(`PASS  ${name}`);
}

function fail(name, detail) {
  console.log(`FAIL  ${name} -> ${detail}`);
  process.exitCode = 1;
}

function sessionId() {
  return `feat-test-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Origin: appOrigin,
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json();
  return { response, body };
}

async function updateSettings(supabase, settings) {
  const { error } = await supabase.from("bot_widget_settings").upsert({
    bot_id: botId,
    header_color: settings.header_color ?? "#075e54",
    accent_color: settings.accent_color ?? "#25d366",
    lead_form_enabled: settings.lead_form_enabled ?? true,
    lead_fields: settings.lead_fields,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

async function getSettings(supabase) {
  const { data } = await supabase
    .from("bot_widget_settings")
    .select("*")
    .eq("bot_id", botId)
    .maybeSingle();
  return data;
}

async function ensureSmokeTestDomains(supabase) {
  const demoHost = new URL(demoPageUrl).hostname.replace(/^www\./, "");
  const desired = [demoHost];
  if (demoHost !== "localhost") {
    desired.push("localhost");
  }

  const { data: existingRows } = await supabase
    .from("bot_allowed_domains")
    .select("domain")
    .eq("bot_id", botId);

  const existing = new Set((existingRows ?? []).map((row) => row.domain));
  const toInsert = desired
    .filter((domain) => !existing.has(domain))
    .map((domain) => ({ bot_id: botId, domain }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("bot_allowed_domains").insert(toInsert);
    if (error) {
      throw new Error(`Could not seed test domains: ${error.message}`);
    }
  }
}

async function run() {
  console.log(`Feature tests against ${baseUrl}\n`);

  if (!supabaseUrl || !serviceRoleKey) {
    fail("env", "Missing Supabase credentials");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await ensureSmokeTestDomains(supabase);

  const original = await getSettings(supabase);

  try {
    // --- Lead form disabled: chat works without lead ---
    await updateSettings(supabase, {
      lead_form_enabled: false,
      lead_fields: DEFAULT_FIELDS,
    });

    const sidNoForm = sessionId();
    const chatNoLead = await api("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({
        botId,
        sessionId: sidNoForm,
        message: "Hello without lead form",
        pageUrl: demoPageUrl,
      }),
    });

    if (chatNoLead.body.ok && chatNoLead.body.data?.reply) {
      pass("chat works when lead form is disabled");
    } else {
      fail("chat without lead form", JSON.stringify(chatNoLead.body));
    }

    const leadWhenDisabled = await api("/api/v1/leads", {
      method: "POST",
      body: JSON.stringify({
        botId,
        sessionId: sessionId(),
        name: "Should Fail",
        phone: "+15550112222",
        pageUrl: demoPageUrl,
      }),
    });

    if (
      !leadWhenDisabled.body.ok &&
      leadWhenDisabled.body.error?.code === "LEAD_FORM_DISABLED"
    ) {
      pass("lead capture rejected when form disabled");
    } else {
      fail("lead when disabled", JSON.stringify(leadWhenDisabled.body));
    }

    // --- Custom field capture ---
    const customId = `custom_${Date.now().toString(36).slice(0, 10)}`;
    await updateSettings(supabase, {
      lead_form_enabled: true,
      lead_fields: [
        ...DEFAULT_FIELDS,
        { id: customId, required: true, label: "City" },
      ],
    });

    const sidCustom = sessionId();
    const customLead = await api("/api/v1/leads", {
      method: "POST",
      body: JSON.stringify({
        botId,
        sessionId: sidCustom,
        name: "Custom Field Test",
        phone: "+15550113333",
        customFields: { [customId]: "Austin" },
        pageUrl: demoPageUrl,
      }),
    });

    if (customLead.body.ok) {
      pass("lead with custom field accepted");
    } else {
      fail("custom field lead", JSON.stringify(customLead.body));
    }

    const { data: leadRow } = await supabase
      .from("chatbot_leads")
      .select("custom_fields")
      .eq("session_id", sidCustom)
      .maybeSingle();

    if (leadRow?.custom_fields?.[customId] === "Austin") {
      pass("custom field stored in database");
    } else {
      fail("custom field in db", JSON.stringify(leadRow));
    }

    // --- Re-enable default settings ---
    await updateSettings(supabase, {
      lead_form_enabled: true,
      lead_fields: DEFAULT_FIELDS,
    });

    const sidDefault = sessionId();
    const defaultLead = await api("/api/v1/leads", {
      method: "POST",
      body: JSON.stringify({
        botId,
        sessionId: sidDefault,
        name: "Default Form",
        phone: "+15550114444",
        pageUrl: demoPageUrl,
      }),
    });

    if (defaultLead.body.ok) {
      pass("default name+phone form still works");
    } else {
      fail("default form", JSON.stringify(defaultLead.body));
    }

    const health = await api("/api/v1/health");
    if (health.body.ok) {
      pass("health check");
    } else {
      fail("health", JSON.stringify(health.body));
    }
  } finally {
    if (original) {
      await updateSettings(supabase, {
        lead_form_enabled: original.lead_form_enabled,
        lead_fields: original.lead_fields,
        header_color: original.header_color,
        accent_color: original.accent_color,
      });
    }
    console.log("\nRestored original widget settings.");
  }

  console.log("\nFeature tests finished.");
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
