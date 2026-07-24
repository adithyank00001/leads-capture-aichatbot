import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const botId = process.env.SMOKE_TEST_BOT_ID ?? "test-business-1";
const seedEmail = process.env.SEED_TEST_EMAIL ?? "smoke-test@chatbot-mvp.local";
const seedPassword = process.env.SEED_TEST_PASSWORD ?? "smoke-test-password-123";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function ensureAuthUser() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    throw listError;
  }

  const existing = users.users.find((user) => user.email === seedEmail);

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: seedEmail,
    password: seedPassword,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw error ?? new Error("Could not create seed auth user.");
  }

  return data.user;
}

async function main() {
  const user = await ensureAuthUser();

  let customerId;

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        user_id: user.id,
        email: seedEmail,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    customerId = customer.id;
  }

  const { data: existingBot } = await supabase
    .from("bots")
    .select("bot_id")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!existingBot) {
    const { error } = await supabase.from("bots").insert({
      bot_id: botId,
      customer_id: customerId,
      business_name: "Sunrise Home Cleaning",
    });

    if (error) {
      throw error;
    }
  } else if (existingBot.bot_id !== botId) {
    console.log(`Customer already has bot ${existingBot.bot_id}; keeping it.`);
  }

  const activeBotId = existingBot?.bot_id ?? botId;

  const { error: knowledgeError } = await supabase.from("bot_knowledge").upsert({
    bot_id: activeBotId,
    description:
      "Sunrise Home Cleaning provides reliable home and small office cleaning in Austin, Texas.",
    location:
      "Austin, Texas. We serve homes and small offices within 15 miles of downtown Austin.",
    services:
      "Standard home cleaning, Deep cleaning, Move-in and move-out cleaning, Small office cleaning",
    pricing_notes:
      "Standard home cleaning starts at $129 for up to 2 bedrooms. Deep cleaning starts at $199.",
    current_offer:
      "New customers get 15% off their first standard home cleaning when booked this month.",
    opening_hours:
      "Monday to Friday: 8:00 AM to 6:00 PM. Saturday: 9:00 AM to 2:00 PM. Closed on Sunday.",
    contact_method:
      "Call (512) 555-0142 or email hello@sunrisehomecleaning.example to book or ask questions.",
    extra_notes:
      "Do not promise same-day service unless already confirmed by staff.",
    updated_at: new Date().toISOString(),
  });

  if (knowledgeError) {
    throw knowledgeError;
  }

  console.log("Seed complete.");
  console.log(`Bot ID for smoke tests: ${activeBotId}`);
  console.log(`Seed user: ${seedEmail}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
