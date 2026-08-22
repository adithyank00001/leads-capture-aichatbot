"use client";

import { useEffect } from "react";

import { publicConfig } from "@/lib/config";
import { track } from "@/lib/fbpixel";

const PURCHASE_TRACK_KEY = "leady_meta_pixel_purchase";

type MetaPixelPurchaseProps = {
  eventId: string;
};

export function MetaPixelPurchase({ eventId }: MetaPixelPurchaseProps) {
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
        value: publicConfig.lifetimeAccessPriceUsd,
        currency: "USD",
      },
      { eventID: trimmedEventId },
    );
    window.sessionStorage.setItem(storageKey, "1");
  }, [eventId]);

  return null;
}
