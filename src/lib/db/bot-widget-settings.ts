import type { SupabaseClient } from "@supabase/supabase-js";

import { getDefaultWidgetSettings } from "@/lib/widget/defaults";
import type { Database } from "@/lib/supabase/admin";
import type { WidgetSettings } from "@/lib/widget/types";
import { parseLeadFieldsFromDb } from "@/lib/validation/widget-settings";

type Client = SupabaseClient<Database>;

function mapRow(
  botId: string,
  row: {
    header_color: string;
    accent_color: string;
    launcher_hint_text: string;
    launcher_hint_color: string;
    lead_form_enabled: boolean;
    lead_fields: unknown;
    updated_at: string;
  },
): WidgetSettings {
  return {
    botId,
    headerColor: row.header_color,
    accentColor: row.accent_color,
    launcherHintText: row.launcher_hint_text,
    launcherHintColor: row.launcher_hint_color,
    leadFormEnabled: row.lead_form_enabled,
    leadFields: parseLeadFieldsFromDb(row.lead_fields, row.lead_form_enabled),
    updatedAt: row.updated_at,
  };
}

const SETTINGS_SELECT =
  "header_color, accent_color, launcher_hint_text, launcher_hint_color, lead_form_enabled, lead_fields, updated_at";

export async function getWidgetSettingsForBot(
  supabase: Client,
  botId: string,
): Promise<WidgetSettings | null> {
  const { data, error } = await supabase
    .from("bot_widget_settings")
    .select(SETTINGS_SELECT)
    .eq("bot_id", botId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapRow(botId, data);
}

export async function upsertWidgetSettingsForBot(
  supabase: Client,
  botId: string,
  input: {
    headerColor: string;
    accentColor: string;
    launcherHintText: string;
    launcherHintColor: string;
    leadFormEnabled: boolean;
    leadFields: WidgetSettings["leadFields"];
  },
): Promise<WidgetSettings> {
  const { data, error } = await supabase
    .from("bot_widget_settings")
    .upsert({
      bot_id: botId,
      header_color: input.headerColor,
      accent_color: input.accentColor,
      launcher_hint_text: input.launcherHintText,
      launcher_hint_color: input.launcherHintColor,
      lead_form_enabled: input.leadFormEnabled,
      lead_fields: input.leadFields,
      updated_at: new Date().toISOString(),
    })
    .select(SETTINGS_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save widget settings.");
  }

  return mapRow(botId, data);
}

export async function ensureWidgetSettingsForBot(
  supabase: Client,
  botId: string,
): Promise<WidgetSettings> {
  const existing = await getWidgetSettingsForBot(supabase, botId);

  if (existing) {
    return existing;
  }

  const defaults = getDefaultWidgetSettings(botId);

  return upsertWidgetSettingsForBot(supabase, botId, {
    headerColor: defaults.headerColor,
    accentColor: defaults.accentColor,
    launcherHintText: defaults.launcherHintText,
    launcherHintColor: defaults.launcherHintColor,
    leadFormEnabled: defaults.leadFormEnabled,
    leadFields: defaults.leadFields,
  });
}
