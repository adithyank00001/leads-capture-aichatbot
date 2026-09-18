import "server-only";

import { randomBytes } from "crypto";

import { getSupabaseAdmin, type Json } from "@/lib/supabase/admin";

export type StorePurchaseStatus = "created" | "paid" | "failed";

export type StorePurchaseRow = {
  id: string;
  product_slug: string;
  product_title: string;
  amount_paise: number;
  currency: string;
  quantity: number;
  selections: Json;
  customer_email: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: StorePurchaseStatus;
  download_token: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

type StorePurchasesClient = {
  from: (table: "store_purchases") => {
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<{ data: StorePurchaseRow | null; error: { message: string } | null }>;
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => {
        select: (columns: string) => {
          maybeSingle: () => Promise<{
            data: StorePurchaseRow | null;
            error: { message: string } | null;
          }>;
          single: () => Promise<{
            data: StorePurchaseRow | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: StorePurchaseRow | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

function storeDb() {
  return getSupabaseAdmin() as unknown as StorePurchasesClient;
}

export function createDownloadToken() {
  return randomBytes(24).toString("hex");
}

export async function createStorePurchase(input: {
  productSlug: string;
  productTitle: string;
  amountPaise: number;
  currency: string;
  quantity: number;
  selections: Record<string, string>;
  razorpayOrderId: string;
}) {
  const { data, error } = await storeDb()
    .from("store_purchases")
    .insert({
      product_slug: input.productSlug,
      product_title: input.productTitle,
      amount_paise: input.amountPaise,
      currency: input.currency,
      quantity: input.quantity,
      selections: input.selections,
      razorpay_order_id: input.razorpayOrderId,
      status: "created",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create store purchase.");
  }

  return data;
}

export async function markStorePurchasePaid(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
}) {
  const existing = await getStorePurchaseByOrderId(input.razorpayOrderId);
  if (existing?.status === "paid" && existing.download_token) {
    return existing;
  }

  const downloadToken = existing?.download_token ?? createDownloadToken();

  const { data, error } = await storeDb()
    .from("store_purchases")
    .update({
      status: "paid",
      razorpay_payment_id: input.razorpayPaymentId,
      razorpay_signature: input.razorpaySignature ?? existing?.razorpay_signature ?? null,
      customer_email: input.customerEmail ?? existing?.customer_email ?? null,
      customer_phone: input.customerPhone ?? existing?.customer_phone ?? null,
      customer_name: input.customerName ?? existing?.customer_name ?? null,
      download_token: downloadToken,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_order_id", input.razorpayOrderId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to mark purchase as paid.");
  }

  return data;
}

export async function getStorePurchaseByOrderId(orderId: string) {
  const { data, error } = await storeDb()
    .from("store_purchases")
    .select("*")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPaidPurchaseByDownloadToken(token: string) {
  const { data, error } = await storeDb()
    .from("store_purchases")
    .select("*")
    .eq("download_token", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.status !== "paid") {
    return null;
  }

  return data;
}
