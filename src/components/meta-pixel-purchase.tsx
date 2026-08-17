"use client";

import { useEffect } from "react";

import { publicConfig } from "@/lib/config";
import { track } from "@/lib/fbpixel";

const PURCHASE_TRACK_KEY = "leady_meta_pixel_purchase";

export function MetaPixelPurchase() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.sessionStorage.getItem(PURCHASE_TRACK_KEY) === "1") {
      return;
    }

    track("Purchase", {
      value: publicConfig.lifetimeAccessPriceUsd,
      currency: "USD",
    });
    window.sessionStorage.setItem(PURCHASE_TRACK_KEY, "1");
  }, []);

  return null;
}
