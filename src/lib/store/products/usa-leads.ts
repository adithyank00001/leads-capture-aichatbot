import type { StoreProductConfig } from "@/lib/store/product-content";

/**
 * USA Leads Premium Pack.
 * Secret test URL: /store/product/usa-leads
 * Keep published: false until you are ready for the homepage.
 * Replace the placeholder PDF before real sales.
 */
export const usaLeads: StoreProductConfig = {
  slug: "usa-leads",
  contentId: "usa-leads",
  published: false,

  catalogSubtitle:
    "300+ categories · State & timezone tagged · Clean B2B emails",
  badge: "New",
  topSelling: false,

  download: {
    relativePrivatePath: "store/downloads/USA-LEADS-PREMIUM-PACK-2026.pdf",
    fileName: "USA-LEADS-PREMIUM-PACK-2026.pdf",
    contentType: "application/pdf",
  },
  driveDownloadUrl: null,

  price: 897,
  compareAtPrice: 2997,
  currency: "INR",
  currencySymbol: "₹",

  brandName: "Verified Seller",
  title: "USA Leads Premium Pack (10 Lakhs+ Contacts)",
  subtitle:
    "Unlock 10 Lakhs+ verified USA B2B contacts with 300+ categories, state tags, and timezone-ready outreach lists.",
  rating: 4.8,
  reviewCount: 86,
  socialProofTag: "🔥 40+ sold this week!",
  highlights: [
    "Instant digital download via Google Drive",
    "10 Lakhs+ High Quality USA B2B & B2C Contacts",
    "Includes Name, Email, Phone, Company & Location details",
    "State-wise and timezone tagged for smarter outreach",
    {
      text: "300+ niche categories ready to filter and export",
      badge: "Premium",
    },
  ],

  images: [
    {
      src: "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789746243/Creating_educational_social_medi__20260918210816_1.webp",
      alt: "USA Premium Leads — 10 Lakhs+ verified B2B contacts",
    },
    {
      src: "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789736328/Sample_category_New_Business_Owners_Category_1.webp",
      alt: "Sample category sheet — business owners and niche filters",
    },
    {
      src: "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789829921/Corporate_database_poster_typogr__20260918155251_1.webp",
      alt: "Corporate USA database categories for sales and marketing teams",
    },
  ],

  options: [],
  defaultSelections: {},

  trustItems: [
    {
      title: "Instant delivery",
      description:
        "Google Drive access link sent via email right after payment",
    },
    {
      title: "Secure checkout",
      description: "Encrypted payment — your details stay private",
    },
    {
      title: "Lifetime access",
      description: "Download and use the database files forever",
    },
  ],

  description: [
    "Stop spending weeks hunting for US prospects. This USA Leads Premium Pack gives you instant access to over 10 Lakhs verified contacts so your sales and marketing team can start outreach the same day.",
    "Lists are organized by category, state, and timezone so you can segment campaigns cleanly for cold email, LinkedIn outreach, and call sequences without messy cleanup work.",
  ],
  useCases: [
    {
      title: "Cold Email Campaigns",
      description:
        "Load verified work emails into your sender and run targeted US B2B sequences at scale.",
    },
    {
      title: "Timezone-Smart Calling",
      description:
        "Use state and timezone tags so your team dials during local business hours.",
    },
    {
      title: "Agency Client Acquisition",
      description:
        "Find decision-makers across niches and book discovery calls for your agency offers.",
    },
    {
      title: "Market Testing",
      description:
        "Test new offers on clean US segments before you scale ad spend.",
    },
  ],

  includedHeadline: "The Complete USA Leads Premium Pack (10 Lakhs+ Records)",
  includedNote:
    "Contacts are structured for outreach tools and CRM imports. Common fields include name, email, phone, company, category, state, and related details where available.",
  included: [
    { label: "B2B Decision Makers & Founders", value: 997 },
    { label: "SaaS / Tech Company Contacts", value: 797 },
    { label: "E-commerce & Online Sellers", value: 697 },
    { label: "Real Estate Agents & Brokers", value: 647 },
    { label: "Healthcare Professionals", value: 587 },
    { label: "Legal / Attorneys", value: 527 },
    { label: "Finance / Investors / Advisors", value: 677 },
    { label: "Marketing Agencies & Freelancers", value: 497 },
    { label: "Restaurant / Hospitality Owners", value: 457 },
    { label: "State-wise Contact Sheets", value: 897 },
    { label: "Timezone Tagged Outreach Lists", value: 547 },
    { label: "And many more categories..." },
  ],
  bonusIncluded: [
    {
      label: "CRM Tracking Blueprint System (starter template)",
      value: 497,
    },
    { label: "Outreach tip sheet for US cold email", value: 199 },
  ],

  reviews: [
    {
      name: "Jason Miller",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789741917/cb8cdac7-455d-4505-8105-44776c99fc52.png",
      quote:
        "Used the USA B2B sheet for a 2k cold email test. Bounce rate stayed low and we booked 5 demos in the first week. State tags made list building much faster.",
      rating: 5,
    },
    {
      name: "Priya Nair",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789741792/039a478f-42a2-48ef-9dba-fe5d4ab3b4b9.png",
      quote:
        "Timezone columns are a lifesaver for our calling team. We stopped waking people up at 6 AM their time. Clean enough for our CRM import with almost no cleanup.",
      rating: 5,
    },
    {
      name: "Marcus Cole",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789741751/68b835ba-2f0f-4086-b23a-80732274e707.png",
      quote:
        "Bought this after trying cheaper scraped lists. Way more usable work emails and fewer generic info@ addresses. Worth it for agency outreach.",
      rating: 5,
    },
    {
      name: "Ananya Shah",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789741721/5c6a6504-4957-45a9-ba55-efce15e2abf2.png",
      quote:
        "Category folders are well organized. Pulled California SaaS founders in under 10 minutes and launched a campaign the same evening.",
      rating: 4,
    },
    {
      name: "Daniel Brooks",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1788458314/c55fd900-d70f-44f5-b1ac-b32a2fbb35ff.png",
      quote:
        "Solid pack for the price. Not every number connects, but the email quality and niche filters are better than most bulk USA lists I have tried.",
      rating: 5,
    },
  ],

  howItWorks: [
    "Secure Checkout: Choose your payment method and complete the purchase on this page.",
    "Instant Delivery: You will immediately receive an email with your secure download and Google Drive access link.",
    "Download & Launch: Open the USA sheets, filter by state or niche, import into your tools, and start outreach.",
  ],

  faqs: [
    {
      question: "When will I receive my product?",
      answer:
        "You will receive instant access via email as soon as your payment is successfully processed.",
    },
    {
      question: "What format are the USA leads delivered in?",
      answer:
        "You get spreadsheet-friendly files (.xlsx / .csv style delivery) so you can open them in Excel, Google Sheets, or upload into most CRMs and email tools.",
    },
    {
      question: "Are the contacts tagged by state and timezone?",
      answer:
        "Yes. The pack is organized to help with state-wise filtering and timezone-aware scheduling for calls and emails.",
    },
    {
      question: "Can I use this for cold email and calling?",
      answer:
        "Yes. The lists are built for outbound sales workflows including cold email, dialer campaigns, and CRM-based follow-ups. Always follow local compliance rules for your outreach.",
    },
    {
      question: "Do I get lifetime access?",
      answer:
        "Yes. After purchase you keep lifetime access to the files you download.",
    },
  ],

  buyButtonLabel: "Download USA Leads Now",
  secondaryButtonLabel: "Add to cart",
  buyUrl: "#buy",
  footerNote:
    "Pay securely with Razorpay · Instant Google Drive link after payment",
};
