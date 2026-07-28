const botId = "bot_d87147f9a596";
const sessionId = crypto.randomUUID();
const base = "http://localhost:3000";
const pageUrl = "https://quadcubes.com/";

async function post(path, body) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://quadcubes.com",
      Referer: pageUrl,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

await post("/api/v1/leads", {
  botId,
  sessionId,
  name: "Quadcubes Test",
  phone: "+919999999992",
  email: "test@example.com",
  pageUrl,
});

const questions = [
  {
    id: "what_company",
    q: "What kind of company are you folks?",
    expect: ["marketing", "digital", "agency", "quadcubes"],
  },
  {
    id: "tagline",
    q: "What's your company motto or tagline?",
    expect: ["precision", "marketer"],
  },
  {
    id: "services_general",
    q: "What do you actually help businesses with?",
    expect: ["social", "seo", "video", "brand", "web"],
  },
  {
    id: "social_media",
    q: "Can you manage our Instagram and social feeds?",
    expect: ["social", "media", "reel", "content", "campaign"],
  },
  {
    id: "seo",
    q: "Do you help websites show up on Google?",
    expect: ["seo", "search", "google", "rank"],
  },
  {
    id: "video",
    q: "Do you shoot promotional films or reels?",
    expect: ["video", "production", "reel", "film", "story"],
  },
  {
    id: "branding",
    q: "Can you design our logo and brand look?",
    expect: ["brand", "identity", "logo", "design"],
  },
  {
    id: "websites",
    q: "Do you build company websites too?",
    expect: ["web", "website", "site"],
  },
  {
    id: "awards",
    q: "Have you won any industry prizes?",
    expect: ["award", "pepper", "foxglove", "bronze", "silver"],
  },
  {
    id: "kroffle",
    q: "Tell me about the Kroffle project you worked on.",
    expect: ["kroffle", "brand", "identity"],
  },
  {
    id: "case_study",
    q: "Did you run WhatsApp ad campaigns for anyone?",
    expect: ["whatsapp", "cda", "vismaya", "campaign", "case"],
  },
  {
    id: "locations",
    q: "Which cities in Kerala do you have offices?",
    expect: ["calicut", "kochi", "kozhikode"],
  },
  {
    id: "location_wording",
    q: "Where are you physically based?",
    expect: ["calicut", "kochi", "kerala", "kozhikode"],
  },
  {
    id: "email_projects",
    q: "What email should I use for a new project inquiry?",
    expect: ["projects@quadcubes"],
  },
  {
    id: "email_hr",
    q: "I want to apply for a job — which email?",
    expect: ["hr@quadcubes"],
  },
  {
    id: "phone_1",
    q: "What's the best number to ring you?",
    expect: ["90480", "22885", "773678", "7778", "+91"],
  },
  {
    id: "phone_2",
    q: "How can I give you a call?",
    expect: ["90480", "22885", "773678", "7778", "+91", "999999"],
  },
  {
    id: "founded",
    q: "When did your agency start operating?",
    expect: ["2019", "founded"],
  },
  {
    id: "kochi_focus",
    q: "Are you strong in the Kochi market?",
    expect: ["kochi", "marketing", "agency", "lead"],
  },
  {
    id: "aeo",
    q: "Do you optimize for AI answer engines?",
    expect: ["aeo", "answer engine", "ai"],
  },
  {
    id: "portfolio",
    q: "Can you name a few brands you've worked with?",
    expect: [
      "glamata",
      "impex",
      "mistiwala",
      "bhumika",
      "arif",
      "bea",
      "misaal",
      "wea",
    ],
  },
  {
    id: "blog",
    q: "Do you publish marketing articles online?",
    expect: ["blog", "guide", "insight", "article", "performance marketing"],
  },
];

const results = [];
for (const item of questions) {
  const chat = await post("/api/v1/chat", {
    botId,
    sessionId,
    message: item.q,
    pageUrl,
  });
  const answer = chat?.data?.answer ?? chat?.error?.message ?? "NO ANSWER";
  const lower = String(answer).toLowerCase();
  const matched = item.expect.filter((e) => lower.includes(e));
  const pass = chat.ok && matched.length > 0;
  results.push({ ...item, pass, matched, answer: String(answer) });
}

let passed = 0;
console.log("=== QUADCUBES CHAT TESTS ===\n");
for (const r of results) {
  console.log((r.pass ? "PASS" : "FAIL") + " | " + r.id);
  console.log("Q: " + r.q);
  console.log(
    "A: " + r.answer.slice(0, 320) + (r.answer.length > 320 ? "..." : ""),
  );
  if (r.matched.length) {
    console.log("Matched: " + r.matched.join(", "));
  }
  console.log("");
  if (r.pass) passed++;
}

console.log("TOTAL: " + passed + "/" + results.length);
