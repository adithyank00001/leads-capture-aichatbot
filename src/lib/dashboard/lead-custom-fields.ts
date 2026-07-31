export function formatLeadCustomFields(
  customFields: Record<string, string> | null | undefined,
  fieldLabels: Record<string, string>,
) {
  if (!customFields || typeof customFields !== "object") {
    return [];
  }

  return Object.entries(customFields)
    .filter(([, value]) => value.trim().length > 0)
    .map(([id, value]) => ({
      label: fieldLabels[id] ?? "Custom field",
      value,
    }));
}
