import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  /** xs = landing page, sm = policy pages, md = dashboard & app pages */
  size?: "xs" | "sm" | "md";
};

const sizeClasses = {
  xs: "h-4 w-auto",
  sm: "h-6 w-auto",
  md: "h-8 w-auto",
} as const;

const sizeDimensions = {
  xs: { width: 90, height: 16 },
  sm: { width: 120, height: 24 },
  md: { width: 160, height: 36 },
} as const;

const BRAND_LOGO_SRC =
  "https://res.cloudinary.com/ntv0bhpy/image/upload/f_auto,q_auto,w_360/v1788457921/Untitled_design_18.png";

export function BrandLogo({
  className,
  href = "/",
  size = "sm",
}: BrandLogoProps) {
  const dimensions = sizeDimensions[size];

  const logo = (
    <Image
      src={BRAND_LOGO_SRC}
      alt="growscalex AI"
      width={dimensions.width}
      height={dimensions.height}
      priority
      className={cn(sizeClasses[size], className)}
    />
  );

  if (!href) {
    return logo;
  }

  return (
    <Link
      href={href}
      className="inline-flex transition-opacity hover:opacity-80"
      aria-label="growscalex AI home"
    >
      {logo}
    </Link>
  );
}
