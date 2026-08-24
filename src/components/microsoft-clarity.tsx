"use client";

import Clarity from "@microsoft/clarity";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const CLARITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || "";

export function MicrosoftClarity() {
  const pathname = usePathname();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (
      !CLARITY_PROJECT_ID ||
      pathname.startsWith("/embed") ||
      initializedRef.current
    ) {
      return;
    }

    Clarity.init(CLARITY_PROJECT_ID);
    initializedRef.current = true;
  }, [pathname]);

  return null;
}
