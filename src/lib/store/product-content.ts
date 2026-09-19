/**
 * ============================================================
 * EDIT THIS FILE ONLY — change all product page content here.
 * Page design stays the same. Open: /store/product
 * ============================================================
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
  /** Product title */
  title: string;
  /** Short line under the title */
  subtitle: string;
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
  /** How customers use the product */
  useCases: ProductUseCase[];
  /** Headline above the included checklist */
  includedHeadline: string;
  /** Short note under the included headline */
  includedNote: string;
  /** Checklist in “What’s included” */
  included: string[];
  /** Extra bonus databases shown under the main list */
  bonusIncluded: string[];
  /** Customer reviews */
  reviews: ProductReview[];
  /** Steps in “How it works” */
  howItWorks: string[];
  faqs: ProductFaq[];
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

export const storeProduct: StoreProductContent = {
  brandName: "Verified Seller",
  title: "110Cr+ All India Latest Leads (PAN INDIA DATABASE) 2026",
  subtitle:
    "Unlock 110 Crore+ Verified Indian Contacts with 200+ categories to Scale Your Sales & Marketing Instantly.",
  price: 397,
  compareAtPrice: 4997,
  currency: "INR",
  currencySymbol: "₹",
  rating: 4.9,
  reviewCount: 500,
  highlights: [
    "Instant digital download via Google Drive",
    "110 Crore+ High Quality Verified B2B & B2C Contacts",
    "Includes Name, Email, Phone, WhatsApp & Location details",
    "Lifetime access to all downloaded files",
    {
      text: "150 Millions + free USA Leads database with 300+ categories",
      badge: "Bonus",
    },
  ],
  socialProofTag: "🔥 150+ sold yesterday!",
  images: [
    {
      src: "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789738887/Social_media_educational_poster___20260918185159.webp",
      alt: "110Cr+ All India Latest Leads PAN India Database 2026",
    },
    {
      src: "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789736328/Sample_category_New_Business_Owners_Category_1.webp",
      alt: "Sample category — New Business Owners Category",
    },
    {
      src: "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789739160/77996ae4-239b-4a81-a631-6bf4efa7b324.png",
      alt: "Database folders — All India Database 2026, Bonus Database, USA Leads",
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
    "Stop struggling to find your next clients. This PAN India 2026 Database gives you instant access to over 110 Crore verified contacts across India, providing the ultimate fuel for unlimited lead generation.",
    "This high-quality data is categorized and structured so you can immediately reach your ideal customers. It is the perfect foundational asset to grow your business using:",
  ],
  useCases: [
    {
      title: "Email Marketing Campaigns",
      description:
        "Use targeted email lists to promote your products or services at scale.",
    },
    {
      title: "WhatsApp Marketing",
      description:
        "Send tailored offers and content directly to segmented contact lists for higher engagement.",
    },
    {
      title: "Cold Outreach",
      description:
        "Initiate direct outreach to introduce your services to new businesses and form profitable partnerships.",
    },
    {
      title: "Market Research",
      description:
        "Conduct deep market research by sending out surveys to a massive audience.",
    },
  ],
  includedHeadline: "The Complete 2026 PAN India Database (110 Crore+ Records)",
  includedNote:
    "Every contact includes Category, Name, Email, Phone, WhatsApp, Location, and other essential details. The database is comprehensively segmented into the following high-value categories:",
  included: [
    "B2B | B2C | Companies",
    "HNI / High-Income Employees",
    "Advocates / Lawyers",
    "Website Owners",
    "Car Owners",
    "NRIs",
    "Real Estate Leads & Property Buyers",
    "Manufacturing Companies & Garments Exporters",
    "Architects | Interior Designers",
    "BPO / Call Centres",
    "CEO / CFO / CMO / MD / IT Heads",
    "C.A | Investors & Demat Account Holders",
    "Chairmen",
    "Doctors, Chemists & Chemical/Pharma Companies",
    "Professors, Teachers & Students",
    "School / College / Educational Institutes",
    "Event Management Organisers",
    "Exporters Database",
    "Beauty Parlours / SPA (Female Demographics)",
    "Job Seekers",
    "Credit Card Holders & Bank Database",
    "State Wise Data",
    "Photography Studios",
    "HR | IT Companies",
    "Hotels / Restaurants / Bars",
    "Real Estate Agents",
    "Online User & Shopper Database",
    "And many more...",
  ],
  bonusIncluded: [
    "USA Leads Database (150 Millions+ leads with 300+ categories)",
    "CRM Tracking Blueprint System",
    "And many more...",
  ],
  reviews: [
    {
      name: "Rohan Mehta",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789741917/cb8cdac7-455d-4505-8105-44776c99fc52.png",
      quote:
        "Bro the Pan India list is genuinely active. Usually when you buy bulk data online half the numbers are switched off or out of service, but my calling team had a solid connect rate today on the Bangalore and Mumbai sheets. Still need to test the US file tomorrow, but so far worth the money.",
      rating: 5,
    },
    {
      name: "Arjun Sharma",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789741792/039a478f-42a2-48ef-9dba-fe5d4ab3b4b9.png",
      quote:
        "Bought both the India and US datasets. The US sheet is surprisingly clean, mostly proper direct work emails instead of useless info@ or contact@ junk. Ran a test batch through an email verifier first and the bounce rate was only around 4-5%, which is rare for bulk lists at this price point.",
      rating: 5,
    },
    {
      name: "Vikram Singh",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789741751/68b835ba-2f0f-4086-b23a-80732274e707.png",
      quote:
        "bro data is solid. sent cold emails to a batch of 300 from the US B2B sheet yesterday and already got 2 positive responses. share your UPI again, want to get another batch for the real estate niche if you have it.",
      rating: 5,
    },
    {
      name: "Aditya Patel",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789741721/5c6a6504-4957-45a9-ba55-efce15e2abf2.png",
      quote:
        "Good segmentation by state and category. Saved our team hours that the Delhi-NCR and Maharashtra tabs were already separated cleanly. Found maybe 15 or 20 duplicate rows across the whole sheet, but honestly compared to the recycled 2021 lists other sellers circulate, this is remarkably fresh. 9/10.",
      rating: 5,
    },
    {
      name: "Fatima Khan",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1788458314/c55fd900-d70f-44f5-b1ac-b32a2fbb35ff.png",
      quote:
        "I was expecting recycled scrap data since 90% of database sellers just resell the same leaked trash, but these contacts are actually relevant. Called about 40 local business numbers from the Indian list this afternoon and almost all were actively picking up. Will be back for more.",
      rating: 5,
    },
    {
      name: "Karthik Reddy",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1788458287/f55fa1f1-b460-4821-af43-0f62ffba5db1.png",
      quote:
        "Legit seller. The USA leads folder had proper state and timezone tags, which made scheduling our outreach campaigns much easier without accidentally emailing people at 3 AM their time. Clean Excel files, no weird formatting errors when opening.",
      rating: 5,
    },
    {
      name: "Nikhil Verma",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1788458255/e6a23fe0-7623-4e17-8a13-878844eeed19.png",
      quote:
        "honestly surprised by the quality. uploaded about 5k numbers from the pan-India folder into our auto-dialer this morning and the connection rate was solid, barely any invalid numbers. haven't dug deep into the US sheet yet but if it's as clean as the indian one I'll definitely be buying the next update. good stuff man",
      rating: 5,
    },
  ],
  howItWorks: [
    "Secure Checkout: Choose your payment method and complete the purchase on this page.",
    "Instant Delivery: You will immediately receive an email via Gmail containing your secure Google Drive access link.",
    "Download & Launch: Download the database files, import the contacts into your marketing tools, and start making revenue from next day.",
  ],
  faqs: [
    {
      question: "When will I receive my product?",
      answer:
        "You will receive instant access to the Google Drive link via email the moment your payment is successfully processed.",
    },
    {
      question: "How long will I have access to the content in the database?",
      answer:
        "Once you purchase, you receive lifetime access to download and use the database files.",
    },
    {
      question: "Are these leads actually useful?",
      answer:
        "Yes, the database is structured to generate high-quality leads that are actively interested in a wide variety of products and services.",
    },
  ],
  buyButtonLabel: "Download My Leads Now",
  secondaryButtonLabel: "Add to cart",
  buyUrl: "#buy",
  footerNote:
    "Pay securely with Razorpay · Instant Google Drive link after payment",
};
