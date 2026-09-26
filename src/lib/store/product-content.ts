/**
 * Shared product page field types.
 * Product text, price, images, and files live in src/lib/store/products/.
 * Live ads page: /store/product
 */

export type ProductImage = {
  src: string;
  alt: string;
};

export type ProductOption = {
  id: string;
  label: string;
  /** Shown next to the option group title (e.g. "License") */
  name: string;
  values: Array<{
    value: string;
    label: string;
    /** Optional price adjustment in the same currency unit as basePrice */
    priceAdjust?: number;
  }>;
};

export type ProductFaq = {
  question: string;
  answer: string;
};

export type ProductUseCase = {
  title: string;
  description: string;
};

export type ProductReview = {
  name: string;
  avatar: string;
  quote: string;
  rating?: number;
};

export type StoreProductContent = {
  /** Small brand name in the header */
  brandName: string;
  /** Small line above the title (buy box). Falls back to default if empty. */
  eyebrow?: string;
  /** Product title */
  title: string;
  /** Short line under the title */
  subtitle: string;
  /** Optional first sentence of subtitle (can be styled differently). */
  subtitleLead?: string;
  /** Main selling price */
  price: number;
  /** Old price (crossed out). Set null to hide */
  compareAtPrice: number | null;
  currency: string;
  currencySymbol: string;
  /** Star rating 0–5 */
  rating: number;
  reviewCount: number;
  /** Short bullets near the buy button */
  highlights: Array<
    | string
    | {
        text: string;
        /** Optional small tag next to the line (e.g. "Bonus") */
        badge?: string;
      }
  >;
  /** Overlay tag on the main product image */
  socialProofTag: string;
  /** Gallery — first image is the main one */
  images: ProductImage[];
  /** Option groups (like size/color on Shopify) */
  options: ProductOption[];
  /** Default selected values: { [optionId]: value } */
  defaultSelections: Record<string, string>;
  /** Trust row under the buy button */
  trustItems: Array<{ title: string; description: string }>;
  /** Long description paragraphs (About this product) */
  description: string[];
  /** Optional bold line at the top of About (product-specific). */
  aboutHeadline?: string;
  /** How customers use the product */
  useCases: ProductUseCase[];
  /** Headline above the included checklist */
  includedHeadline: string;
  /** Short note under the included headline */
  includedNote: string;
  /** Checklist in “What’s included” */
  included: Array<{ label: string; value?: number }>;
  /** Extra bonus databases shown under the main list */
  bonusIncluded: Array<{ label: string; value?: number }>;
  /** Customer reviews */
  reviews: ProductReview[];
  /** Steps in “How it works” */
  howItWorks: string[];
  faqs: ProductFaq[];
  /**
   * Optional bottom CTA block.
   * Only products that set this will show it (e.g. USA leads).
   */
  finalCta?: {
    headline: string;
    body: string;
  };
  /** Primary buy button */
  buyButtonLabel: string;
  /** Secondary button */
  secondaryButtonLabel: string;
  /**
   * Where Buy Now goes.
   * Put your payment link here (Stripe, Gumroad, Dodo, etc.)
   */
  buyUrl: string;
  /** Footer note under buttons */
  footerNote: string;
};

/** Paid file for one product. Path is under the project `private/` folder. */
export type StoreProductDownload = {
  relativePrivatePath: string;
  fileName: string;
  contentType: string;
};

/**
 * One sellable store product.
 * Content + price + files live here. Page design stays in shared components.
 */
export type StoreProductConfig = StoreProductContent & {
  /** URL name. Example: usa-leads → /store/product/usa-leads */
  slug: string;
  /** Meta Pixel / CAPI content_ids value. Usually the same as slug. */
  contentId: string;
  /**
   * true = show on the store homepage.
   * false = hidden from home. The secret URL still works and can be bought.
   */
  published: boolean;
  /** Homepage card line. Falls back to subtitle when empty. */
  catalogSubtitle?: string;
  badge?: string;
  topSelling?: boolean;
  download: StoreProductDownload;
  /** Optional Google Drive link in the purchase email. */
  driveDownloadUrl?: string | null;
};

export { storeProduct } from "@/lib/store/products";
