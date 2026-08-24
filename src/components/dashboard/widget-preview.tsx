"use client";

import type { CSSProperties } from "react";

import {
  getWidgetThemeVariables,
  pickReadableTextColor,
} from "@/lib/widget/contrast";
import type { LeadFieldConfig, WidgetSettings } from "@/lib/widget/types";

type WidgetPreviewProps = {
  businessName: string;
  settings: Pick<
    WidgetSettings,
    | "headerColor"
    | "accentColor"
    | "launcherHintText"
    | "launcherHintColor"
    | "leadFormEnabled"
    | "leadFields"
  >;
};

export function WidgetPreview({ businessName, settings }: WidgetPreviewProps) {
  const themeVariables = getWidgetThemeVariables(
    settings.headerColor,
    settings.accentColor,
  );
  const hintTextColor = pickReadableTextColor(settings.launcherHintColor);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
      style={themeVariables as CSSProperties}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
        style={{
          backgroundColor: "var(--widget-header-bg)",
          color: "var(--widget-header-text)",
        }}
      >
        <span
          className="flex size-6 items-center justify-center rounded-full text-xs font-semibold"
          style={{
            backgroundColor: "var(--widget-accent)",
            color: "var(--widget-accent-text)",
          }}
        >
          {businessName.charAt(0).toUpperCase()}
        </span>
        <span className="truncate">{businessName}</span>
      </div>
      <div className="space-y-2 bg-white p-3">
        <div className="rounded-2xl bg-blue-50 px-3 py-2 text-xs text-zinc-700">
          How can we help you today?
        </div>
        {settings.leadFormEnabled && settings.leadFields.length > 0 ? (
          <div className="space-y-2 border-t border-zinc-100 pt-2">
            <p className="text-xs font-semibold text-[var(--widget-accent)]">
              Lead form preview
            </p>
            {settings.leadFields.map((field: LeadFieldConfig) => (
              <div
                key={field.id}
                className="h-8 rounded-lg border-2 border-[var(--widget-accent)] bg-white px-2 text-xs text-zinc-400"
              >
                {field.label}
                {field.required ? " *" : ""}
              </div>
            ))}
            <div
              className="h-8 rounded-full text-center text-xs font-medium leading-8"
              style={{
                backgroundColor: "var(--widget-accent)",
                color: "var(--widget-accent-text)",
              }}
            >
              Continue
            </div>
          </div>
        ) : null}
        {!settings.leadFormEnabled ? (
          <p className="text-xs text-zinc-500">Chat only — no lead form</p>
        ) : null}
      </div>
      <div className="relative flex justify-end bg-zinc-50 p-3 pt-10">
        <div
          className="absolute bottom-14 right-12 max-w-[160px] rounded-full border border-black/10 px-3 py-1.5 text-[11px] font-semibold leading-snug shadow-sm"
          style={{
            backgroundColor: settings.launcherHintColor,
            color: hintTextColor,
          }}
        >
          {settings.launcherHintText}
        </div>
        <div
          className="flex size-10 items-center justify-center rounded-full shadow-md"
          style={{
            backgroundColor: "var(--widget-accent)",
            color: "var(--widget-accent-text)",
          }}
        >
          ●
        </div>
      </div>
    </div>
  );
}
