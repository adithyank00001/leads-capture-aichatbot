"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Download,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import type { StoreProductContent } from "@/lib/store/product-content";
import { shopCatalog, type CatalogProduct } from "@/lib/store/catalog";
import { cloudinaryDeliveryUrl } from "@/lib/store/cloudinary";
import { BrandLogo } from "@/components/marketing/brand-logo";
import { isSafeDodoCheckoutUrl } from "@/lib/billing/start-landing-checkout";
import {
  trackStoreInitiateCheckout,
  trackStoreViewContent,
} from "@/lib/meta/store-track";
import { cn } from "@/lib/utils";

const EXPLORE_PRODUCT_IDS = [
  "usa-leads-premium",
  "real-estate-leads",
  "crm-blueprint",
] as const;

const exploreProducts = shopCatalog.filter((item) =>
  (EXPLORE_PRODUCT_IDS as readonly string[]).includes(item.id),
);

type Props = {
  product: StoreProductContent;
};

function formatMoney(amount: number, symbol: string) {
  const whole = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const [intPart, decPart] = whole.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart
    ? `${symbol}${withCommas}.${decPart}`
    : `${symbol}${withCommas}`;
}

function formatReviewCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k+`;
  }
  return `${count}+`;
}

function ProductImage({
  src,
  alt,
  priority = false,
  sizes,
  fit = "contain",
  /** Max delivery width from Cloudinary (keeps downloads small). */
  width = 720,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes: string;
  fit?: "contain" | "cover";
  width?: number;
}) {
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";
  // Serve already-compressed bytes from Cloudinary (no second re-encode pass).
  const deliverySrc = cloudinaryDeliveryUrl(src, { width });

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={deliverySrc}
      alt={alt}
      className={cn("absolute inset-0 size-full p-2", fitClass)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      sizes={sizes}
    />
  );
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
// Fresh visits start at 9h 47m 23s
const OFFER_DURATION_MS = (9 * 3600 + 47 * 60 + 23) * 1000;

const LICENSE_STOCK_KEY = "store-license-stock-v3";
const LICENSE_MAX = 14;
/** Drop speed while count is 5–14. */
const LICENSE_FAST_TICK_MS = 3 * 60 * 1000; // 3 minutes
/** Drop speed once count is 4 or lower. */
const LICENSE_SLOW_TICK_MS = 3 * 60 * 60 * 1000; // 3 hours

type OfferTimerState = {
  /** When the active countdown ends (ms since epoch). */
  deadlineMs: number;
  /** Local calendar day (YYYY-MM-DD) when this browser hit 00:00:00. */
  expiredOnDay: string | null;
};

type LicenseStockState = {
  count: number;
  /** When the next decrement should happen. */
  nextTickMs: number;
};

/** Anonymous day key in the visitor's local timezone. */
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

/** How long the counter stays on this number before dropping. */
function licenseHoldMs(count: number): number {
  return count <= 4 ? LICENSE_SLOW_TICK_MS : LICENSE_FAST_TICK_MS;
}

/**
 * Per-browser scarcity stock (localStorage).
 * Each new visitor starts at 14. Then 14→5 every few minutes; at 4 and below every 3 hours; 1→14.
 */
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

/**
 * Anonymous offer timer (localStorage only — no login).
 * - Counts down once per visit cycle.
 * - At 0, stays stuck on 00:00:00 for the rest of that local calendar day.
 * - Next local day → starts a fresh countdown.
 */
function resolveOfferTimer(): {
  deadlineMs: number;
  remainingSeconds: number;
  stuckExpired: boolean;
} {
  const today = localDayKey();
  const existing = readOfferTimerState();

  // Already expired today → stay at 00:00:00
  if (existing?.expiredOnDay === today) {
    return {
      deadlineMs: existing.deadlineMs,
      remainingSeconds: 0,
      stuckExpired: true,
    };
  }

  // Expired on a previous day → new cycle for "tomorrow" visitors
  if (existing?.expiredOnDay && existing.expiredOnDay !== today) {
    const deadlineMs = Date.now() + OFFER_DURATION_MS;
    writeOfferTimerState({ deadlineMs, expiredOnDay: null });
    return {
      deadlineMs,
      remainingSeconds: Math.floor(OFFER_DURATION_MS / 1000),
      stuckExpired: false,
    };
  }

  // Active countdown still running
  if (existing && existing.deadlineMs > Date.now()) {
    return {
      deadlineMs: existing.deadlineMs,
      remainingSeconds: Math.floor((existing.deadlineMs - Date.now()) / 1000),
      stuckExpired: false,
    };
  }

  // Deadline already passed (tab closed) → mark expired for today
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

  // First visit
  const deadlineMs = Date.now() + OFFER_DURATION_MS;
  writeOfferTimerState({ deadlineMs, expiredOnDay: null });
  return {
    deadlineMs,
    remainingSeconds: Math.floor(OFFER_DURATION_MS / 1000),
    stuckExpired: false,
  };
}

function ReviewForm() {
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState<string | null>(null);

  function showBuyerOnlyMessage() {
    setMessage(
      "Only buyers can leave a review. Purchase this product to share your experience.",
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    showBuyerOnlyMessage();
  }

  return (
    <form className="store-review-form" onSubmit={handleSubmit}>
      <h3>Write a review</h3>
      <p className="store-review-form-note">
        Share your experience with this product.
      </p>

      <label className="store-review-field">
        <span>Rating</span>
        <select
          value={rating}
          onChange={(event) => {
            setRating(Number(event.target.value));
            showBuyerOnlyMessage();
          }}
          onFocus={showBuyerOnlyMessage}
          aria-label="Review rating"
        >
          <option value={5}>5 stars</option>
          <option value={4}>4 stars</option>
          <option value={3}>3 stars</option>
          <option value={2}>2 stars</option>
          <option value={1}>1 star</option>
        </select>
      </label>

      <label className="store-review-field">
        <span>Your review</span>
        <textarea
          value={quote}
          onChange={(event) => {
            setQuote(event.target.value);
            showBuyerOnlyMessage();
          }}
          onFocus={showBuyerOnlyMessage}
          placeholder="Write your review..."
          rows={4}
        />
      </label>

      <button type="submit" className="store-btn-primary store-review-submit">
        Submit review
      </button>

      {message ? (
        <p className="store-review-buyer-only" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}

function OfferCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [licensesLeft, setLicensesLeft] = useState<number | null>(null);

  useEffect(() => {
    const resolved = resolveOfferTimer();
    let deadlineMs = resolved.deadlineMs;
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

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= Math.round(rating);
        return (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              filled
                ? "fill-[var(--store-ink)] text-[var(--store-ink)]"
                : "text-[var(--store-line)]",
            )}
          />
        );
      })}
    </div>
  );
}

function ImageZoomLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=") {
        setZoom((value) => Math.min(4, Number((value + 0.25).toFixed(2))));
      }
      if (event.key === "-" || event.key === "_") {
        setZoom((value) => {
          const next = Math.max(1, Number((value - 0.25).toFixed(2)));
          if (next === 1) setOffset({ x: 0, y: 0 });
          return next;
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function zoomBy(delta: number) {
    setZoom((value) => {
      const next = Math.min(4, Math.max(1, Number((value + delta).toFixed(2))));
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 0.2 : -0.2);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return;
    dragging.current = true;
    lastPoint.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current || zoom <= 1) return;
    const dx = event.clientX - lastPoint.current.x;
    const dy = event.clientY - lastPoint.current.y;
    lastPoint.current = { x: event.clientX, y: event.clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    dragging.current = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="store-zoom-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Zoomed product image"
      onClick={onClose}
    >
      <div
        className="store-zoom-toolbar"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => zoomBy(-0.25)}
          aria-label="Zoom out"
        >
          <ZoomOut className="size-4" />
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => zoomBy(0.25)} aria-label="Zoom in">
          <ZoomIn className="size-4" />
        </button>
        <button type="button" onClick={onClose} aria-label="Close zoom">
          <X className="size-4" />
        </button>
      </div>

      <div
        className="store-zoom-stage"
        onClick={(event) => event.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          cursor:
            zoom > 1 ? (dragging.current ? "grabbing" : "grab") : "zoom-in",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cloudinaryDeliveryUrl(src, { width: 1100, quality: "good" })}
          alt={alt}
          className="store-zoom-image"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
          draggable={false}
          onDoubleClick={() => {
            if (zoom > 1) {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            } else {
              setZoom(2);
            }
          }}
        />
      </div>
      <p className="store-zoom-hint">
        Scroll to zoom · Drag to move · Esc to close
      </p>
    </div>
  );
}

export function StoreProductPage({ product }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState(product.defaultSelections);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [exploreProduct, setExploreProduct] = useState<CatalogProduct | null>(
    null,
  );
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
    // Meta ViewContent after first paint — PageView already fired early in <head>.
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
    // Warm Dodo checkout API so the first click is faster.
    void fetch("/api/store/dodo/checkout", {
      method: "GET",
      cache: "no-store",
    }).catch(() => undefined);
  }, []);

  // After Dodo checkout, browser Back restores this page from cache with
  // paying=true still set — reset so the CTA is clickable again.
  useEffect(() => {
    function resetBuyUi() {
      setPaying(false);
      buyingLock.current = false;
    }

    function onPageShow() {
      // Fires on first load and when returning via Back (including bfcache).
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

      // Direct to Dodo (less friction than intermediate cancel page).
      window.location.assign(data.checkoutUrl);
      // If Back restores this page from cache, pageshow/focus reset the CTA.
    } catch (error) {
      setPayError(
        error instanceof Error ? error.message : "Could not start payment.",
      );
      setPaying(false);
      buyingLock.current = false;
    }
  }

  return (
    <div className="store-root min-h-full">
      <header className="store-header">
        <div className="store-shell flex h-14 items-center justify-between sm:h-16">
          <div className="store-header-brand">
            <BrandLogo href="/" size="xs" className="store-header-logo" />
            <a href="/" className="store-brand store-verified-badge">
              <BadgeCheck className="size-4 shrink-0" aria-hidden />
              {product.brandName}
            </a>
          </div>
          <nav className="flex items-center gap-5 text-sm text-[var(--store-muted)]">
            <span className="hidden sm:inline">Digital products</span>
          </nav>
        </div>
      </header>

      <main className="store-shell py-8 sm:py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-20">
          <section aria-label="Product images" className="store-gallery">
            <button
              type="button"
              className="store-main-image store-main-image-zoom"
              onClick={() => setZoomOpen(true)}
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
              <Stars rating={product.rating} />
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

        <section className="store-details" aria-label="Product details">
          <article className="store-included">
            <h2>What&apos;s included</h2>
            <p className="store-included-headline">
              {product.includedHeadline}
            </p>
            <p className="store-included-note">{product.includedNote}</p>
            <ul className="store-category-grid">
              {product.included.map((item) => {
                const isMore = item.label.toLowerCase().includes("and many more");
                return (
                  <li
                    key={item.label}
                    className={isMore ? "store-category-more" : undefined}
                  >
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--store-accent)]" />
                    <span>{item.label}</span>
                  </li>
                );
              })}
            </ul>
            {product.bonusIncluded.length > 0 ? (
              <div className="store-bonus">
                <p className="store-bonus-label">Bonus database</p>
                <ul className="store-bonus-list">
                  {product.bonusIncluded.map((item) => {
                    const isMore = item.label
                      .toLowerCase()
                      .includes("and many more");
                    return (
                      <li
                        key={item.label}
                        className={isMore ? "store-bonus-more" : undefined}
                      >
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--store-accent)]" />
                        <span>
                          {item.label}
                          {typeof item.value === "number" ? (
                            <>
                              {" "}
                              <span className="store-category-value">
                                Value : Rs {item.value}
                              </span>
                            </>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </article>

          <article className="store-about">
            <h2>About this product</h2>
            {product.description.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
            {product.useCases.length > 0 ? (
              <ul className="store-use-cases">
                {product.useCases.map((useCase) => (
                  <li key={useCase.title}>
                    <Check className="mt-0.5 size-4 shrink-0 text-[var(--store-accent)]" />
                    <div>
                      <strong>{useCase.title}:</strong> {useCase.description}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>

          {product.reviews.length > 0 ? (
            <section className="store-reviews" aria-label="Customer reviews">
              <h2>Customer reviews</h2>
              <ul className="store-reviews-list">
                {product.reviews.map((review) => (
                  <li
                    key={`${review.name}-${review.avatar}`}
                    className="store-review"
                  >
                    <div className="store-review-head">
                      <div className="store-review-avatar">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cloudinaryDeliveryUrl(review.avatar, {
                            width: 72,
                            height: 72,
                          })}
                          alt=""
                          width={44}
                          height={44}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div>
                        <p className="store-review-name">{review.name}</p>
                        <Stars rating={review.rating ?? 5} />
                      </div>
                    </div>
                    <p className="store-review-quote">{review.quote}</p>
                  </li>
                ))}
              </ul>
              <ReviewForm />
            </section>
          ) : null}

          <div className="store-details-split">
            <article>
              <h2>How it works</h2>
              <ol>
                {product.howItWorks.map((step, index) => (
                  <li key={step}>
                    <span>{index + 1}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </article>

            <div className="store-faq">
              <h2>FAQ</h2>
              <div className="divide-y divide-[var(--store-line)]">
                {product.faqs.map((faq) => (
                  <details key={faq.question} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-[var(--store-ink)] marker:content-none [&::-webkit-details-marker]:hidden">
                      {faq.question}
                      <Plus className="size-4 shrink-0 transition group-open:rotate-45" />
                    </summary>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--store-muted)]">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {exploreProducts.length > 0 ? (
            <section
              className="store-explore"
              aria-label="Explore Individual Databases"
            >
              <h2>Explore Individual Databases</h2>
              <p className="store-explore-note">
                Prefer a single niche database? Browse these standalone options
                below.
              </p>
              <div className="store-explore-grid">
                {exploreProducts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="store-explore-card"
                    onClick={() => setExploreProduct(item)}
                  >
                    <div className="store-explore-card-media">
                      <ProductImage
                        src={item.image}
                        alt={item.imageAlt}
                        sizes="(max-width: 640px) 90vw, 280px"
                        fit="cover"
                        width={360}
                      />
                    </div>
                    <div className="store-explore-card-body">
                      <p className="store-explore-card-title">{item.title}</p>
                      <p className="store-explore-card-sub">{item.subtitle}</p>
                      <div className="store-explore-card-rating">
                        <Stars rating={item.rating} />
                        <span>
                          {item.rating.toFixed(1)} ·{" "}
                          {Math.floor(item.reviewCount / 10) * 10}+ customers
                        </span>
                      </div>
                      <p className="store-explore-card-price">
                        {formatMoney(item.price, item.currencySymbol)}
                        {item.compareAtPrice != null ? (
                          <span className="store-explore-card-was">
                            {formatMoney(
                              item.compareAtPrice,
                              item.currencySymbol,
                            )}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </main>

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
        <ImageZoomLightbox
          src={product.images[activeImage]?.src ?? product.images[0].src}
          alt={product.images[activeImage]?.alt ?? product.images[0].alt}
          onClose={() => setZoomOpen(false)}
        />
      ) : null}

      {exploreProduct ? (
        <div
          className="shop-oos-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Restocking soon"
          onClick={() => setExploreProduct(null)}
        >
          <div
            className="shop-oos-modal store-explore-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="shop-oos-close"
              aria-label="Close"
              onClick={() => setExploreProduct(null)}
            >
              <X className="size-4" />
            </button>
            <p className="store-explore-modal-title">
              🟡 Restocking Licenses Soon (₹{exploreProduct.price})
            </p>
            <p>
              This standalone database licenses will be restocked soon.
            </p>
            <p className="store-explore-modal-warning">
              ⚠️ WARNING: The All-India Database currently includes this for
              just ₹{product.price}. This is a flash sale and ending soon.
            </p>
            <div className="store-explore-modal-actions">
              <button
                type="button"
                className="store-btn-primary shop-oos-btn"
                onClick={() => {
                  setExploreProduct(null);
                  document
                    .getElementById("buy")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                Get it in the ₹{product.price} Bundle
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                className="store-explore-close-btn"
                onClick={() => setExploreProduct(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
