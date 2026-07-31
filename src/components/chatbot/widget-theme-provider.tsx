"use client";

import type { CSSProperties, ReactNode } from "react";

import { getWidgetThemeVariables } from "@/lib/widget/contrast";
import type { WidgetSettings } from "@/lib/widget/types";

type WidgetThemeProviderProps = {
  settings: WidgetSettings;
  children: ReactNode;
};

export function WidgetThemeProvider({
  settings,
  children,
}: WidgetThemeProviderProps) {
  const themeVariables = getWidgetThemeVariables(
    settings.headerColor,
    settings.accentColor,
  );

  return (
    <div className="h-full w-full" style={themeVariables as CSSProperties}>
      {children}
    </div>
  );
}
