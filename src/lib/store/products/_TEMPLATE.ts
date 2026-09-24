/**
 * ============================================================
 * NEW PRODUCT TEMPLATE — copy this file, do not edit it in place.
 *
 * Steps (full detail in STORE-PRODUCT-GUIDE.md at the project root):
 *   1. Copy this file to src/lib/store/products/<your-slug>.ts
 *   2. Rename `templateProduct` below to a camelCase name (e.g. usaLeads)
 *   3. Fill every field. Keep `published: false` while testing.
 *   4. Put the PDF in private/store/downloads/ and set `download` below.
 *   5. Register it in src/lib/store/products/index.ts (REGISTERED_PRODUCTS)
 *   6. Test at /store/product/<your-slug>
 *   7. When ready, set `published: true` and redeploy.
 *
 * This file is NOT registered, so it never appears on the site.
 * Only content lives here. Never add payment, Pixel, or CAPI code here.
 * ============================================================
 */

import type { StoreProductConfig } from "@/lib/store/product-content";

export const templateProduct: StoreProductConfig = {
  // ---------- Identity (must be unique) ----------
  /** Lowercase letters, numbers, dashes only. Becomes /store/product/<slug> */
  slug: "your-product-slug",
  /** Meta Pixel / CAPI product id. Use the same value as slug. */
  contentId: "your-product-slug",
  /** false = hidden from homepage (testing). true = shown on homepage. */
  published: false,

  // ---------- Homepage card ----------
  catalogSubtitle: "Short one-line summary for the homepage card",
  badge: undefined,
  topSelling: false,

  // ---------- Delivery ----------
  download: {
    /** File must exist at private/<relativePrivatePath> */
    relativePrivatePath: "store/downloads/YOUR-FILE-NAME.pdf",
    fileName: "YOUR-FILE-NAME.pdf",
    contentType: "application/pdf",
  },
  /** Optional Google Drive link sent in the purchase email. Use null for none. */
  driveDownloadUrl: null,

  // ---------- Price (Razorpay charges this) ----------
  price: 999,
  /** Crossed-out old price. Use null to hide. */
  compareAtPrice: 1999,
  currency: "INR",
  currencySymbol: "₹",

  // ---------- Top of page ----------
  brandName: "Verified Seller",
  title: "Your Product Title",
  subtitle: "One sentence under the title.",
  rating: 4.8,
  reviewCount: 100,
  socialProofTag: "🔥 50+ sold yesterday!",
  highlights: [
    "First bullet near the buy button",
    "Second bullet",
    // Bullet with a small tag:
    { text: "Bonus item description", badge: "Bonus" },
  ],

  // ---------- Images (first image is the main one) ----------
  // Copy one { src, alt } block to add another image.
  images: [
    {
      src: "https://res.cloudinary.com/YOUR-ACCOUNT/image/upload/YOUR-IMAGE.webp",
      alt: "Describe the image",
    },
  ],

  // ---------- Options (leave empty unless asked) ----------
  options: [],
  defaultSelections: {},

  // ---------- Trust row under the buy button ----------
  trustItems: [
    {
      title: "Instant delivery",
      description: "Google Drive access link sent via email right after payment",
    },
    {
      title: "Secure checkout",
      description: "Encrypted payment — your details stay private",
    },
    {
      title: "Lifetime access",
      description: "Download and use the files forever",
    },
  ],

  // ---------- About this product ----------
  description: [
    "First paragraph about the product.",
    "Second paragraph about the product.",
  ],
  useCases: [
    { title: "Use case title", description: "How a buyer uses it." },
  ],

  // ---------- What's included ----------
  includedHeadline: "What you get",
  includedNote: "Short note above the included list.",
  included: [
    { label: "Included item", value: 499 },
    { label: "And many more..." },
  ],
  bonusIncluded: [],

  // ---------- Reviews ----------
  // Copy one review block to add another review.
  reviews: [
    {
      name: "Customer Name",
      avatar: "https://res.cloudinary.com/YOUR-ACCOUNT/image/upload/HEADSHOT.png",
      quote: "Review text.",
      rating: 5,
    },
  ],

  // ---------- How it works ----------
  howItWorks: [
    "Secure Checkout: Complete the purchase on this page.",
    "Instant Delivery: You receive an email with your download.",
    "Download & Launch: Download the files and start using them.",
  ],

  // ---------- FAQ ----------
  // Copy one { question, answer } block to add another FAQ.
  faqs: [
    { question: "When will I receive my product?", answer: "Instantly after payment." },
  ],

  // ---------- Buttons ----------
  buyButtonLabel: "Download Now",
  secondaryButtonLabel: "Add to cart",
  /** Keep "#buy". Checkout is handled by the shared Razorpay flow. */
  buyUrl: "#buy",
  footerNote: "Pay securely with Razorpay · Instant download after payment",
};
