const baseUrl = process.env.SMOKE_TEST_BASE_URL ?? "http://localhost:3000";
const botId = process.env.SMOKE_TEST_BOT_ID ?? "test-business-1";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
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

async function run() {
  console.log(`Running smoke tests against ${baseUrl}\n`);

  const health = await request("/api/v1/health");
  if (health.body.ok && health.body.data?.database?.connected) {
    pass("health check");
  } else {
    fail("health check", JSON.stringify(health.body));
  }

  const sid = sessionId();

  const lead = await request("/api/v1/leads", {
    method: "POST",
    body: JSON.stringify({
      botId: botId,
      sessionId: sid,
      name: "Smoke Test Visitor",
      phone: "+15550111222",
      pageUrl: `${baseUrl}/demo-site/index.html`,
    }),
  });

  if (lead.body.ok && lead.body.data?.created === true) {
    pass("lead capture");
  } else {
    fail("lead capture", JSON.stringify(lead.body));
  }

  const duplicateLead = await request("/api/v1/leads", {
    method: "POST",
    body: JSON.stringify({
      botId: botId,
      sessionId: sid,
      name: "Smoke Test Visitor",
      phone: "+15550111222",
    }),
  });

  if (duplicateLead.body.ok && duplicateLead.body.data?.created === false) {
    pass("duplicate lead returns existing lead");
  } else {
    fail("duplicate lead returns existing lead", JSON.stringify(duplicateLead.body));
  }

  const missingPhone = await request("/api/v1/leads", {
    method: "POST",
    body: JSON.stringify({
      botId: botId,
      sessionId: sessionId(),
      name: "No Phone",
    }),
  });

  if (!missingPhone.body.ok && missingPhone.body.error?.code === "MISSING_PHONE") {
    pass("missing phone validation");
  } else {
    fail("missing phone validation", JSON.stringify(missingPhone.body));
  }

  const chatWithoutLead = await request("/api/v1/chat", {
    method: "POST",
    body: JSON.stringify({
      botId: botId,
      sessionId: sessionId(),
      message: "Hello",
    }),
  });

  if (!chatWithoutLead.body.ok && chatWithoutLead.body.error?.code === "LEAD_REQUIRED") {
    pass("chat blocked without lead");
  } else {
    fail("chat blocked without lead", JSON.stringify(chatWithoutLead.body));
  }

  const chat = await request("/api/v1/chat", {
    method: "POST",
    body: JSON.stringify({
      botId: botId,
      sessionId: sid,
      message: "What are your opening hours?",
    }),
  });

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
  );

  if (history.body.ok && Array.isArray(history.body.data?.messages)) {
    pass("conversation history reload");
  } else {
    fail("conversation history reload", JSON.stringify(history.body));
  }

  const emptyMessage = await request("/api/v1/chat", {
    method: "POST",
    body: JSON.stringify({
      botId: botId,
      sessionId: sid,
      message: "   ",
    }),
  });

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

  const demoSite = await fetch(`${baseUrl}/demo-site/index.html`);
  const demoHtml = await demoSite.text();

  if (demoSite.ok && demoHtml.includes("/widget.js")) {
    pass("demo customer site served");
  } else {
    fail("demo customer site served", `status ${demoSite.status}`);
  }

  console.log("\nSmoke tests finished.");
}

run().catch((error) => {
  fail("smoke test runner", error instanceof Error ? error.message : String(error));
});
