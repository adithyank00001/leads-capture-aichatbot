import { preconnect, preload } from "react-dom";

import { cloudinaryDeliveryUrl } from "@/lib/store/cloudinary";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  priority = false,
  sizes,
  fit = "contain",
  /** Max delivery width from Cloudinary (keeps downloads small). */
  width = 720,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes: string;
  fit?: "contain" | "cover";
  width?: number;
}) {
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";
  const deliverySrc = cloudinaryDeliveryUrl(src, { width });
  const isCloudinary = src.includes("res.cloudinary.com");

  if (priority && isCloudinary) {
    preconnect("https://res.cloudinary.com");
    preload(deliverySrc, { as: "image", fetchPriority: "high" });
  }

  const srcSet =
    isCloudinary && width >= 400
      ? [
          `${cloudinaryDeliveryUrl(src, { width: Math.round(width * 0.5) })} ${Math.round(width * 0.5)}w`,
          `${cloudinaryDeliveryUrl(src, { width: Math.round(width * 0.75) })} ${Math.round(width * 0.75)}w`,
          `${deliverySrc} ${width}w`,
        ].join(", ")
      : undefined;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={deliverySrc}
      srcSet={srcSet}
      alt={alt}
      className={cn("absolute inset-0 size-full p-2", fitClass)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      sizes={sizes}
    />
  );
}
