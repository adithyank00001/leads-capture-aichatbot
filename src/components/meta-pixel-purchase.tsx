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
  /** Buyer email for Advanced Matching before Purchase. */
  email?: string | null;
  /** Buyer phone from Razorpay (when available). */
  phone?: string | null;
};

export function MetaPixelPurchase({
  eventId,
  value,
  currency,
  contentName,
  contentIds,
  numItems,
  email,
  phone,
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

    if (email || phone) {
      setPixelUserData({
        ...(email ? { em: email } : {}),
        ...(phone ? { ph: phone } : {}),
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
              contents: ids.map((id) => ({
                id,
                quantity,
                item_price: itemPrice,
              })),
            }
          : {}),
        num_items: quantity,
      },
      { eventID: trimmedEventId },
    );
    window.sessionStorage.setItem(storageKey, "1");
  }, [contentIds, contentName, currency, email, eventId, numItems, phone, value]);

  return null;
}
