# Store Product Guide (for AI and humans)

This guide explains how to add or edit digital store products **without breaking** the live ads product.

Read this file **before** creating or changing any store product.

---

## Critical rules (never skip)

1. **Never change the live ads URL** `/store/product`.
2. **Never rename** the live ads slug `pan-india-leads-2026` unless the user explicitly asks.
3. **Never invent a second Meta Pixel** or per-product Razorpay keys.
4. **Never trust a price from the browser.** The server reads price from the product file.
5. **Never edit shared design components “just for one product.”** That would change every product.
6. **Never delete or rewrite** buy / track / timer / zoom code while changing design.
7. New products start with **`published: false`**. Only set `true` when the user says they are ready for the homepage.

---

## How the store works (simple)

| Piece | What it is |
|--------|------------|
| Product file | All content: title, price, images, reviews, PDF path, Drive URL, `published` |
| Shared page UI | Same design for every product (hero, details, zoom, timer) |
| Shared payment | Same Razorpay keys (3 env secrets) for the whole site |
| Shared Meta | One Pixel + one CAPI token. Each product sends its own `contentId` |
| Homepage | Shows only products with `published: true`, plus old “Out of stock” teasers |

### URLs

| Product | URL |
|---------|-----|
| Live ads (PAN India) | `/store/product` only |
| Any other product | `/store/product/<slug>` |
| `/store/product/pan-india-leads-2026` | **404 on purpose** (ads URL stays the only public page for that product) |

---

## Folder map

```text
src/lib/store/products/
  _TEMPLATE.ts              ← copy this (do not register it)
  pan-india-leads-2026.ts   ← live ads product content
  index.ts                  ← registry: import + list products
  your-new-slug.ts          ← new products go here

private/store/downloads/    ← PDF files (not public URLs)
STORE-PRODUCT-GUIDE.md      ← this file
.cursor/rules/store-products.mdc
```

Types live in `src/lib/store/product-content.ts`.  
`storeProduct` is re-exported from the registry so old imports keep working.

---

## Step-by-step: create a new product

### 1) Copy the template

Copy:

`src/lib/store/products/_TEMPLATE.ts`

To:

`src/lib/store/products/<your-slug>.ts`

Example: `usa-leads.ts`

### 2) Rename the export

Change:

`export const templateProduct`

To a camelCase name, e.g.:

`export const usaLeads`

### 3) Fill every field

Required identity fields:

- `slug` — lowercase letters, numbers, dashes only (example: `usa-leads`)
- `contentId` — **same string as slug** (Meta tracking)
- `published` — keep **`false`** while testing
- `price` — Razorpay charges this amount (INR)
- `download.relativePrivatePath` — path under `private/` (example: `store/downloads/USA-LEADS.pdf`)
- `download.fileName` — download filename
- `download.contentType` — usually `application/pdf`
- `driveDownloadUrl` — optional Google Drive link, or `null`

Also fill: title, subtitle, images, reviews, FAQs, highlights, etc.

**Images / reviews / FAQs:** copy an existing block in the array to add another item.

### 4) Put the PDF on disk

Place the file at:

`private/<relativePrivatePath>`

Example: if `relativePrivatePath` is `store/downloads/USA-LEADS.pdf`, the file must exist at:

`private/store/downloads/USA-LEADS.pdf`

### 5) Register the product

Edit `src/lib/store/products/index.ts`:

1. Import your product at the top.
2. Add it to `REGISTERED_PRODUCTS`.

Example:

```ts
import { usaLeads } from "@/lib/store/products/usa-leads";

const REGISTERED_PRODUCTS: StoreProductConfig[] = [
  panIndiaLeads2026,
  usaLeads,
];
```

### 6) Test the secret URL

Open:

`/store/product/<your-slug>`

Checklist while `published: false`:

- [ ] Page loads with correct title, images, price
- [ ] Product is **not** on the homepage
- [ ] Buy opens Razorpay with the **product file price**
- [ ] Meta ViewContent / InitiateCheckout use this product’s `contentId` (Events Manager / test events)
- [ ] After pay (test carefully), download + email use this product’s PDF / Drive link

### 7) Publish to homepage

When the user is happy:

1. Set `published: true` in that product file.
2. Redeploy.
3. Confirm the homepage shows the new card and links to `/store/product/<slug>` (not `/store/product` unless it is the live ads product).

---

## Edit an existing product (content only)

1. Open that product’s file under `src/lib/store/products/`.
2. Change text, images, reviews, price, Drive URL, PDF path as needed.
3. Do **not** change `slug` or `contentId` unless the user explicitly asks (breaks ads / purchase history / Meta matching).

### Live ads product special rules

File: `src/lib/store/products/pan-india-leads-2026.ts`

- Page URL is always `/store/product`
- Env `NEXT_PUBLIC_STORE_PRICE_INR` overrides **only this product’s** price (useful for local ₹1 tests)
- Env `STORE_DRIVE_DOWNLOAD_URL` is the fallback Drive link for this product if `driveDownloadUrl` is empty/null
- Do not move this product to a slug URL

---

## Price, Razorpay, Meta (do not reinvent)

### Price

- Each product file has its own `price`.
- Changing USA price does **not** change PAN India price.
- `NEXT_PUBLIC_STORE_PRICE_INR` affects **live ads product only**.

### Razorpay

- Site-wide keys only: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- Local/dev usually uses Razorpay **test** keys; production uses **live** keys
- There is **no** Razorpay “product ID” to create per store item (unlike old Dodo)
- The app creates an order with the amount from the product file

### Meta Pixel + CAPI

- One Pixel ID + one CAPI token for the whole site
- Each product sends `content_ids: [contentId]` and its title as `content_name`
- Do not add a new Pixel per product

---

## Design changes (isolation rules)

The hero file (`product-hero.tsx`) is **mixed**: it contains both layout and buy/track wiring. That is intentional for v1.

### Safe content-only change

Edit the product file only. Shared UI stays the same. Other products unaffected.

### Safe one-product design change later

1. **Copy** the section component you want to change into a **new file** with a new name.
2. Change only the look in the copy (HTML/CSS/structure).
3. Keep calling the **same** shared buy / track / payment helpers.
4. Wire **only that product’s page** (or a product-specific composition) to use the new section.
5. Do **not** edit the shared section “just for this product.”

### Unsafe (do not do)

- Delete or rewrite `handleBuy`, `trackStoreViewContent`, `trackStoreInitiateCheckout`, timer, or zoom while “just redesigning”
- Edit shared `product-hero.tsx` / `store.css` for one product only
- Build a magic config like `faqStyle: "boxes"` unless the user asks for a real system
- Copy the entire Razorpay / Pixel stack into a product file

There is **no** pre-built design menu. New section designs are created only when requested, by copying a section.

---

## Homepage behavior

- `published: true` → appears as a buyable card
- `published: false` → secret URL works; not listed on home
- Live ads card always links to `/store/product`
- Other published products link to `/store/product/<slug>`
- Existing “Out of stock” teaser cards stay in `src/lib/store/catalog.ts` as display-only

---

## Downloads and old purchases

- New purchases store `product_slug` and get that product’s PDF
- Unknown slug → no download (never guess another product’s file)
- Legacy purchase slug `poster-pack` still maps to the live ads PDF (do not remove that mapping)

---

## Final checklist before saying “done”

- [ ] Product file filled and registered in `index.ts`
- [ ] PDF exists under `private/`
- [ ] `published: false` until user asks to publish
- [ ] `/store/product` still works for PAN India (URL unchanged)
- [ ] New product URL works (if not the live ads product)
- [ ] Homepage only shows published products
- [ ] No second Meta Pixel / no per-product Razorpay keys added
- [ ] Did not rewire buy/track while editing design

If anything is unclear, ask the user before changing shared payment, Pixel, or the live ads page.
