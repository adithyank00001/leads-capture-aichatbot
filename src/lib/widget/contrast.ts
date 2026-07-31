function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const int = Number.parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;

  return { r, g, b };
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((value) => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function pickReadableTextColor(backgroundHex: string) {
  return relativeLuminance(backgroundHex) > 0.55 ? "#111827" : "#ffffff";
}

export function getWidgetThemeVariables(headerColor: string, accentColor: string) {
  return {
    "--widget-header-bg": headerColor,
    "--widget-header-text": pickReadableTextColor(headerColor),
    "--widget-accent": accentColor,
    "--widget-accent-text": pickReadableTextColor(accentColor),
  } as Record<string, string>;
}
