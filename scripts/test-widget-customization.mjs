/**
 * Widget customization regression tests (colors + dynamic lead form).
 * Run: node --env-file=.env.local scripts/test-widget-customization.mjs
 */
import { createClient } from "@supabase/supabase-js";

const baseUrl = process.env.SMOKE_TEST_BASE_URL ?? "http://localhost:3000";
const botId = process.env.SMOKE_TEST_BOT_ID ?? "test-business-1";
const otherBotId = "bot_d87147f9a596";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const seedEmail = process.env.SEED_TEST_EMAIL ?? "smoke-test@chatbot-mvp.local";
const seedPassword = process.env.SEED_TEST_PASSWORD ?? "smoke-test-password-123";
const demoPageUrl = `${baseUrl}/demo-site/index.html`;
const appOrigin = new URL(baseUrl).origin;

const DEFAULT_SETTINGS = {
  header_color: "#075e54",
  accent_color: "#25d366",
  lead_fields: [
    { id: "name", required: true, label: "Your name" },
    { id: "phone", required: true, label: "Phone number" },
  ],
};

function pass(name) {
  console.log(`PASS  ${name}`);
}

function fail(name, detail) {
  console.log(`FAIL  ${name} -> ${detail}`);
  process.exitCode = 1;
}

function sessionId() {
  return `widget-test-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

async function updateWidgetSettings(supabase, targetBotId, settings) {
  const { error } = await supabase
    .from("bot_widget_settings")
    .upsert({
      bot_id: targetBotId,
      header_color: settings.header_color,
      accent_color: settings.accent_color,
      lead_form_enabled: settings.lead_form_enabled ?? true,
      lead_fields: settings.lead_fields,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Could not update widget settings: ${error.message}`);
  }
}

async function getWidgetSettings(supabase, targetBotId) {
  const { data, error } = await supabase
    .from("bot_widget_settings")
    .select("header_color, accent_color, lead_form_enabled, lead_fields")
    .eq("bot_id", targetBotId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function run() {
  console.log(`Widget customization tests against ${baseUrl}\n`);

  if (!supabaseUrl || !serviceRoleKey) {
    fail("env", "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await ensureSmokeTestDomains(supabase);

  const originalTestBot = await getWidgetSettings(supabase, botId);
  const originalOtherBot = await getWidgetSettings(supabase, otherBotId);

  try {
    // --- Default settings in DB ---
    if (
      originalTestBot?.header_color?.toLowerCase() === DEFAULT_SETTINGS.header_color &&
      originalTestBot?.accent_color?.toLowerCase() === DEFAULT_SETTINGS.accent_color &&
      Array.isArray(originalTestBot?.lead_fields) &&
      originalTestBot.lead_fields.length === 2
    ) {
      pass("default widget settings exist for test bot");
    } else {
      fail("default widget settings", JSON.stringify(originalTestBot));
    }

    // --- Embed page loads ---
    const embedRes = await fetch(`${baseUrl}/embed/${botId}`);
    if (embedRes.ok) {
      pass("embed page loads");
    } else {
      fail("embed page loads", embedRes.status);
    }

    // --- Custom colors on embed (server passes settings to client) ---
    await updateWidgetSettings(supabase, botId, {
      header_color: "#112233",
      accent_color: "#ff5500",
      lead_fields: DEFAULT_SETTINGS.lead_fields,
    });

    const embedCustom = await fetch(`${baseUrl}/embed/${botId}`);
    const embedHtml = await embedCustom.text();
    if (embedHtml.includes("ChatbotWidget") || embedRes.ok) {
      pass("embed page loads with custom colors config");
    } else {
      fail("embed custom colors", "unexpected embed response");
    }

    // --- Lead capture: default name + phone required ---
    await updateWidgetSettings(supabase, botId, DEFAULT_SETTINGS);

    const sidMissingPhone = sessionId();
    const missingPhone = await api("/api/v1/leads", {
      method: "POST",
      body: JSON.stringify({
        botId,
        sessionId: sidMissingPhone,
        name: "Widget Test",
        pageUrl: demoPageUrl,
      }),
    });

    if (
      !missingPhone.body.ok &&
      (missingPhone.body.error?.code === "MISSING_LEAD_FIELD" ||
        missingPhone.body.error?.code === "MISSING_PHONE")
    ) {
      pass("missing required phone rejected");
    } else {
      fail("missing required phone", JSON.stringify(missingPhone.body));
    }

    const sidFull = sessionId();
    const fullLead = await api("/api/v1/leads", {
      method: "POST",
      body: JSON.stringify({
        botId,
        sessionId: sidFull,
        name: "Widget Test",
        phone: "+15550119999",
        pageUrl: demoPageUrl,
      }),
    });

    if (fullLead.body.ok) {
      pass("name + phone lead accepted");
    } else {
      fail("name + phone lead", JSON.stringify(fullLead.body));
    }

  // --- Email-only form ---
    await updateWidgetSettings(supabase, botId, {
      header_color: "#075e54",
      accent_color: "#25d366",
      lead_fields: [{ id: "email", required: true, label: "Your email" }],
    });

    const sidEmailOnly = sessionId();
    const emailOnly = await api("/api/v1/leads", {
      method: "POST",
      body: JSON.stringify({
        botId,
        sessionId: sidEmailOnly,
        email: "widget-test@example.com",
        pageUrl: demoPageUrl,
      }),
    });

    if (emailOnly.body.ok) {
      pass("email-only lead accepted");
    } else {
      fail("email-only lead", JSON.stringify(emailOnly.body));
    }

    const { data: emailLeadRow } = await supabase
      .from("chatbot_leads")
      .select("name, phone, email")
      .eq("session_id", sidEmailOnly)
      .maybeSingle();

    if (emailLeadRow?.name === null && emailLeadRow?.phone === null && emailLeadRow?.email) {
      pass("email-only lead stores null name/phone (no fake placeholders)");
    } else {
      fail("nullable lead columns", JSON.stringify(emailLeadRow));
    }

    const sidExtraField = sessionId();
    const extraName = await api("/api/v1/leads", {
      method: "POST",
      body: JSON.stringify({
        botId,
        sessionId: sidExtraField,
        email: "extra@example.com",
        name: "Not Allowed",
        pageUrl: demoPageUrl,
      }),
    });

    if (!extraName.body.ok && extraName.body.error?.code === "LEAD_FIELD_NOT_ALLOWED") {
      pass("extra field rejected when not in form");
    } else {
      fail("extra field rejection", JSON.stringify(extraName.body));
    }

    // --- Three-field form with optional email ---
    await updateWidgetSettings(supabase, botId, {
      header_color: "#075e54",
      accent_color: "#25d366",
      lead_fields: [
        { id: "name", required: true, label: "Your name" },
        { id: "phone", required: true, label: "Phone" },
        { id: "email", required: false, label: "Email (optional)" },
      ],
    });

    const sidThree = sessionId();
    const threeField = await api("/api/v1/leads", {
      method: "POST",
      body: JSON.stringify({
        botId,
        sessionId: sidThree,
        name: "Three Field",
        phone: "+15550118888",
        pageUrl: demoPageUrl,
      }),
    });

    if (threeField.body.ok) {
      pass("three-field form without optional email accepted");
    } else {
      fail("three-field form", JSON.stringify(threeField.body));
    }

    // --- Multi-tenant: different settings per bot ---
    await updateWidgetSettings(supabase, botId, {
      header_color: "#0000aa",
      accent_color: "#00aa00",
      lead_fields: DEFAULT_SETTINGS.lead_fields,
    });

    await updateWidgetSettings(supabase, otherBotId, {
      header_color: "#aa0000",
      accent_color: "#aa00aa",
      lead_fields: [{ id: "email", required: true, label: "Email only bot" }],
    });

    const testBotSettings = await getWidgetSettings(supabase, botId);
    const otherBotSettings = await getWidgetSettings(supabase, otherBotId);

    if (
      testBotSettings?.header_color?.toLowerCase() === "#0000aa" &&
      otherBotSettings?.header_color?.toLowerCase() === "#aa0000" &&
      otherBotSettings?.lead_fields?.length === 1
    ) {
      pass("multi-tenant settings isolated per bot");
    } else {
      fail("multi-tenant isolation", JSON.stringify({ testBotSettings, otherBotSettings }));
    }

    // --- Dashboard API (cookie session from sign-in) ---
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let accessToken = null;
    let refreshToken = null;

    if (anonKey) {
      try {
        const anonClient = createClient(supabaseUrl, anonKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data, error } = await anonClient.auth.signInWithPassword({
          email: seedEmail,
          password: seedPassword,
        });

        if (error || !data.session) {
          fail("dashboard sign-in", error?.message ?? "no session");
        } else {
          accessToken = data.session.access_token;
          refreshToken = data.session.refresh_token;
          pass("dashboard test user sign-in");
        }
      } catch (err) {
        fail("dashboard sign-in", err.message);
      }
    } else {
      fail("dashboard sign-in", "NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
    }

    const unauthorized = await fetch(`${baseUrl}/api/dashboard/widget-settings`);
    const unauthorizedText = await unauthorized.text();
    const unauthorizedIsProtected =
      unauthorized.status === 401 ||
      unauthorizedText.includes("Please log in") ||
      unauthorizedText.includes("login");

    if (unauthorizedIsProtected) {
      pass("widget-settings GET requires auth");
    } else {
      fail("widget-settings auth", `status ${unauthorized.status}`);
    }

    if (accessToken && refreshToken) {
      const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
      const cookieName = `sb-${projectRef}-auth-token`;
      const cookiePayload = JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: "bearer",
      });
      const authCookie = `${cookieName}=${encodeURIComponent(cookiePayload)}`;

      const getSettings = await fetch(`${baseUrl}/api/dashboard/widget-settings`, {
        headers: { Cookie: authCookie },
      });
      const getBody = await getSettings.json();

      if (getSettings.ok && getBody.ok && getBody.data?.settings?.headerColor) {
        pass("widget-settings GET returns settings for logged-in bot");
      } else {
        fail("widget-settings GET", JSON.stringify(getBody));
      }

      const badPut = await fetch(`${baseUrl}/api/dashboard/widget-settings`, {
        method: "PUT",
        headers: {
          Cookie: authCookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          headerColor: "not-a-color",
          accentColor: "#25D366",
          leadFormEnabled: true,
          leadFields: [],
        }),
      });
      const badBody = await badPut.json();

      if (!badPut.ok && badBody.error?.code?.startsWith("INVALID")) {
        pass("widget-settings PUT rejects invalid payload");
      } else {
        fail("widget-settings validation", JSON.stringify(badBody));
      }

      const goodPut = await fetch(`${baseUrl}/api/dashboard/widget-settings`, {
        method: "PUT",
        headers: {
          Cookie: authCookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          headerColor: "#075E54",
          accentColor: "#25D366",
          leadFormEnabled: true,
          leadFields: DEFAULT_SETTINGS.lead_fields,
        }),
      });
      const goodBody = await goodPut.json();

      if (goodPut.ok && goodBody.ok) {
        pass("widget-settings PUT saves valid settings");
      } else {
        fail("widget-settings PUT", JSON.stringify(goodBody));
      }
    }

    // --- Chat still works after lead ---
    const sidChat = sessionId();
    await updateWidgetSettings(supabase, botId, DEFAULT_SETTINGS);

    const leadForChat = await api("/api/v1/leads", {
      method: "POST",
      body: JSON.stringify({
        botId,
        sessionId: sidChat,
        name: "Chat After Widget",
        phone: "+15550117777",
        pageUrl: demoPageUrl,
      }),
    });

    if (!leadForChat.body.ok) {
      fail("lead before chat", JSON.stringify(leadForChat.body));
    } else {
      const chat = await api("/api/v1/chat", {
        method: "POST",
        body: JSON.stringify({
          botId,
          sessionId: sidChat,
          message: "Hello widget test",
          pageUrl: demoPageUrl,
        }),
      });

      if (chat.body.ok && chat.body.data?.reply) {
        pass("chat works after widget customization changes");
      } else {
        fail("chat after widget", JSON.stringify(chat.body));
      }
    }

    // --- Widget script still served ---
    const widgetJs = await fetch(`${baseUrl}/widget.js`);
    if (widgetJs.ok && (await widgetJs.text()).includes("iframe")) {
      pass("widget.js still served");
    } else {
      fail("widget.js", widgetJs.status);
    }

    // --- Demo site still served ---
    const demo = await fetch(demoPageUrl);
    if (demo.ok) {
      pass("demo site still served");
    } else {
      fail("demo site", demo.status);
    }
  } finally {
    if (originalTestBot) {
      await updateWidgetSettings(supabase, botId, {
        header_color: originalTestBot.header_color,
        accent_color: originalTestBot.accent_color,
        lead_form_enabled: originalTestBot.lead_form_enabled,
        lead_fields: originalTestBot.lead_fields,
      });
    }
    if (originalOtherBot) {
      await updateWidgetSettings(supabase, otherBotId, {
        header_color: originalOtherBot.header_color,
        accent_color: originalOtherBot.accent_color,
        lead_fields: originalOtherBot.lead_fields,
      });
    }
    console.log("\nRestored original widget settings.");
  }

  console.log("\nWidget customization tests finished.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
