const baseUrl = process.env.SMOKE_TEST_BASE_URL ?? "http://localhost:3000";
const botId = process.env.SMOKE_TEST_BOT_ID ?? "test-business-1";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPageUrl = `${baseUrl}/demo-site/index.html`;
const appOrigin = new URL(baseUrl).origin;

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

function pass(name) {
  console.log(`PASS  ${name}`);
}

function fail(name, detail) {
  console.log(`FAIL  ${name} -> ${detail}`);
  process.exitCode = 1;
}

function sessionId() {
  return `smoke-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function withEmbedOrigin(options = {}) {
  return {
    ...options,
    headers: {
      Origin: appOrigin,
      ...(options.headers ?? {}),
    },
  };
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
      throw new Error(`Could not seed smoke test domains: ${error.message}`);
    }
  }
}

async function run() {
  console.log(`Running smoke tests against ${baseUrl}\n`);

  let supabase = null;

  if (supabaseUrl && serviceRoleKey) {
    const { createClient } = await import("@supabase/supabase-js");
    supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await ensureSmokeTestDomains(supabase);
  }

  const health = await request("/api/v1/health");
  if (health.body.ok && health.body.data?.database?.connected) {
    pass("health check");
  } else {
    fail("health check", JSON.stringify(health.body));
  }

  const sid = sessionId();

  const lead = await request(
    "/api/v1/leads",
    withEmbedOrigin({
      method: "POST",
      body: JSON.stringify({
        botId: botId,
        sessionId: sid,
        name: "Smoke Test Visitor",
        phone: "+15550111222",
        pageUrl: demoPageUrl,
      }),
    }),
  );

  if (lead.body.ok && lead.body.data?.created === true) {
    pass("lead capture");
  } else {
    fail("lead capture", JSON.stringify(lead.body));
  }

  const duplicateLead = await request(
    "/api/v1/leads",
    withEmbedOrigin({
      method: "POST",
      body: JSON.stringify({
        botId: botId,
        sessionId: sid,
        name: "Smoke Test Visitor",
        phone: "+15550111222",
      }),
    }),
  );

  if (duplicateLead.body.ok && duplicateLead.body.data?.created === false) {
    pass("duplicate lead returns existing lead");
  } else {
    fail("duplicate lead returns existing lead", JSON.stringify(duplicateLead.body));
  }

  const missingPhone = await request(
    "/api/v1/leads",
    withEmbedOrigin({
      method: "POST",
      body: JSON.stringify({
        botId: botId,
        sessionId: sessionId(),
        name: "No Phone",
      }),
    }),
  );

  if (
    !missingPhone.body.ok &&
    (missingPhone.body.error?.code === "MISSING_PHONE" ||
      missingPhone.body.error?.code === "MISSING_LEAD_FIELD")
  ) {
    pass("missing phone validation");
  } else {
    fail("missing phone validation", JSON.stringify(missingPhone.body));
  }

  const chatWithoutLead = await request(
    "/api/v1/chat",
    withEmbedOrigin({
      method: "POST",
      body: JSON.stringify({
        botId: botId,
        sessionId: sessionId(),
        message: "Hello",
      }),
    }),
  );

  if (!chatWithoutLead.body.ok && chatWithoutLead.body.error?.code === "LEAD_REQUIRED") {
    pass("chat blocked without lead");
  } else {
    fail("chat blocked without lead", JSON.stringify(chatWithoutLead.body));
  }

  const chat = await request(
    "/api/v1/chat",
    withEmbedOrigin({
      method: "POST",
      body: JSON.stringify({
        botId: botId,
        sessionId: sid,
        message: "What are your opening hours?",
      }),
    }),
  );

  if (
    chat.body.ok &&
    chat.body.data?.aiConnected === true &&
    Array.isArray(chat.body.data?.messages) &&
    chat.body.data.messages.length >= 2
  ) {
    pass("chat with AI reply");
  } else {
    fail("chat with AI reply", JSON.stringify(chat.body));
  }

  const history = await request(
    `/api/v1/messages?botId=${encodeURIComponent(botId)}&sessionId=${encodeURIComponent(sid)}`,
    withEmbedOrigin({ method: "GET" }),
  );

  if (history.body.ok && Array.isArray(history.body.data?.messages)) {
    pass("conversation history reload");
  } else {
    fail("conversation history reload", JSON.stringify(history.body));
  }

  const emptyMessage = await request(
    "/api/v1/chat",
    withEmbedOrigin({
      method: "POST",
      body: JSON.stringify({
        botId: botId,
        sessionId: sid,
        message: "   ",
      }),
    }),
  );

  if (!emptyMessage.body.ok && emptyMessage.body.error?.code === "MISSING_MESSAGE") {
    pass("empty message validation");
  } else {
    fail("empty message validation", JSON.stringify(emptyMessage.body));
  }

  const widget = await fetch(`${baseUrl}/widget.js`);
  const widgetText = await widget.text();

  if (widget.ok && widgetText.includes("chatbot-mvp-root")) {
    pass("widget script served");
  } else {
    fail("widget script served", `status ${widget.status}`);
  }

  if (widgetText.includes("parentUrl=")) {
    pass("widget passes parent page URL to iframe");
  } else {
    fail("widget passes parent page URL to iframe", "parentUrl missing from widget.js");
  }

  const demoSite = await fetch(`${baseUrl}/demo-site/index.html`);
  const demoHtml = await demoSite.text();

  if (demoSite.ok && demoHtml.includes("/widget.js")) {
    pass("demo customer site served");
  } else {
    fail("demo customer site served", `status ${demoSite.status}`);
  }

  if (supabase) {
    await supabase.from("bot_allowed_domains").delete().eq("bot_id", botId);

    const blockedLead = await request("/api/v1/leads", {
      method: "POST",
      body: JSON.stringify({
        botId,
        sessionId: sessionId(),
        name: "No Domain Visitor",
        phone: "+15550110000",
      }),
    });

    if (
      !blockedLead.body.ok &&
      blockedLead.body.error?.code === "DOMAIN_NOT_CONFIGURED"
    ) {
      pass("domain blocked when allowlist empty");
    } else {
      fail(
        "domain blocked when allowlist empty",
        JSON.stringify(blockedLead.body),
      );
    }

    const demoHost = new URL(demoPageUrl).hostname.replace(/^www\./, "");
    const domainsToInsert = [{ bot_id: botId, domain: demoHost }];

    if (demoHost !== "localhost") {
      domainsToInsert.push({ bot_id: botId, domain: "localhost" });
    }

    const { error: insertDomainError } = await supabase
      .from("bot_allowed_domains")
      .insert(domainsToInsert);

    if (insertDomainError) {
      fail("domain setup", insertDomainError.message);
    } else {
      const domainSid = sessionId();

      const domainLead = await request("/api/v1/leads", {
        method: "POST",
        headers: {
          Origin: appOrigin,
        },
        body: JSON.stringify({
          botId,
          sessionId: domainSid,
          name: "Domain Test Visitor",
          phone: "+15550113344",
          pageUrl: demoPageUrl,
        }),
      });

      if (domainLead.body.ok && domainLead.body.data?.created === true) {
        pass("domain allowed lead with parent page URL");
      } else {
        fail("domain allowed lead with parent page URL", JSON.stringify(domainLead.body));
      }

      const domainChat = await request("/api/v1/chat", {
        method: "POST",
        headers: {
          Origin: appOrigin,
        },
        body: JSON.stringify({
          botId,
          sessionId: domainSid,
          message: "What services do you offer?",
          pageUrl: demoPageUrl,
        }),
      });

      if (domainChat.body.ok && domainChat.body.data?.aiConnected === true) {
        pass("domain allowed chat with parent page URL");
      } else {
        fail("domain allowed chat with parent page URL", JSON.stringify(domainChat.body));
      }

      const evilSid = sessionId();
      await request("/api/v1/leads", {
        method: "POST",
        headers: {
          Origin: appOrigin,
        },
        body: JSON.stringify({
          botId,
          sessionId: evilSid,
          name: "Evil Domain Visitor",
          phone: "+15550115566",
          pageUrl: demoPageUrl,
        }),
      });

      const evilChat = await request("/api/v1/chat", {
        method: "POST",
        headers: {
          Origin: appOrigin,
        },
        body: JSON.stringify({
          botId,
          sessionId: evilSid,
          message: "Hello from evil site",
          pageUrl: "https://evil.example.com/page",
        }),
      });

      if (
        !evilChat.body.ok &&
        evilChat.body.error?.code === "DOMAIN_NOT_ALLOWED"
      ) {
        pass("domain blocked chat with unapproved page URL");
      } else {
        fail(
          "domain blocked chat with unapproved page URL",
          JSON.stringify(evilChat.body),
        );
      }

      const embedSid = sessionId();
      await request(
        "/api/v1/leads",
        withEmbedOrigin({
          method: "POST",
          body: JSON.stringify({
            botId,
            sessionId: embedSid,
            name: "Embed Test Visitor",
            phone: "+15550117788",
            pageUrl: demoPageUrl,
          }),
        }),
      );

      const embedChat = await request(
        "/api/v1/chat",
        withEmbedOrigin({
          method: "POST",
          body: JSON.stringify({
            botId,
            sessionId: embedSid,
            message: "Direct embed test message",
          }),
        }),
      );

      if (embedChat.body.ok && embedChat.body.data?.aiConnected === true) {
        pass("domain allowed direct embed on app host without page URL");
      } else {
        fail(
          "domain allowed direct embed on app host without page URL",
          JSON.stringify(embedChat.body),
        );
      }

      await supabase.from("bot_allowed_domains").delete().eq("bot_id", botId);
      pass("domain test cleanup");
    }

    await ensureSmokeTestDomains(supabase);

    const { data: chunkCount, error: chunkCountError } = await supabase.rpc(
      "count_valid_website_chunks",
      { p_bot_id: botId },
    );

    if (chunkCountError) {
      console.log(
        `SKIP  website RAG chunk check (${chunkCountError.message})`,
      );
    } else if ((chunkCount ?? 0) >= 1) {
      const ragSid = sessionId();
      await request(
        "/api/v1/leads",
        withEmbedOrigin({
          method: "POST",
          body: JSON.stringify({
            botId,
            sessionId: ragSid,
            name: "RAG Test Visitor",
            phone: "+15550119900",
            pageUrl: demoPageUrl,
          }),
        }),
      );

      const ragChat = await request(
        "/api/v1/chat",
        withEmbedOrigin({
          method: "POST",
          body: JSON.stringify({
            botId,
            sessionId: ragSid,
            message: "Tell me about your business.",
            pageUrl: demoPageUrl,
          }),
        }),
      );

      if (ragChat.body.ok && ragChat.body.data?.aiConnected === true) {
        pass("chat with website RAG knowledge");
      } else {
        fail("chat with website RAG knowledge", JSON.stringify(ragChat.body));
      }
    } else {
      console.log("SKIP  website RAG chunk check (no website chunks configured)");
    }
  } else {
    console.log("SKIP  domain validation tests (missing Supabase env)");
  }

  console.log("\nSmoke tests finished.");
}

run().catch((error) => {
  fail("smoke test runner", error instanceof Error ? error.message : String(error));
});
