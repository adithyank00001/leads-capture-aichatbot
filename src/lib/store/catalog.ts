/**
 * Shop catalog for the homepage storefront.
 * Buyable cards come from product files with `published: true`
 * (src/lib/store/products). Teaser cards below are display-only.
 */

import {
  getPublishedStoreProducts,
  getStoreProductPath,
} from "@/lib/store/products";

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

const publishedCards: CatalogProduct[] = getPublishedStoreProducts().map(
  (product) => ({
    id: product.slug,
    title: product.title,
    subtitle: product.catalogSubtitle || product.subtitle,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currencySymbol: product.currencySymbol,
    image: product.images[0]?.src ?? "",
    imageAlt: product.images[0]?.alt ?? product.title,
    href: getStoreProductPath(product),
    badge: product.badge,
    topSelling: product.topSelling,
    rating: product.rating,
    reviewCount: product.reviewCount,
    available: true,
  }),
);

/** Display-only "Out of stock" cards. Not buyable. */
const teaserCards: CatalogProduct[] = [
  {
    id: "usa-leads-premium",
    title: "USA Leads Premium Pack (10 Lakhs+ Contacts)",
    subtitle: "300+ categories · State & timezone tagged · Clean B2B emails",
    price: 897,
    compareAtPrice: 2997,
    currencySymbol: "₹",
    image:
      "https://res.cloudinary.com/ntv0bhpy/image/upload/v1789746243/Creating_educational_social_medi__20260918210816_1.webp",
    imageAlt: "USA Premium Leads — 10 Lakhs+ verified B2B contacts",
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

const publishedIds = new Set(publishedCards.map((card) => card.id));

export const shopCatalog: CatalogProduct[] = [
  ...publishedCards,
  ...teaserCards.filter((card) => !publishedIds.has(card.id)),
];
