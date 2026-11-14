import type { StoreProductConfig } from "@/lib/store/product-content";

/**
 * Sample test product page.
 * Public URL: /store/product/sample-product
 * Hidden from the homepage while published: false.
 * Strictly ₹1 test price, fully isolated, no emails sent.
 */
export const sampleProduct: StoreProductConfig = {
  slug: "sample-product",
  contentId: "sample-product",
  published: false,

  catalogSubtitle:
    "Sample test product · Sample Excel & CSV download · Strictly for testing",
  badge: "Sample Test",
  topSelling: false,

  download: {
    relativePrivatePath: "store/downloads/SAMPLE-TEST-DOCUMENT.pdf",
    fileName: "SAMPLE-TEST-DOCUMENT.pdf",
    contentType: "application/pdf",
  },
  driveDownloadUrl: null,

  price: 1,
  compareAtPrice: 99,
  currency: "INR",
  currencySymbol: "₹",

  brandName: "Sample Verified Seller",
  eyebrow: "Sample Testing Page · Not A Real Product · Test Mode:",
  title:
    "Sample Product Headline Title – Sample Test Leads Database (Sample Edition)",
  subtitleLead:
    "This is a sample product test page. All details shown here are sample details.",
  subtitle:
    "This is a sample product description. All details on this page are sample details created strictly for testing and checkout verification. Not a real commercial product.",
  rating: 5.0,
  reviewCount: 10,
  socialProofTag: "🧪 Sample test mode active",
  highlights: [
    "Sample Highlight 1: Sample test data entries and sample fields",
    "Sample Highlight 2: Sample filterable test columns for verification",
    "Sample Highlight 3: Sample testing checklist with instant sample download",
    {
      text: "Sample Test Bonus Pack Included (Sample Worth ₹5000+)",
      badge: "🎁 Sample Bonus",
      worth: "SAMPLE ₹5000",
      points: [
        "Sample Test Scraper Tool",
        "Sample Test Leads List (10Lakh+)",
        "Sample CRM Tracking Blueprint",
        "Sample & More...",
      ],
    },
  ],

  images: [
    {
      src: "https://res.cloudinary.com/ntv0bhpy/image/upload/v1794229789/Premium_HNI_Database_Access.png",
      alt: "Sample test product cover image",
    },
    {
      src: "https://res.cloudinary.com/ntv0bhpy/image/upload/v1794229856/1362015f-b6fb-41bf-8fda-a20884414eb2.png",
      alt: "Sample test spreadsheet preview",
    },
  ],

  options: [],
  defaultSelections: {},

  trustItems: [
    {
      title: "Sample instant access",
      description:
        "Sample download link generated immediately after ₹1 test payment",
    },
    {
      title: "Sample secure payment",
      description: "Sample test payment encrypted and processed by Razorpay",
    },
    {
      title: "Sample lifetime access",
      description: "Sample test files available for testing and verification",
    },
  ],

  description: [
    "This is a sample product page created solely for test and verification purposes.",
    "All details, headlines, bullet points, numbers, and descriptions on this page are sample details and do not represent a real commercial product.",
    "You can safely use this page to test the complete live payment flow at ₹1.",
  ],

  useCasesHeadline: "Sample Test Scenarios",
  useCasesNote: "Sample test cases for verifying checkout functionality:",
  useCases: [
    {
      icon: "🧪",
      title: "Sample Test Scenario 1",
      description:
        "Verifying live payment gateway integration at the minimum ₹1 fee.",
    },
    {
      icon: "🔄",
      title: "Sample Test Scenario 2",
      description: "Verifying redirect to the order success screen.",
    },
    {
      icon: "📁",
      title: "Sample Test Scenario 3",
      description: "Verifying direct sample download token generation.",
    },
  ],

  includedHeadline: "What's Included (Sample Test Details)",
  includedNote: "Sample test package structured for testing:",
  included: [
    {
      label: "Sample Test Item 1: Sample contacts sheet (Excel & CSV format)",
    },
    { label: "Sample Test Item 2: Sample data structure guidelines" },
    { label: "Sample Test Item 3: Sample testing verification guide" },
    { label: "Sample & More..." },
  ],

  bonusWorth: "Sample Worth ₹5,000",
  bonusIncluded: [
    {
      label: "SAMPLE BONUS 1: Sample Scraper Tool",
      value: 2000,
    },
    {
      label: "SAMPLE BONUS 2: Sample Test Database (10Lakh+)",
      value: 2000,
    },
    {
      label: "SAMPLE BONUS 3: Sample CRM Blueprint",
      value: 1000,
    },
    {
      label: "Sample & More...",
    },
  ],

  reviews: [
    {
      name: "Sample Tester One",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1794230900/efa29118-49ce-406d-bde9-365e14f57ea7.png",
      quote:
        "This is a sample test review. The sample ₹1 checkout flow and instant sample download worked cleanly.",
      rating: 5,
    },
    {
      name: "Sample Tester Two",
      avatar:
        "https://res.cloudinary.com/ntv0bhpy/image/upload/v1794230869/84054a7f-a272-47a4-897e-93eadd42491a.png",
      quote:
        "Sample test review confirming that payment verification and sample file downloading are functioning.",
      rating: 5,
    },
  ],

  howItWorks: [
    "Step 1 (Sample): Click the test button and pay sample ₹1 via Razorpay.",
    "Step 2 (Sample): Payment confirmation is verified by the server.",
    "Step 3 (Sample): Instant access to the sample test download file.",
  ],

  faqs: [
    {
      question: "Is this a real product?",
      answer:
        "No. This is a sample product page with sample details created exclusively for testing.",
    },
    {
      question: "Will any confirmation email be sent?",
      answer:
        "No. Confirmation emails are completely disabled for this sample test product.",
    },
    {
      question: "How much is charged?",
      answer:
        "A sample charge of ₹1 (minimum transaction) for checkout testing.",
    },
    {
      question: "What files do I get?",
      answer:
        "A sample test PDF containing sample verification details.",
    },
  ],

  buyButtonLabel: "Download Sample (₹1 Test)",
  secondaryButtonLabel: "Add to cart",
  buyUrl: "#buy",
  footerNote:
    "Sample test mode · Pay ₹1 securely with Razorpay · Instant sample download · No emails sent",
  finalCta: {
    headline: "Sample Testing Page Final Call to Action",
    body: "This is a sample test product. Test price is strictly ₹1.",
  },
};

