import "server-only";

import { isValidStoreEmail, normalizeStoreEmail } from "@/lib/store/email";
import { getRazorpayClient } from "@/lib/store/razorpay";

export type RazorpayPaymentCustomer = {
  email: string | null;
  phone: string | null;
  name: string | null;
};

/**
 * Pull every customer field Razorpay exposes on a payment
 * (email, phone, name from payment or card) for Meta matching + delivery.
 */
export async function fetchRazorpayPaymentCustomer(
  paymentId: string,
): Promise<RazorpayPaymentCustomer> {
  try {
    const payment = await getRazorpayClient().payments.fetch(paymentId);
    const emailRaw =
      typeof payment.email === "string" ? payment.email : null;
    const phoneRaw =
      typeof payment.contact === "string" ? payment.contact : null;

    const paymentName =
      typeof (payment as { name?: unknown }).name === "string"
        ? ((payment as { name?: string }).name ?? null)
        : null;

    const card = (payment as { card?: { name?: unknown } | null }).card;
    const cardName =
      card && typeof card.name === "string" ? card.name : null;

    const nameRaw = [paymentName, cardName]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)[0];

    return {
      email: isValidStoreEmail(emailRaw)
        ? normalizeStoreEmail(emailRaw)
        : null,
      phone: phoneRaw?.trim() || null,
      name: nameRaw || null,
    };
  } catch (error) {
    console.error("[store/razorpay-customer] payment fetch", error);
    return { email: null, phone: null, name: null };
  }
}
