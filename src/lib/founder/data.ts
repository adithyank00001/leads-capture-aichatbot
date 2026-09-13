import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export type FounderProduct = "product1" | "product2" | "both";

export type ManualGrantRow = {
  id: string;
  email: string;
  note: string | null;
  created_at: string;
  claimed: boolean;
  customerId: string | null;
  fullName: string | null;
};

export type Product1CustomerRow = {
  id: string;
  email: string;
  full_name: string | null;
  mobile_phone: string | null;
  has_lifetime_access: boolean;
  lifetime_access_granted_at: string | null;
  dodo_payment_id: string | null;
  source: "paid" | "manual" | "unknown";
  bot_id: string | null;
  messages_used_this_period: number | null;
  leads_captured_this_period: number | null;
  chatbot_leads_count: number;
};

export type Product2CustomerRow = {
  id: string;
  email: string;
  full_name: string | null;
  mobile_phone: string | null;
  has_maps_access: boolean;
  maps_access_granted_at: string | null;
  maps_lead_credits_limit: number;
  maps_lead_credits_used: number;
  searches_count: number;
  maps_leads_count: number;
};

export type FounderDashboardData = {
  overview: {
    totalCustomers: number;
    product1Count: number;
    product2Count: number;
    bothCount: number;
    unclaimedProduct1: number;
    unclaimedProduct2: number;
    pendingPurchases: number;
  };
  product1Grants: ManualGrantRow[];
  product2Grants: ManualGrantRow[];
  product1Customers: Product1CustomerRow[];
  product2Customers: Product2CustomerRow[];
};

async function loadGrantStatus(
  table: "lifetime_access_emails" | "maps_access_emails",
  accessFlag: "has_lifetime_access" | "has_maps_access",
): Promise<ManualGrantRow[]> {
  const admin = getSupabaseAdmin();

  const { data: grants, error } = await admin
    .from(table)
    .select("id, email, note, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const emails = (grants ?? []).map((g) => g.email);
  if (emails.length === 0) {
    return [];
  }

  const { data: customers, error: customerError } = await admin
    .from("customers")
    .select(`id, email, full_name, ${accessFlag}`)
    .in("email", emails);

  if (customerError) {
    throw new Error(customerError.message);
  }

  const byEmail = new Map(
    (customers ?? []).map((c) => [c.email.toLowerCase(), c]),
  );

  return (grants ?? []).map((grant) => {
    const customer = byEmail.get(grant.email.toLowerCase());
    const claimed = Boolean(
      customer &&
        (customer as Record<string, unknown>)[accessFlag] === true,
    );
    return {
      id: grant.id,
      email: grant.email,
      note: grant.note,
      created_at: grant.created_at,
      claimed,
      customerId: customer?.id ?? null,
      fullName: customer?.full_name ?? null,
    };
  });
}

export async function loadFounderDashboardData(): Promise<FounderDashboardData> {
  const admin = getSupabaseAdmin();

  const [
    customersRes,
    product1Grants,
    product2Grants,
    pendingRes,
    botsRes,
    chatbotLeadsRes,
    searchesRes,
    mapsLeadsRes,
  ] = await Promise.all([
    admin
      .from("customers")
      .select(
        "id, email, full_name, mobile_phone, has_lifetime_access, lifetime_access_granted_at, dodo_payment_id, has_maps_access, maps_access_granted_at, maps_lead_credits_limit, maps_lead_credits_used",
      )
      .order("created_at", { ascending: false }),
    loadGrantStatus("lifetime_access_emails", "has_lifetime_access"),
    loadGrantStatus("maps_access_emails", "has_maps_access"),
    admin
      .from("pending_lifetime_purchases")
      .select("id", { count: "exact", head: true })
      .is("claimed_at", null),
    admin.from("bots").select("customer_id, bot_id, messages_used_this_period, leads_captured_this_period"),
    admin.from("chatbot_leads").select("bot_id").is("deleted_at", null),
    admin.from("maps_searches").select("customer_id"),
    admin.from("maps_leads").select("customer_id"),
  ]);

  if (customersRes.error) {
    throw new Error(customersRes.error.message);
  }
  if (botsRes.error) {
    throw new Error(botsRes.error.message);
  }
  if (chatbotLeadsRes.error) {
    throw new Error(chatbotLeadsRes.error.message);
  }
  if (searchesRes.error) {
    throw new Error(searchesRes.error.message);
  }
  if (mapsLeadsRes.error) {
    throw new Error(mapsLeadsRes.error.message);
  }

  const customers = customersRes.data ?? [];
  const botsByCustomer = new Map(
    (botsRes.data ?? []).map((b) => [b.customer_id, b]),
  );

  const leadsByBot = new Map<string, number>();
  for (const lead of chatbotLeadsRes.data ?? []) {
    leadsByBot.set(lead.bot_id, (leadsByBot.get(lead.bot_id) ?? 0) + 1);
  }

  const searchesByCustomer = new Map<string, number>();
  for (const row of searchesRes.data ?? []) {
    searchesByCustomer.set(
      row.customer_id,
      (searchesByCustomer.get(row.customer_id) ?? 0) + 1,
    );
  }

  const mapsLeadsByCustomer = new Map<string, number>();
  for (const row of mapsLeadsRes.data ?? []) {
    mapsLeadsByCustomer.set(
      row.customer_id,
      (mapsLeadsByCustomer.get(row.customer_id) ?? 0) + 1,
    );
  }

  const lifetimeAllow = new Set(product1Grants.map((g) => g.email));

  const product1Customers: Product1CustomerRow[] = customers
    .filter((c) => c.has_lifetime_access)
    .map((c) => {
      const bot = botsByCustomer.get(c.id);
      let source: Product1CustomerRow["source"] = "unknown";
      if (c.dodo_payment_id) {
        source = "paid";
      } else if (lifetimeAllow.has(c.email.toLowerCase())) {
        source = "manual";
      }
      return {
        id: c.id,
        email: c.email,
        full_name: c.full_name,
        mobile_phone: c.mobile_phone,
        has_lifetime_access: c.has_lifetime_access,
        lifetime_access_granted_at: c.lifetime_access_granted_at,
        dodo_payment_id: c.dodo_payment_id,
        source,
        bot_id: bot?.bot_id ?? null,
        messages_used_this_period: bot?.messages_used_this_period ?? null,
        leads_captured_this_period: bot?.leads_captured_this_period ?? null,
        chatbot_leads_count: bot ? (leadsByBot.get(bot.bot_id) ?? 0) : 0,
      };
    });

  const product2Customers: Product2CustomerRow[] = customers
    .filter((c) => c.has_maps_access)
    .map((c) => ({
      id: c.id,
      email: c.email,
      full_name: c.full_name,
      mobile_phone: c.mobile_phone,
      has_maps_access: c.has_maps_access,
      maps_access_granted_at: c.maps_access_granted_at,
      maps_lead_credits_limit: c.maps_lead_credits_limit,
      maps_lead_credits_used: c.maps_lead_credits_used,
      searches_count: searchesByCustomer.get(c.id) ?? 0,
      maps_leads_count: mapsLeadsByCustomer.get(c.id) ?? 0,
    }));

  const product1Count = customers.filter((c) => c.has_lifetime_access).length;
  const product2Count = customers.filter((c) => c.has_maps_access).length;
  const bothCount = customers.filter(
    (c) => c.has_lifetime_access && c.has_maps_access,
  ).length;

  return {
    overview: {
      totalCustomers: customers.length,
      product1Count,
      product2Count,
      bothCount,
      unclaimedProduct1: product1Grants.filter((g) => !g.claimed).length,
      unclaimedProduct2: product2Grants.filter((g) => !g.claimed).length,
      pendingPurchases: pendingRes.count ?? 0,
    },
    product1Grants,
    product2Grants,
    product1Customers,
    product2Customers,
  };
}

export async function grantFounderAccess(input: {
  email: string;
  product: FounderProduct;
  note?: string | null;
}) {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  const admin = getSupabaseAdmin();
  const note = input.note?.trim() || null;
  const granted: string[] = [];

  async function upsertAllowlist(
    table: "lifetime_access_emails" | "maps_access_emails",
    label: string,
  ) {
    const { data: existing } = await admin
      .from(table)
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      if (note) {
        await admin.from(table).update({ note }).eq("id", existing.id);
      }
      granted.push(`${label} (already listed)`);
      return;
    }

    const { error } = await admin.from(table).insert({ email, note });
    if (error) {
      throw new Error(error.message);
    }
    granted.push(label);
  }

  if (input.product === "product1" || input.product === "both") {
    await upsertAllowlist("lifetime_access_emails", "Product 1");
  }
  if (input.product === "product2" || input.product === "both") {
    await upsertAllowlist("maps_access_emails", "Product 2");
  }

  return { email, granted };
}

export async function revokeFounderAccess(input: {
  email: string;
  product: "product1" | "product2";
}) {
  const email = normalizeEmail(input.email);
  const admin = getSupabaseAdmin();

  if (input.product === "product1") {
    await admin.from("lifetime_access_emails").delete().eq("email", email);

    const { data: customer } = await admin
      .from("customers")
      .select("id, dodo_payment_id, has_lifetime_access")
      .eq("email", email)
      .maybeSingle();

    if (customer?.has_lifetime_access && !customer.dodo_payment_id) {
      const { error } = await admin
        .from("customers")
        .update({
          has_lifetime_access: false,
          lifetime_access_granted_at: null,
        })
        .eq("id", customer.id);

      if (error) {
        throw new Error(error.message);
      }

      return {
        email,
        product: "product1" as const,
        message: "Removed from manual list and Product 1 access cleared.",
        paidAccessKept: false,
      };
    }

    if (customer?.dodo_payment_id) {
      return {
        email,
        product: "product1" as const,
        message: "Removed from manual list; paid access kept.",
        paidAccessKept: true,
      };
    }

    return {
      email,
      product: "product1" as const,
      message: "Removed from Product 1 manual list.",
      paidAccessKept: false,
    };
  }

  await admin.from("maps_access_emails").delete().eq("email", email);

  const { data: customer } = await admin
    .from("customers")
    .select("id, has_maps_access")
    .eq("email", email)
    .maybeSingle();

  if (customer?.has_maps_access) {
    const { error } = await admin
      .from("customers")
      .update({
        has_maps_access: false,
        maps_access_granted_at: null,
      })
      .eq("id", customer.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  return {
    email,
    product: "product2" as const,
    message: "Removed from Product 2 list and access cleared.",
    paidAccessKept: false,
  };
}
