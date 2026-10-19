import type { StoreProductConfig } from "@/lib/store/product-content";

/**
 * Sample India HNI database (draft).
 * Secret URL: /store/product/hni-database
 * Hidden from the homepage while published: false.
 */
export const hniDatabase: StoreProductConfig = {
  slug: "hni-database",
  contentId: "hni-database",
  published: false,

  catalogSubtitle:
    "High-net-worth India contacts · Instant Excel & CSV download",
  badge: undefined,
  topSelling: false,

  download: {
    relativePrivatePath: "store/downloads/HNI-DATABASE-SAMPLE.pdf",
    fileName: "HNI-DATABASE-SAMPLE.pdf",
    contentType: "application/pdf",
  },
  driveDownloadUrl: null,

  price: 499,
  compareAtPrice: 1999,
  currency: "INR",
  currencySymbol: "₹",

  brandName: "Verified Seller",
  title: "India HNI Database — High-Net-Worth Contacts (Sample)",
  subtitle:
    "Get a focused list of high-income Indian contacts to pitch premium products, investments, and high-ticket offers.",
  rating: 4.8,
  reviewCount: 86,
  socialProofTag: "🔥 Sample page — not on homepage",
  highlights: [
    "High-net-worth (HNI) contacts across major Indian cities",
    "Name, phone, and location fields ready for outreach",
    "Excel & CSV format for instant import",
    {
      text: "Sample product page for internal testing",
      badge: "Sample",
    },
  ],

  images: [
    {
      src: "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789829921/Corporate_database_poster_typogr__20260918155251_1.webp",
      alt: "India HNI database — high-net-worth contacts for premium outreach",
    },
    {
      src: "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789736328/Sample_category_New_Business_Owners_Category_1.webp",
      alt: "Sample spreadsheet view of contact categories",
    },
  ],

  options: [],
  defaultSelections: {},

  trustItems: [
    {
      title: "Instant delivery",
      description: "Download link sent via email right after payment",
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

  description: [
    "This is a sample product page for an India HNI (high-net-worth individual) database. HNI means people with high income or high purchasing power — useful if you sell expensive products or services.",
    "The live PAN India and USA product pages are not changed by this sample. Keep this page unpublished until you are ready to show it on the homepage.",
  ],
  useCases: [
    {
      title: "Premium products",
      description: "Pitch luxury, education, or high-ticket offers to people who can afford them.",
    },
    {
      title: "Calling teams",
      description: "Give your team a focused list instead of a mixed all-India sheet.",
    },
  ],

  includedHeadline: "What you get",
  includedNote: "Sample listing for this draft page. Replace with the real file later.",
  included: [
    { label: "India HNI contact list (Excel & CSV)", value: 1499 },
    { label: "City / region tags for easier calling" },
  ],
  bonusIncluded: [],

  reviews: [
    {
      name: "Rohan Mehta",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789741917/cb8cdac7-455d-4505-8105-44776c99fc52.png",
      quote:
        "Useful as a focused HNI list. Easier to call than a huge mixed database.",
      rating: 5,
    },
    {
      name: "Fatima Khan",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1788458314/c55fd900-d70f-44f5-b1ac-b32a2fbb35ff.png",
      quote:
        "Good for premium offers. Keep the numbers fresh and this is a solid add-on.",
      rating: 5,
    },
  ],

  howItWorks: [
    "Secure Checkout: Complete the purchase on this page.",
    "Instant Delivery: You receive an email with your download.",
    "Download & Launch: Download the files and start using them.",
  ],

  faqs: [
    {
      question: "When will I receive my product?",
      answer: "Instantly after payment, by email.",
    },
    {
      question: "Is this the PAN India or USA product?",
      answer:
        "No. This is a separate HNI sample page. PAN India stays at /store/product. USA stays at /store/product/usa-leads.",
    },
    {
      question: "Why is this not on the homepage?",
      answer:
        "This page is a draft (published: false). The secret URL still works for testing.",
    },
  ],

  buyButtonLabel: "Download Now",
  secondaryButtonLabel: "Add to cart",
  buyUrl: "#buy",
  footerNote: "Pay securely with Razorpay · Instant download after payment",
};
