"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Download,
  Lock,
  Minus,
  Plus,
  Zap,
  ZoomIn,
} from "lucide-react";

import { ProductImage } from "@/components/store/product-image";
import { ProductStars } from "@/components/store/product-stars";
import { isSafeDodoCheckoutUrl } from "@/lib/billing/start-landing-checkout";
import {
  trackStoreInitiateCheckout,
  trackStoreViewContent,
} from "@/lib/meta/store-track";
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
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

const OFFER_TIMER_KEY = "store-offer-timer-v6";
const OFFER_DURATION_MS = (9 * 3600 + 47 * 60 + 23) * 1000;

const LICENSE_STOCK_KEY = "store-license-stock-v3";
const LICENSE_MAX = 14;
const LICENSE_FAST_TICK_MS = 3 * 60 * 1000;
const LICENSE_SLOW_TICK_MS = 3 * 60 * 60 * 1000;

type OfferTimerState = {
  deadlineMs: number;
  expiredOnDay: string | null;
};

type LicenseStockState = {
  count: number;
  nextTickMs: number;
};

function localDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function readOfferTimerState(): OfferTimerState | null {
  try {
    const raw = window.localStorage.getItem(OFFER_TIMER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OfferTimerState>;
    if (typeof parsed.deadlineMs !== "number" || !Number.isFinite(parsed.deadlineMs)) {
      return null;
    }
    return {
      deadlineMs: parsed.deadlineMs,
      expiredOnDay:
        typeof parsed.expiredOnDay === "string" ? parsed.expiredOnDay : null,
    };
  } catch {
    return null;
  }
}

function writeOfferTimerState(state: OfferTimerState) {
  try {
    window.localStorage.setItem(OFFER_TIMER_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

function readLicenseStockState(): LicenseStockState | null {
  try {
    const raw = window.localStorage.getItem(LICENSE_STOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LicenseStockState>;
    if (
      typeof parsed.count !== "number" ||
      !Number.isFinite(parsed.count) ||
      typeof parsed.nextTickMs !== "number" ||
      !Number.isFinite(parsed.nextTickMs)
    ) {
      return null;
    }
    const count = Math.min(
      LICENSE_MAX,
      Math.max(1, Math.round(parsed.count)),
    );
    return { count, nextTickMs: parsed.nextTickMs };
  } catch {
    return null;
  }
}

function writeLicenseStockState(state: LicenseStockState) {
  try {
    window.localStorage.setItem(LICENSE_STOCK_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

function licenseHoldMs(count: number): number {
  return count <= 4 ? LICENSE_SLOW_TICK_MS : LICENSE_FAST_TICK_MS;
}

function resolveLicenseStock(now = Date.now()): number {
  const existing = readLicenseStockState();
  if (!existing) {
    writeLicenseStockState({
      count: LICENSE_MAX,
      nextTickMs: now + licenseHoldMs(LICENSE_MAX),
    });
    return LICENSE_MAX;
  }

  let { count, nextTickMs } = existing;
  let guard = 0;
  while (now >= nextTickMs && guard++ < 100_000) {
    count = count <= 1 ? LICENSE_MAX : count - 1;
    nextTickMs += licenseHoldMs(count);
  }

  writeLicenseStockState({ count, nextTickMs });
  return count;
}

function resolveOfferTimer(): {
  deadlineMs: number;
  remainingSeconds: number;
  stuckExpired: boolean;
} {
  const today = localDayKey();
  const existing = readOfferTimerState();

  if (existing?.expiredOnDay === today) {
    return {
      deadlineMs: existing.deadlineMs,
      remainingSeconds: 0,
      stuckExpired: true,
    };
  }

  if (existing?.expiredOnDay && existing.expiredOnDay !== today) {
    const deadlineMs = Date.now() + OFFER_DURATION_MS;
    writeOfferTimerState({ deadlineMs, expiredOnDay: null });
    return {
      deadlineMs,
      remainingSeconds: Math.floor(OFFER_DURATION_MS / 1000),
      stuckExpired: false,
    };
  }

  if (existing && existing.deadlineMs > Date.now()) {
    return {
      deadlineMs: existing.deadlineMs,
      remainingSeconds: Math.floor((existing.deadlineMs - Date.now()) / 1000),
      stuckExpired: false,
    };
  }

  if (existing && existing.deadlineMs <= Date.now()) {
    writeOfferTimerState({
      deadlineMs: existing.deadlineMs,
      expiredOnDay: today,
    });
    return {
      deadlineMs: existing.deadlineMs,
      remainingSeconds: 0,
      stuckExpired: true,
    };
  }

  const deadlineMs = Date.now() + OFFER_DURATION_MS;
  writeOfferTimerState({ deadlineMs, expiredOnDay: null });
  return {
    deadlineMs,
    remainingSeconds: Math.floor(OFFER_DURATION_MS / 1000),
    stuckExpired: false,
  };
}

function OfferCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [licensesLeft, setLicensesLeft] = useState<number | null>(null);

  useEffect(() => {
    const resolved = resolveOfferTimer();
    const deadlineMs = resolved.deadlineMs;
    let stuck = resolved.stuckExpired;

    function tickTimer() {
      if (stuck) {
        setRemaining(0);
        return;
      }

      const leftMs = deadlineMs - Date.now();
      if (leftMs <= 0) {
        stuck = true;
        writeOfferTimerState({
          deadlineMs,
          expiredOnDay: localDayKey(),
        });
        setRemaining(0);
        return;
      }
      setRemaining(Math.floor(leftMs / 1000));
    }

    function tickLicenses() {
      setLicensesLeft(resolveLicenseStock());
    }

    tickTimer();
    tickLicenses();
    const timerId = window.setInterval(tickTimer, 1000);
    const licenseId = window.setInterval(tickLicenses, 15_000);
    return () => {
      window.clearInterval(timerId);
      window.clearInterval(licenseId);
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
 * Meta ViewContent / InitiateCheckout stay here so tracking is unchanged.
 */
export function ProductHero({ product }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState(product.defaultSelections);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const buyingLock = useRef(false);

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
  const buyDisabled = paying;
  const buyLabel = paying ? "Opening checkout..." : product.buyButtonLabel;

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
    void fetch("/api/store/dodo/checkout", {
      method: "GET",
      cache: "no-store",
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    function resetBuyUi() {
      setPaying(false);
      buyingLock.current = false;
    }

    function onPageShow() {
      resetBuyUi();
    }

    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  function selectOption(optionId: string, value: string) {
    setSelections((prev) => ({ ...prev, [optionId]: value }));
  }

  async function handleBuy() {
    if (buyingLock.current || paying) return;
    buyingLock.current = true;
    setPayError(null);
    setPaying(true);

    trackStoreInitiateCheckout({
      value: lineTotal,
      currency: product.currency,
      quantity,
      contentName: product.title,
      contentIds: ["pan-india-leads-2026"],
    });

    try {
      const res = await fetch("/api/store/dodo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
        cache: "no-store",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        checkoutUrl?: string;
        error?: { message?: string };
      };

      if (!res.ok || !data.ok || !data.checkoutUrl) {
        throw new Error(data.error?.message ?? "Could not start checkout.");
      }

      if (!isSafeDodoCheckoutUrl(data.checkoutUrl)) {
        throw new Error("Invalid checkout link. Please try again.");
      }

      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setPayError(
        error instanceof Error ? error.message : "Could not start payment.",
      );
      setPaying(false);
      buyingLock.current = false;
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
                  disabled={buyDisabled}
                  className="rounded-[13px] font-medium transition-all will-change-transform flex items-center justify-center gap-2 bg-gradient-to-b from-[#E36F02] to-[#FC7B02] text-white shadow-[0px_2px_10.1px_0px_#FC7B0233] hover:shadow-[0px_2px_10.1px_0px_#FC7B0244] relative overflow-hidden z-10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-[#D45E00] before:to-[#F07310] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200 before:z-0 before:content-[''] text-[16px] py-[11.7px] px-[22px] w-full disabled:opacity-60 disabled:pointer-events-none"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {buyLabel}
                    {!buyDisabled ? <ChevronRight className="size-4" /> : null}
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
              aria-label="Pay securely with encrypted checkout"
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
                disabled={buyDisabled}
                className="rounded-[13px] font-medium transition-all will-change-transform flex items-center justify-center gap-2 bg-gradient-to-b from-[#E36F02] to-[#FC7B02] text-white shadow-[0px_2px_10.1px_0px_#FC7B0233] hover:shadow-[0px_2px_10.1px_0px_#FC7B0244] relative overflow-hidden z-10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-[#D45E00] before:to-[#F07310] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200 before:z-0 before:content-[''] text-[16px] py-[11.7px] px-[22px] w-full min-h-[2.85rem] disabled:opacity-60 disabled:pointer-events-none"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {buyLabel}
                  {!buyDisabled ? <ChevronRight className="size-4" /> : null}
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
    </>
  );
}
