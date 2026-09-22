"use client";

import { useEffect } from "react";

import { publicConfig } from "@/lib/config";
import { setPixelUserData, track } from "@/lib/fbpixel";
import { ensureBrowserFbcCookie } from "@/lib/meta/fbc";

const PURCHASE_TRACK_KEY = "leady_meta_pixel_purchase";

type MetaPixelPurchaseProps = {
  eventId: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentIds?: string[];
  numItems?: number;
  orderId?: string | null;
  /** Buyer email for Advanced Matching before Purchase. */
  email?: string | null;
  /** Buyer phone from Razorpay (when available). */
  phone?: string | null;
  /** Buyer name from Razorpay (when available). */
  fullName?: string | null;
};

function splitName(fullName: string | null | undefined): {
  fn?: string;
  ln?: string;
} {
  if (!fullName?.trim()) return {};
  const parts = fullName
    .trim()
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { fn: parts[0] };
  return { fn: parts[0], ln: parts[parts.length - 1] };
}

export function MetaPixelPurchase({
  eventId,
  value,
  currency,
  contentName,
  contentIds,
  numItems,
  orderId,
  email,
  phone,
  fullName,
}: MetaPixelPurchaseProps) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const trimmedEventId = eventId.trim();
    if (!trimmedEventId) {
      return;
    }

    const storageKey = `${PURCHASE_TRACK_KEY}:${trimmedEventId}`;
    if (window.sessionStorage.getItem(storageKey) === "1") {
      return;
    }

    const quantity = numItems ?? 1;
    const purchaseValue = value ?? publicConfig.lifetimeAccessPriceUsd;
    const itemPrice = quantity > 0 ? purchaseValue / quantity : purchaseValue;
    const ids = contentIds?.length ? contentIds : undefined;
    const { fn, ln } = splitName(fullName);
    const externalIds = [trimmedEventId, orderId?.trim()]
      .filter((id): id is string => Boolean(id));

    if (email || phone || fn || ln || externalIds.length > 0) {
      setPixelUserData({
        ...(email ? { em: email } : {}),
        ...(phone ? { ph: phone } : {}),
        ...(fn ? { fn } : {}),
        ...(ln ? { ln } : {}),
        country: "in",
        ...(externalIds.length > 0 ? { external_id: externalIds } : {}),
      });
    }

    try {
      ensureBrowserFbcCookie();
    } catch {
      // Cookie write must never break Purchase tracking.
    }

    track(
      "Purchase",
      {
        value: purchaseValue,
        currency: currency ?? "USD",
        ...(contentName ? { content_name: contentName } : {}),
        ...(ids
          ? {
              content_ids: ids,
              content_type: "product",
              content_category: "digital_leads_database",
              contents: ids.map((id) => ({
                id,
                quantity,
                item_price: itemPrice,
              })),
            }
          : {}),
        num_items: quantity,
        ...(orderId?.trim() ? { order_id: orderId.trim() } : {}),
      },
      { eventID: trimmedEventId },
    );
    window.sessionStorage.setItem(storageKey, "1");
  }, [
    contentIds,
    contentName,
    currency,
    email,
    eventId,
    fullName,
    numItems,
    orderId,
    phone,
    value,
  ]);

  return null;
}
