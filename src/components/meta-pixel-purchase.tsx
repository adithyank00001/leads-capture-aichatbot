"use client";

import { useEffect } from "react";

import { publicConfig } from "@/lib/config";
import { track } from "@/lib/fbpixel";

const PURCHASE_TRACK_KEY = "leady_meta_pixel_purchase";

type MetaPixelPurchaseProps = {
  eventId: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentIds?: string[];
  numItems?: number;
};

export function MetaPixelPurchase({
  eventId,
  value,
  currency,
  contentName,
  contentIds,
  numItems,
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

    track(
      "Purchase",
      {
        value: value ?? publicConfig.lifetimeAccessPriceUsd,
        currency: currency ?? "USD",
        ...(contentName ? { content_name: contentName } : {}),
        ...(contentIds?.length ? { content_ids: contentIds, content_type: "product" } : {}),
        ...(numItems != null ? { num_items: numItems } : {}),
      },
      { eventID: trimmedEventId },
    );
    window.sessionStorage.setItem(storageKey, "1");
  }, [contentIds, contentName, currency, eventId, numItems, value]);

  return null;
}
