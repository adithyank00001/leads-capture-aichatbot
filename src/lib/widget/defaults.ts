import type { LeadFieldConfig, WidgetSettings } from "@/lib/widget/types";

export const WIDGET_DEFAULT_HEADER_COLOR = "#075E54";
export const WIDGET_DEFAULT_ACCENT_COLOR = "#25D366";
export const WIDGET_DEFAULT_LAUNCHER_HINT_TEXT = "May I help you?";
export const WIDGET_DEFAULT_LAUNCHER_HINT_COLOR = "#E2E8EF";
export const WIDGET_BACKGROUND_COLOR = "#ffffff";

export const DEFAULT_LEAD_FIELDS: LeadFieldConfig[] = [
  { id: "name", required: true, label: "Your name" },
  { id: "phone", required: true, label: "Phone number" },
];

export function getDefaultWidgetSettings(botId: string): WidgetSettings {
  return {
    botId,
    headerColor: WIDGET_DEFAULT_HEADER_COLOR,
    accentColor: WIDGET_DEFAULT_ACCENT_COLOR,
    launcherHintText: WIDGET_DEFAULT_LAUNCHER_HINT_TEXT,
    launcherHintColor: WIDGET_DEFAULT_LAUNCHER_HINT_COLOR,
    leadFormEnabled: true,
    leadFields: DEFAULT_LEAD_FIELDS.map((field) => ({ ...field })),
    updatedAt: new Date().toISOString(),
  };
}
