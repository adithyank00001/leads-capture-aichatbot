export type LeadFieldId = "name" | "phone" | "email";

export type LeadFieldConfig = {
  id: string;
  required: boolean;
  label: string;
};

export type WidgetSettings = {
  botId: string;
  headerColor: string;
  accentColor: string;
  leadFormEnabled: boolean;
  leadFields: LeadFieldConfig[];
  updatedAt: string;
};

export const LEAD_FIELD_IDS: LeadFieldId[] = ["name", "phone", "email"];

export const LEAD_FIELD_TYPE_LABELS: Record<LeadFieldId, string> = {
  name: "Name",
  phone: "Phone number",
  email: "Email",
};

export const CUSTOM_FIELD_ID_PREFIX = "custom_";
export const MAX_LEAD_FIELDS = 5;
export const MAX_CUSTOM_FIELD_VALUE_LENGTH = 500;

const CUSTOM_FIELD_ID_PATTERN = /^custom_[a-z0-9]{6,32}$/;

export function isStandardLeadFieldId(id: string): id is LeadFieldId {
  return LEAD_FIELD_IDS.includes(id as LeadFieldId);
}

export function isCustomLeadFieldId(id: string) {
  return CUSTOM_FIELD_ID_PATTERN.test(id);
}

export function isValidLeadFieldId(id: string) {
  return isStandardLeadFieldId(id) || isCustomLeadFieldId(id);
}

export function createCustomLeadFieldId() {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);

  return `${CUSTOM_FIELD_ID_PREFIX}${suffix}`;
}

export function getLeadFieldDisplayName(field: LeadFieldConfig) {
  if (isStandardLeadFieldId(field.id)) {
    return LEAD_FIELD_TYPE_LABELS[field.id];
  }

  return "Custom field";
}
