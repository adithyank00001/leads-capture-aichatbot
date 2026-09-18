"use client";

import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent, type WheelEvent } from "react";
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
import { BrandLogo } from "@/components/marketing/brand-logo";
import { cn } from "@/lib/utils";

type Props = {
  product: StoreProductContent;
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error: { description?: string } }) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckoutInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function RazorpayLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <svg
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        focusable="false"
        className="size-4 shrink-0"
      >
        <path
          fill="#072654"
          d="M22.436 0l-11.91 7.773-1.174 4.276 6.625-4.297L11.65 24h4.391l6.395-24zM14.26 10.098L3.389 17.166 1.564 24h9.008l3.688-13.902Z"
        />
      </svg>
      <span className="font-semibold tracking-tight text-[#072654]">Razorpay</span>
    </span>
  );
}

function formatMoney(amount: number, symbol: string) {
  const whole = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const [intPart, decPart] = whole.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${symbol}${withCommas}.${decPart}` : `${symbol}${withCommas}`;
}

function formatReviewCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k+`;
  }
  return `${count}+`;
}

function isSvg(src: string) {
  return src.toLowerCase().endsWith(".svg");
}

function ProductImage({
  src,
  alt,
  priority = false,
  sizes,
  fit = "contain",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes: string;
  fit?: "contain" | "cover";
}) {
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";

  if (isSvg(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={cn("absolute inset-0 size-full p-2", fitClass)} />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      quality={100}
      unoptimized
      className={cn("p-2", fitClass)}
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

const OFFER_TIMER_KEY = "store-offer-deadline-v2";
const OFFER_DURATION_MS = (37 * 60 + 24) * 1000; // 37 minutes 24 seconds, then restarts

function getOfferDeadline() {
  if (typeof window === "undefined") return Date.now() + OFFER_DURATION_MS;

  const stored = window.localStorage.getItem(OFFER_TIMER_KEY);
  const storedMs = stored ? Number(stored) : NaN;
  if (Number.isFinite(storedMs) && storedMs > Date.now()) {
    return storedMs;
  }

  const next = Date.now() + OFFER_DURATION_MS;
  window.localStorage.setItem(OFFER_TIMER_KEY, String(next));
  return next;
}

function ReviewForm() {
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState<string | null>(null);

  function showBuyerOnlyMessage() {
    setMessage("Only buyers can leave a review. Purchase this product to share your experience.");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    showBuyerOnlyMessage();
  }

  return (
    <form className="store-review-form" onSubmit={handleSubmit}>
      <h3>Write a review</h3>
      <p className="store-review-form-note">Share your experience with this product.</p>

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

  useEffect(() => {
    let deadline = getOfferDeadline();

    function tick() {
      const leftMs = deadline - Date.now();
      if (leftMs <= 0) {
        deadline = Date.now() + OFFER_DURATION_MS;
        window.localStorage.setItem(OFFER_TIMER_KEY, String(deadline));
        setRemaining(Math.floor(OFFER_DURATION_MS / 1000));
        return;
      }
      setRemaining(Math.floor(leftMs / 1000));
    }

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="store-offer-timer" aria-live="polite">
      <p className="store-offer-timer-title">Offer ending soon</p>
      <p className="store-offer-timer-label">Price jumps to ₹597 in:</p>
      <p className="store-offer-timer-digits" suppressHydrationWarning>
        {remaining == null ? "--:--:--" : formatCountdown(remaining)}
      </p>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= Math.round(rating);
        return (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              filled ? "fill-[var(--store-ink)] text-[var(--store-ink)]" : "text-[var(--store-line)]",
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
      <div className="store-zoom-toolbar" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={() => zoomBy(-0.25)} aria-label="Zoom out">
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
        style={{ cursor: zoom > 1 ? (dragging.current ? "grabbing" : "grab") : "zoom-in" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
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
      <p className="store-zoom-hint">Scroll to zoom · Drag to move · Esc to close</p>
    </div>
  );
}

type OrderResponse = {
  ok: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  productName?: string;
  description?: string;
  error?: { message?: string };
};

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function ensureRazorpayScript() {
  if (typeof window === "undefined") return;
  if (window.Razorpay) return;
  if (document.querySelector('script[data-store-razorpay="1"]')) return;

  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  script.dataset.storeRazorpay = "1";
  document.head.appendChild(script);
}

async function waitForRazorpay(timeoutMs = 10000) {
  if (window.Razorpay) return window.Razorpay;
  ensureRazorpayScript();

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.Razorpay) return window.Razorpay;
    await sleep(50);
  }
  throw new Error("Payment checkout is taking too long to load. Please refresh and try again.");
}

async function createOrderWithRetry(
  quantity: number,
  selections: Record<string, string>,
  attempts = 3,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const orderRes = await fetch("/api/store/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, selections }),
        cache: "no-store",
      });

      const contentType = orderRes.headers.get("content-type") ?? "";
      const raw = await orderRes.text();

      if (!contentType.includes("application/json")) {
        throw new Error(
          `Payment server returned a non-JSON response (${orderRes.status}). Please try again.`,
        );
      }

      const orderData = JSON.parse(raw) as OrderResponse;

      if (!orderRes.ok || !orderData.ok || !orderData.orderId || !orderData.keyId) {
        throw new Error(orderData.error?.message ?? "Could not start payment.");
      }

      return orderData;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(250 * attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Could not start payment.");
}

export function StoreProductPage({ product }: Props) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState(product.defaultSelections);
  const [scriptReady, setScriptReady] = useState(false);
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
  const buyLabel = paying ? "Opening Razorpay..." : product.buyButtonLabel;

  useEffect(() => {
    ensureRazorpayScript();
    if (window.Razorpay) {
      setScriptReady(true);
      return;
    }

    const timer = window.setInterval(() => {
      if (window.Razorpay) {
        setScriptReady(true);
        window.clearInterval(timer);
      }
    }, 100);

    // Warm the order API so the first click is faster.
    void fetch("/api/store/razorpay/order", {
      method: "GET",
      cache: "no-store",
    }).catch(() => undefined);

    return () => window.clearInterval(timer);
  }, []);

  function selectOption(optionId: string, value: string) {
    setSelections((prev) => ({ ...prev, [optionId]: value }));
  }

  async function handleBuy() {
    if (buyingLock.current || paying) return;
    buyingLock.current = true;
    setPayError(null);
    setPaying(true);

    try {
      const [orderData] = await Promise.all([
        createOrderWithRetry(quantity, selections),
        waitForRazorpay(),
      ]);

      const RazorpayCtor = window.Razorpay;
      if (!RazorpayCtor) {
        throw new Error("Payment checkout failed to load. Please refresh and try again.");
      }

      const razorpay = new RazorpayCtor({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.productName ?? product.brandName,
        description: orderData.description ?? product.title,
        order_id: orderData.orderId,
        retry: { enabled: true, max_count: 2 },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const verifyRes = await fetch("/api/store/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
              cache: "no-store",
            });
            const verifyData = (await verifyRes.json()) as {
              ok: boolean;
              redirectUrl?: string;
              error?: { message?: string };
            };

            if (!verifyRes.ok || !verifyData.ok || !verifyData.redirectUrl) {
              throw new Error(verifyData.error?.message ?? "Payment verify failed.");
            }

            router.push(verifyData.redirectUrl);
          } catch (error) {
            setPayError(
              error instanceof Error ? error.message : "Payment verify failed.",
            );
            setPaying(false);
            buyingLock.current = false;
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            buyingLock.current = false;
          },
        },
        theme: {
          color: "#101828",
        },
        notes: {
          product: product.title,
        },
      });

      razorpay.on("payment.failed", (response) => {
        setPayError(response.error.description ?? "Payment failed. Try again.");
        setPaying(false);
        buyingLock.current = false;
      });

      razorpay.open();
    } catch (error) {
      setPayError(error instanceof Error ? error.message : "Could not start payment.");
      setPaying(false);
      buyingLock.current = false;
    }
  }

  return (
    <div className="store-root min-h-full">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />

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
                <span className="store-social-proof">{product.socialProofTag}</span>
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
                    <ProductImage src={image.src} alt="" sizes="120px" />
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
                {product.rating.toFixed(1)} · {formatReviewCount(product.reviewCount)}{" "}
                customers
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <p className="store-price">{formatMoney(unitPrice, product.currencySymbol)}</p>
              {product.compareAtPrice != null ? (
                <p className="store-compare">
                  {formatMoney(product.compareAtPrice, product.currencySymbol)}
                </p>
              ) : null}
              {product.compareAtPrice != null && product.compareAtPrice > unitPrice ? (
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
              {product.highlights.map((item) => (
                <li key={item}>
                  <Check className="size-4 shrink-0 text-[var(--store-accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 space-y-6">
              {product.options.map((option) => (
                <div key={option.id}>
                  <div className="mb-2.5 flex items-baseline justify-between gap-3">
                    <p className="store-option-label">{option.name}</p>
                    <p className="text-sm text-[var(--store-muted)]">
                      {option.values.find((v) => v.value === selections[option.id])?.label}
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
                              +{formatMoney(value.priceAdjust, product.currencySymbol)}
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
              <button
                type="button"
                className="store-btn-primary"
                onClick={handleBuy}
                disabled={buyDisabled}
              >
                {buyLabel}
                {!buyDisabled ? <ChevronRight className="size-4" /> : null}
              </button>
              {payError ? (
                <p className="text-center text-sm text-red-600">{payError}</p>
              ) : null}
              <div className="store-pay-secure" aria-label="Pay securely with Razorpay">
                <Lock className="size-3.5 shrink-0 text-[var(--store-accent)]" />
                <span>Pay securely with</span>
                <RazorpayLogo />
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
            <p className="store-included-headline">{product.includedHeadline}</p>
            <p className="store-included-note">{product.includedNote}</p>
            <ul className="store-category-grid">
              {product.included.map((item) => {
                const isMore = item.toLowerCase().includes("and many more");
                return (
                  <li key={item} className={isMore ? "store-category-more" : undefined}>
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--store-accent)]" />
                    <span>{item}</span>
                  </li>
                );
              })}
            </ul>
            {product.bonusIncluded.length > 0 ? (
              <div className="store-bonus">
                <p className="store-bonus-label">Bonus database</p>
                <ul className="store-bonus-list">
                  {product.bonusIncluded.map((item) => {
                    const isMore = item.toLowerCase().includes("and many more");
                    return (
                      <li key={item} className={isMore ? "store-bonus-more" : undefined}>
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--store-accent)]" />
                        <span>{item}</span>
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
                  <li key={`${review.name}-${review.avatar}`} className="store-review">
                    <div className="store-review-head">
                      <div className="store-review-avatar">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={review.avatar} alt="" />
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
            <button
              type="button"
              className="store-btn-primary store-sticky-buy-btn"
              onClick={handleBuy}
              disabled={buyDisabled}
            >
              {buyLabel}
              {!buyDisabled ? <ChevronRight className="size-4" /> : null}
            </button>
            <div className="store-pay-secure store-pay-secure-sticky" aria-label="Pay securely with Razorpay">
              <Lock className="size-2.5 shrink-0 text-[var(--store-accent)]" />
              <span>Pay securely with</span>
              <RazorpayLogo className="store-razorpay-logo-sm" />
            </div>
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
    </div>
  );
}
