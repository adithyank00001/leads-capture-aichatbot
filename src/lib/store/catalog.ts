/**
 * Shop catalog for the homepage storefront.
 * Top-selling product links to the real checkout page: /store/product
 */

export type CatalogProduct = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  compareAtPrice: number | null;
  currencySymbol: string;
  image: string;
  imageAlt: string;
  href: string | null;
  badge?: string;
  topSelling?: boolean;
  rating: number;
  reviewCount: number;
  available: boolean;
};

export const shopCatalog: CatalogProduct[] = [
  {
    id: "pan-india-leads-2026",
    title: "110Cr+ All India Latest Leads (PAN INDIA DATABASE) 2026",
    subtitle:
      "200+ categories · Instant Google Drive download · USA leads bonus included",
    price: 397,
    compareAtPrice: 4997,
    currencySymbol: "₹",
    image:
      "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789738887/Social_media_educational_poster___20260918185159.webp",
    imageAlt: "110Cr+ All India Latest Leads database",
    href: "/store/product",
    badge: "Top selling",
    topSelling: true,
    rating: 4.9,
    reviewCount: 500,
    available: true,
  },
  {
    id: "usa-leads-premium",
    title: "USA Leads Premium Pack (150M+ Contacts)",
    subtitle: "300+ categories · State & timezone tagged · Clean B2B emails",
    price: 897,
    compareAtPrice: 2997,
    currencySymbol: "₹",
    image:
      "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789746243/Creating_educational_social_medi__20260918210816_1.webp",
    imageAlt: "USA Premium Leads — 150 Million+ verified B2B contacts",
    href: null,
    badge: "Out of stock",
    rating: 4.8,
    reviewCount: 86,
    available: false,
  },
  {
    id: "real-estate-leads",
    title: "Real Estate Leads Bundle — India",
    subtitle: "Buyers, agents & property leads · City-wise Excel sheets",
    price: 797,
    compareAtPrice: 1497,
    currencySymbol: "₹",
    image:
      "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789745763/Poster_promoting_real_estate_leads_20260918210133.webp",
    imageAlt: "Indian Real Estate Leads Bundle",
    href: null,
    badge: "Out of stock",
    rating: 4.8,
    reviewCount: 64,
    available: false,
  },
  {
    id: "whatsapp-scripts",
    title: "WhatsApp Outreach Scripts Pack",
    subtitle: "Ready-to-send scripts for cold outreach & follow-ups",
    price: 149,
    compareAtPrice: 799,
    currencySymbol: "₹",
    image:
      "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789745760/Creating_WhatsApp_outreach_scrip__20260918210129.webp",
    imageAlt: "WhatsApp Outreach Scripts Pack",
    href: null,
    badge: "Out of stock",
    rating: 4.6,
    reviewCount: 86,
    available: false,
  },
  {
    id: "crm-blueprint",
    title: "CRM Tracking Blueprint System",
    subtitle: "Excel CRM template to track calls, emails & deal stages",
    price: 497,
    compareAtPrice: 999,
    currencySymbol: "₹",
    image:
      "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789745761/Creating_social_media_educationa__20260918210125.webp",
    imageAlt: "CRM Tracking Blueprint System",
    href: null,
    badge: "Out of stock",
    rating: 4.6,
    reviewCount: 24,
    available: false,
  },
];
