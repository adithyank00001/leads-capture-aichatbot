"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Check,
  ChevronRight,
  Download,
  Lock,
  Minus,
  Plus,
  X,
  Zap,
  ZoomIn,
} from "lucide-react";

import { ProductImage } from "@/components/store/product-image";
import { ProductStars } from "@/components/store/product-stars";
import {
  trackStoreInitiateCheckout,
  trackStoreViewContent,
} from "@/lib/meta/store-track";
import { readBrowserMetaClickIds } from "@/lib/meta/fbc";
import { isValidStoreEmail, normalizeStoreEmail } from "@/lib/store/email";
import {
  openRazorpayCheckout,
  type RazorpaySuccessResponse,
} from "@/lib/store/load-razorpay";
import { formatMoney, formatReviewCount } from "@/lib/store/product-format";
import type { StoreProductContent } from "@/lib/store/product-content";
import { cn } from "@/lib/utils";

const ProductImageZoomLightbox = dynamic(
  () =>
    import("@/components/store/product-image-zoom-lightbox").then(
      (m) => m.ProductImageZoomLightbox,
    ),
  { ssr: false },
);

function prefetchZoomLightbox() {
  void import("@/components/store/product-image-zoom-lightbox");
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

const OFFER_TIMER_KEY = "store-offer-timer-v11";
/** Fresh browser open starts at 19:49:28 */
const OFFER_START_MS = ((19 * 60 + 49) * 60 + 28) * 1000;
/** When timer hits 00:15:00, bump back to 00:45:24 */
const OFFER_SOFT_FLOOR_MS = 15 * 60 * 1000;
const OFFER_SOFT_RESET_MS = (45 * 60 + 24) * 1000;
/** At local midnight, restart only if under 2 hours left */
const OFFER_MIDNIGHT_RESET_IF_UNDER_MS = 2 * 60 * 60 * 1000;

const LICENSE_STOCK_KEY = "store-license-stock-v6";
const LICENSE_MAX = 14;
/** Drop by 1 every hour; at 1, next hour → 14 */
const LICENSE_TICK_MS = 60 * 60 * 1000;
/** Soft reset must always be above the floor or the timer would loop every second */
const OFFER_SOFT_RESET_SAFE_MS =
  OFFER_SOFT_RESET_MS > OFFER_SOFT_FLOOR_MS
    ? OFFER_SOFT_RESET_MS
    : OFFER_SOFT_FLOOR_MS + 60_000;

type OfferTimerState = {
  deadlineMs: number;
  /** Local calendar day last seen, e.g. "2026-09-22" */
  dayKey: string;
};

type LicenseStockState = {
  count: number;
  nextTickMs: number;
};

/** In-memory fallback if localStorage is blocked (private mode / quota). */
let memoryOfferTimer: OfferTimerState | null = null;
let memoryLicenseStock: LicenseStockState | null = null;

function localDayKey(now = Date.now()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function clampLicenseCount(value: number) {
  if (!Number.isFinite(value)) return LICENSE_MAX;
  return Math.min(LICENSE_MAX, Math.max(1, Math.round(value)));
}

function isValidDayKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function readOfferTimerState(): OfferTimerState | null {
  try {
    const raw = window.localStorage.getItem(OFFER_TIMER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OfferTimerState>;
      if (
        typeof parsed.deadlineMs === "number" &&
        Number.isFinite(parsed.deadlineMs) &&
        parsed.deadlineMs > 0 &&
        isValidDayKey(parsed.dayKey)
      ) {
        const state = {
          deadlineMs: parsed.deadlineMs,
          dayKey: parsed.dayKey,
        };
        memoryOfferTimer = state;
        return state;
      }
    }
  } catch {
    // fall through to memory
  }
  return memoryOfferTimer;
}

function writeOfferTimerState(state: OfferTimerState) {
  memoryOfferTimer = state;
  try {
    window.localStorage.setItem(OFFER_TIMER_KEY, JSON.stringify(state));
  } catch {
    // private mode / quota — memory still keeps this tab stable
  }
}

function readLicenseStockState(): LicenseStockState | null {
  try {
    const raw = window.localStorage.getItem(LICENSE_STOCK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LicenseStockState>;
      if (
        typeof parsed.count === "number" &&
        Number.isFinite(parsed.count) &&
        typeof parsed.nextTickMs === "number" &&
        Number.isFinite(parsed.nextTickMs) &&
        parsed.nextTickMs > 0
      ) {
        const state = {
          count: clampLicenseCount(parsed.count),
          nextTickMs: parsed.nextTickMs,
        };
        memoryLicenseStock = state;
        return state;
      }
    }
  } catch {
    // fall through to memory
  }
  return memoryLicenseStock;
}

function writeLicenseStockState(state: LicenseStockState) {
  memoryLicenseStock = state;
  try {
    window.localStorage.setItem(LICENSE_STOCK_KEY, JSON.stringify(state));
  } catch {
    // private mode / quota — memory still keeps this tab stable
  }
}

/**
 * Apply N hourly ticks: 14 → 13 → … → 2 → 1 → 14 (never stuck at 0).
 */
function advanceLicenseCount(count: number, ticks: number) {
  const safeCount = clampLicenseCount(count);
  const safeTicks = Math.max(0, Math.floor(ticks));
  if (safeTicks === 0) return safeCount;
  // index 0 = 14, index 13 = 1
  const index = LICENSE_MAX - safeCount;
  const nextIndex = (index + safeTicks) % LICENSE_MAX;
  return LICENSE_MAX - nextIndex;
}

function resolveLicenseStock(now = Date.now()): number {
  const existing = readLicenseStockState();

  if (!existing) {
    const fresh = {
      count: LICENSE_MAX,
      nextTickMs: now + LICENSE_TICK_MS,
    };
    writeLicenseStockState(fresh);
    return fresh.count;
  }

  let count = clampLicenseCount(existing.count);
  let nextTickMs = existing.nextTickMs;

  // Corrupted far-future tick → would never decrement (stuck). Fix it.
  if (nextTickMs > now + LICENSE_TICK_MS * 2) {
    nextTickMs = now + LICENSE_TICK_MS;
  }

  // Catch up after sleep / background tabs (no long while-loops).
  if (nextTickMs <= now) {
    const elapsed = now - nextTickMs;
    const ticks = Math.floor(elapsed / LICENSE_TICK_MS) + 1;
    count = advanceLicenseCount(count, ticks);
    nextTickMs += ticks * LICENSE_TICK_MS;
    // Still behind (clock jump) → schedule next hour from now
    if (nextTickMs <= now) {
      nextTickMs = now + LICENSE_TICK_MS;
    }
  }

  count = clampLicenseCount(count);
  writeLicenseStockState({ count, nextTickMs });
  return count;
}

/**
 * Per-browser offer timer:
 * - First open: 19:49:28
 * - Hits ≤ 00:15:00 → jump to 00:45:24
 * - Local midnight: restart to 19:49:28 only if under 2 hours left
 */
function resolveOfferTimer(now = Date.now()): {
  deadlineMs: number;
  remainingSeconds: number;
} {
  const today = localDayKey(now);
  const existing = readOfferTimerState();

  let deadlineMs = existing?.deadlineMs ?? now + OFFER_START_MS;
  let dayKey = existing && isValidDayKey(existing.dayKey) ? existing.dayKey : today;

  if (!existing) {
    writeOfferTimerState({ deadlineMs, dayKey: today });
    return {
      deadlineMs,
      remainingSeconds: Math.floor(OFFER_START_MS / 1000),
    };
  }

  // Midnight crossed: reset only when less than 2 hours remain
  if (dayKey !== today) {
    const remainingAtMidnight = deadlineMs - now;
    if (
      !Number.isFinite(remainingAtMidnight) ||
      remainingAtMidnight < OFFER_MIDNIGHT_RESET_IF_UNDER_MS
    ) {
      deadlineMs = now + OFFER_START_MS;
    }
    dayKey = today;
  }

  let remainingMs = deadlineMs - now;

  // Absurd future deadline (corrupt storage / bad clock) → clamp
  if (!Number.isFinite(remainingMs) || remainingMs > OFFER_START_MS) {
    deadlineMs = now + OFFER_START_MS;
    remainingMs = OFFER_START_MS;
  }

  // Soft loop: at/under 15:00 → restart at 45:24 (always above floor)
  if (remainingMs > 0 && remainingMs <= OFFER_SOFT_FLOOR_MS) {
    deadlineMs = now + OFFER_SOFT_RESET_SAFE_MS;
    remainingMs = OFFER_SOFT_RESET_SAFE_MS;
  }

  // Fully expired → fresh start (never stuck at 00:00:00)
  if (remainingMs <= 0) {
    deadlineMs = now + OFFER_START_MS;
    remainingMs = OFFER_START_MS;
  }

  writeOfferTimerState({ deadlineMs, dayKey });

  return {
    deadlineMs,
    remainingSeconds: Math.max(0, Math.floor(remainingMs / 1000)),
  };
}

function OfferCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [licensesLeft, setLicensesLeft] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    function syncAll() {
      if (cancelled) return;
      setRemaining(resolveOfferTimer().remainingSeconds);
      setLicensesLeft(resolveLicenseStock());
    }

    function onVisible() {
      if (document.visibilityState === "visible") {
        syncAll();
      }
    }

    syncAll();
    const timerId = window.setInterval(syncAll, 1000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", syncAll);

    return () => {
      cancelled = true;
      window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", syncAll);
    };
  }, []);

  return (
    <div className="store-offer-timer" aria-live="polite">
      <p className="store-offer-timer-title">Offer ending soon</p>
      <p className="store-offer-timer-licenses" suppressHydrationWarning>
        {licensesLeft == null ? (
          <>
            <span className="store-offer-timer-licenses-count">14</span>{" "}
            licenses remaining
          </>
        ) : (
          <>
            <span className="store-offer-timer-licenses-count">
              {licensesLeft}
            </span>{" "}
            licenses remaining
          </>
        )}
      </p>
      <p className="store-offer-timer-digits" suppressHydrationWarning>
        {remaining == null ? "--:--:--" : formatCountdown(remaining)}
      </p>
    </div>
  );
}

type Props = {
  product: StoreProductContent;
};

/**
 * Gallery + buy box + sticky CTA.
 * CTA → email modal.
 * Continue → InitiateCheckout (with email) + Razorpay checkout.
 */
export function ProductHero({ product }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState(product.defaultSelections);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const checkoutLock = useRef(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const unitPrice = useMemo(() => {
    let total = product.price;
    for (const option of product.options) {
      const selected = selections[option.id];
      const match = option.values.find((v) => v.value === selected);
      if (match?.priceAdjust) total += match.priceAdjust;
    }
    return total;
  }, [product.options, product.price, selections]);

  const lineTotal = unitPrice * quantity;
  const buyLabel = product.buyButtonLabel;

  const viewContentSent = useRef(false);

  useEffect(() => {
    if (viewContentSent.current) return;
    viewContentSent.current = true;
    trackStoreViewContent({
      value: product.price,
      currency: product.currency,
      contentName: product.title,
      contentIds: ["pan-india-leads-2026"],
    });
  }, [product.currency, product.price, product.title]);

  useEffect(() => {
    void fetch("/api/store/razorpay/order", {
      method: "GET",
      cache: "no-store",
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    function onPageShow() {
      checkoutLock.current = false;
      setStartingCheckout(false);
    }

    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useEffect(() => {
    if (!emailModalOpen) return;
    const t = window.setTimeout(() => emailInputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [emailModalOpen]);

  useEffect(() => {
    if (!emailModalOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !checkoutLock.current) {
        setEmailModalOpen(false);
        setEmailError(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [emailModalOpen]);

  function selectOption(optionId: string, value: string) {
    setSelections((prev) => ({ ...prev, [optionId]: value }));
  }

  function resetCheckoutUi() {
    checkoutLock.current = false;
    setStartingCheckout(false);
  }

  function closeEmailModal() {
    if (checkoutLock.current) return;
    setEmailModalOpen(false);
    setEmailError(null);
  }

  /** CTA click: open email modal only (no InitiateCheckout yet). */
  function handleBuy() {
    if (emailModalOpen || startingCheckout) return;

    setPayError(null);
    setEmailError(null);
    setEmailModalOpen(true);
  }

  async function verifyAndRedirect(
    response: RazorpaySuccessResponse,
    buyerEmail: string,
  ) {
    const clickIds = readBrowserMetaClickIds();
    const res = await fetch("/api/store/razorpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        customer_email: buyerEmail,
        ...(clickIds.fbp ? { fbp: clickIds.fbp } : {}),
        ...(clickIds.fbc ? { fbc: clickIds.fbc } : {}),
      }),
      cache: "no-store",
    });
    const data = (await res.json()) as {
      ok?: boolean;
      redirectUrl?: string;
      error?: { message?: string };
    };

    if (!res.ok || !data.ok || !data.redirectUrl) {
      throw new Error(data.error?.message ?? "Could not verify payment.");
    }

    window.location.assign(data.redirectUrl);
  }

  /** Continue: real InitiateCheckout (with email) + open Razorpay. */
  async function handleEmailContinue(event: FormEvent) {
    event.preventDefault();
    if (checkoutLock.current || startingCheckout) return;

    const buyerEmail = normalizeStoreEmail(email);
    if (!isValidStoreEmail(buyerEmail)) {
      setEmailError("Please enter a valid email.");
      return;
    }

    checkoutLock.current = true;
    setEmailError(null);
    setPayError(null);
    setStartingCheckout(true);

    // Strong Meta signal: InitiateCheckout + Advanced Matching with email now.
    trackStoreInitiateCheckout({
      value: lineTotal,
      currency: product.currency,
      quantity,
      contentName: product.title,
      contentIds: ["pan-india-leads-2026"],
      email: buyerEmail,
    });

    try {
      const clickIds = readBrowserMetaClickIds();
      const res = await fetch("/api/store/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          selections,
          email: buyerEmail,
          eventSourceUrl:
            typeof window !== "undefined" ? window.location.href : undefined,
          ...(clickIds.fbp ? { fbp: clickIds.fbp } : {}),
          ...(clickIds.fbc ? { fbc: clickIds.fbc } : {}),
        }),
        cache: "no-store",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        orderId?: string;
        amount?: number;
        currency?: string;
        keyId?: string;
        productName?: string;
        description?: string;
        email?: string;
        error?: { message?: string };
      };

      if (
        !res.ok ||
        !data.ok ||
        !data.orderId ||
        !data.keyId ||
        data.amount == null
      ) {
        throw new Error(data.error?.message ?? "Could not start checkout.");
      }

      setEmailModalOpen(false);

      await openRazorpayCheckout({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency ?? "INR",
        name: data.productName ?? product.brandName,
        description:
          data.description ??
          "Complete payment to receive your leads database",
        order_id: data.orderId,
        prefill: { email: data.email ?? buyerEmail },
        handler: (response) => {
          void verifyAndRedirect(response, buyerEmail).catch((error) => {
            setPayError(
              error instanceof Error
                ? error.message
                : "Payment received but verification failed. Contact support.",
            );
            resetCheckoutUi();
          });
        },
        modal: {
          ondismiss: () => {
            resetCheckoutUi();
          },
        },
      });
    } catch (error) {
      setEmailError(
        error instanceof Error ? error.message : "Could not start payment.",
      );
      resetCheckoutUi();
    }
  }

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-20">
        <section aria-label="Product images" className="store-gallery">
          <button
            type="button"
            className="store-main-image store-main-image-zoom"
            onClick={() => setZoomOpen(true)}
            onPointerEnter={prefetchZoomLightbox}
            onFocus={prefetchZoomLightbox}
            aria-label="Open image zoom"
          >
            <ProductImage
              src={product.images[activeImage]?.src ?? product.images[0].src}
              alt={product.images[activeImage]?.alt ?? product.images[0].alt}
              priority
              sizes="(max-width: 1024px) 100vw, 52vw"
            />
            {product.socialProofTag ? (
              <span className="store-social-proof">
                {product.socialProofTag}
              </span>
            ) : null}
            <span className="store-zoom-cue">
              <ZoomIn className="size-3.5" />
              Click to zoom
            </span>
          </button>

          <div className="mt-3 grid grid-cols-3 gap-2.5 sm:mt-4 sm:gap-3">
            {product.images.map((image, index) => {
              const selected = index === activeImage;
              return (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={cn("store-thumb", selected && "is-active")}
                  aria-label={`Show image ${index + 1}`}
                  aria-pressed={selected}
                >
                  <ProductImage
                    src={image.src}
                    alt=""
                    sizes="120px"
                    width={150}
                  />
                </button>
              );
            })}
          </div>
        </section>

        <section className="store-buybox" aria-label="Buy product">
          <p className="store-eyebrow">Digital download · Instant access</p>
          <h1 className="store-title">{product.title}</h1>
          <p className="store-subtitle">{product.subtitle}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ProductStars rating={product.rating} />
            <span className="text-sm text-[var(--store-muted)]">
              {product.rating.toFixed(1)} ·{" "}
              {formatReviewCount(product.reviewCount)} customers
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <p className="store-price">
              {formatMoney(unitPrice, product.currencySymbol)}
            </p>
            {product.compareAtPrice != null ? (
              <p className="store-compare">
                {formatMoney(product.compareAtPrice, product.currencySymbol)}
              </p>
            ) : null}
            {product.compareAtPrice != null &&
            product.compareAtPrice > unitPrice ? (
              <span className="store-save">
                Save{" "}
                {formatMoney(
                  product.compareAtPrice - unitPrice,
                  product.currencySymbol,
                )}
              </span>
            ) : null}
          </div>
          <OfferCountdown />

          <ul className="store-highlights">
            {product.highlights.map((item) => {
              const text = typeof item === "string" ? item : item.text;
              const badge = typeof item === "string" ? undefined : item.badge;
              return (
                <li key={text}>
                  <Check className="size-4 shrink-0 text-[var(--store-accent)]" />
                  <span>
                    {badge ? (
                      <span className="store-highlight-badge">{badge}</span>
                    ) : null}
                    {text}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 space-y-6">
            {product.options.map((option) => (
              <div key={option.id}>
                <div className="mb-2.5 flex items-baseline justify-between gap-3">
                  <p className="store-option-label">{option.name}</p>
                  <p className="text-sm text-[var(--store-muted)]">
                    {
                      option.values.find(
                        (v) => v.value === selections[option.id],
                      )?.label
                    }
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value) => {
                    const selected = selections[option.id] === value.value;
                    return (
                      <button
                        key={value.value}
                        type="button"
                        onClick={() => selectOption(option.id, value.value)}
                        className={cn("store-chip", selected && "is-active")}
                      >
                        {value.label}
                        {value.priceAdjust ? (
                          <span className="opacity-70">
                            {" "}
                            +
                            {formatMoney(
                              value.priceAdjust,
                              product.currencySymbol,
                            )}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <p className="store-option-label mb-2.5">Quantity</p>
              <div className="store-qty">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-4" />
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>

          <div id="buy" className="mt-8 space-y-3">
            <div className="flex justify-center">
              <div className="hover:scale-[1.04] transition-all duration-200 will-change-transform rounded-[14px] p-[1px] bg-gradient-to-b from-[#FFB06A] to-[#FF8A3D] hover:from-[#E8883A] hover:to-[#D46A1C] w-full">
                <button
                  type="button"
                  onClick={handleBuy}
                  className="rounded-[13px] font-medium transition-all will-change-transform flex items-center justify-center gap-2 bg-gradient-to-b from-[#E36F02] to-[#FC7B02] text-white shadow-[0px_2px_10.1px_0px_#FC7B0233] hover:shadow-[0px_2px_10.1px_0px_#FC7B0244] relative overflow-hidden z-10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-[#D45E00] before:to-[#F07310] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200 before:z-0 before:content-[''] text-[16px] py-[11.7px] px-[22px] w-full"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {buyLabel}
                    <ChevronRight className="size-4" />
                  </span>
                </button>
              </div>
            </div>
            {payError ? (
              <p className="text-center text-sm text-red-600" role="alert">
                {payError}
              </p>
            ) : null}
            <div
              className="store-pay-secure"
              aria-label="Pay securely with Razorpay"
            >
              <Lock className="size-3.5 shrink-0 text-[var(--store-accent)]" />
              <span>Secure checkout · Instant delivery</span>
            </div>
            <p className="text-center text-xs text-[var(--store-muted)]">
              Instant Google Drive link after payment
            </p>
          </div>

          <div className="store-trust">
            {product.trustItems.map((item, index) => {
              const Icon = index === 0 ? Zap : index === 1 ? Lock : Download;
              return (
                <div key={item.title} className="store-trust-item">
                  <Icon className="size-4 text-[var(--store-accent)]" />
                  <div>
                    <p>{item.title}</p>
                    <span>{item.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="store-sticky-buy">
        <div className="store-sticky-buy-inner">
          <div className="store-sticky-buy-price">
            <span className="store-sticky-buy-now">
              {formatMoney(lineTotal, product.currencySymbol)}
            </span>
            {product.compareAtPrice != null ? (
              <span className="store-sticky-buy-was">
                {formatMoney(product.compareAtPrice, product.currencySymbol)}
              </span>
            ) : null}
          </div>
          <div className="store-sticky-buy-actions">
            <div className="hover:scale-[1.04] transition-all duration-200 will-change-transform rounded-[14px] p-[1px] bg-gradient-to-b from-[#FFB06A] to-[#FF8A3D] hover:from-[#E8883A] hover:to-[#D46A1C] w-full">
              <button
                type="button"
                onClick={handleBuy}
                className="rounded-[13px] font-medium transition-all will-change-transform flex items-center justify-center gap-2 bg-gradient-to-b from-[#E36F02] to-[#FC7B02] text-white shadow-[0px_2px_10.1px_0px_#FC7B0233] hover:shadow-[0px_2px_10.1px_0px_#FC7B0244] relative overflow-hidden z-10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-[#D45E00] before:to-[#F07310] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200 before:z-0 before:content-[''] text-[16px] py-[11.7px] px-[22px] w-full min-h-[2.85rem]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {buyLabel}
                  <ChevronRight className="size-4" />
                </span>
              </button>
            </div>
            {payError ? (
              <p className="text-center text-[11px] leading-snug text-red-600" role="alert">
                {payError}
              </p>
            ) : (
              <div
                className="store-pay-secure store-pay-secure-sticky"
                aria-label="Pay securely with encrypted checkout"
              >
                <Lock className="size-2.5 shrink-0 text-[var(--store-accent)]" />
                <span>Secure checkout · Instant delivery</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {zoomOpen ? (
        <ProductImageZoomLightbox
          src={product.images[activeImage]?.src ?? product.images[0].src}
          alt={product.images[activeImage]?.alt ?? product.images[0].alt}
          onClose={() => setZoomOpen(false)}
        />
      ) : null}

      {emailModalOpen ? (
        <div
          className="store-email-modal-overlay"
          role="presentation"
          onClick={closeEmailModal}
        >
          <div
            className={cn(
              "store-email-modal",
              startingCheckout && "is-proceeding",
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-email-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {!startingCheckout ? (
              <button
                type="button"
                className="store-email-modal-close"
                onClick={closeEmailModal}
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            ) : null}
            {!startingCheckout ? (
              <h2
                id="store-email-modal-title"
                className="store-email-modal-title"
              >
                Where should we send your leads database?
              </h2>
            ) : (
              <span id="store-email-modal-title" className="sr-only">
                Proceed to Payment
              </span>
            )}
            <form onSubmit={handleEmailContinue} className="store-email-modal-form">
              {!startingCheckout ? (
                <>
                  <label htmlFor="store-modal-email" className="store-option-label">
                    Email
                  </label>
                  <input
                    ref={emailInputRef}
                    id="store-modal-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder="you@email.com"
                    className="store-email-input"
                  />
                  {emailError ? (
                    <p className="store-email-modal-error" role="alert">
                      {emailError}
                    </p>
                  ) : null}
                </>
              ) : null}
              <button
                type="submit"
                disabled={startingCheckout}
                className="store-email-modal-continue"
              >
                {startingCheckout ? "Proceed to Payment" : "Continue to Secure Checkout ➔"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
