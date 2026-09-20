/**
 * Cloudinary delivery URLs — shrink images before the browser downloads them.
 * Example: .../upload/v1/file.png → .../upload/f_auto,q_auto:eco,w_800,c_limit/v1/file.png
 */
export function cloudinaryDeliveryUrl(
  src: string,
  options?: {
    width?: number;
    height?: number;
    /** Default eco = smaller files, still looks good on phones. */
    quality?: "eco" | "good" | "best";
  },
): string {
  const trimmed = src.trim();
  if (
    !trimmed.includes("res.cloudinary.com") ||
    !trimmed.includes("/upload/")
  ) {
    return trimmed;
  }

  // Already transformed
  if (/\/upload\/(?:[^/]*?(?:f_auto|q_auto|w_\d+).*?\/)/.test(trimmed)) {
    return trimmed;
  }

  const quality = options?.quality ?? "eco";
  const transforms = ["f_auto", `q_auto:${quality}`];
  if (options?.width && options.width > 0) {
    transforms.push(`w_${Math.round(options.width)}`, "c_limit");
  }
  if (options?.height && options.height > 0) {
    transforms.push(`h_${Math.round(options.height)}`);
  }

  return trimmed.replace("/upload/", `/upload/${transforms.join(",")}/`);
}
