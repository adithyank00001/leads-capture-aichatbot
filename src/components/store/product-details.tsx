import { Check, Plus, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { ProductIncludedImages } from "@/components/store/product-included-images";
import { ProductReviewFormLazy } from "@/components/store/product-review-form-lazy";
import { ProductStars } from "@/components/store/product-stars";
import { StoreFinalCtaBuyButton } from "@/components/store/store-buy-cta-button";
import { cloudinaryDeliveryUrl } from "@/lib/store/cloudinary";
import type { StoreProductContent } from "@/lib/store/product-content";

export function ProductDetails({
  product,
  children,
}: {
  product: StoreProductContent;
  children?: ReactNode;
}) {
  return (
    <section className="store-details" aria-label="Product details">
      <article className="store-included">
        <h2>What&apos;s included</h2>
        <p className="store-included-headline">{product.includedHeadline}</p>
        <p className="store-included-note">{product.includedNote}</p>
        <ul className="store-category-grid">
          {product.included.map((item) => {
            const labelLower = item.label.toLowerCase();
            const isMore =
              labelLower.includes("and many more") ||
              labelLower.includes("more than 200");
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
          <div className="store-bonus-wrap">
            <p className="store-bonus-surprise">
              Wait… we have a surprise for you.
              <span className="store-bonus-surprise-emoji" aria-hidden="true">
                😉👇
              </span>
            </p>
            <div className="store-bonus">
              <div className="store-bonus-heading">
                <span className="store-bonus-emoji" aria-hidden="true">
                  🎁
                </span>
                <div className="store-bonus-heading-text">
                  <p className="store-bonus-title">Exclusive Free Bonuses</p>
                  <p className="store-bonus-urgency">(Only Available Today)</p>
                </div>
              </div>
              <ul className="store-bonus-list">
                {product.bonusIncluded.map((item) => {
                  const isMore = item.label
                    .toLowerCase()
                    .includes("many more");
                  return (
                    <li
                      key={item.label}
                      className={isMore ? "store-bonus-more" : undefined}
                    >
                      <span
                        className="store-bonus-item-emoji"
                        aria-hidden="true"
                      >
                        🔥
                      </span>
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
          </div>
        ) : null}
        {product.includedImages && product.includedImages.length > 0 ? (
          <ProductIncludedImages images={product.includedImages} />
        ) : null}
      </article>

      <article className="store-about">
        <h2>About this product</h2>
        {product.aboutHeadline?.trim() ? (
          <p className="store-about-headline">{product.aboutHeadline.trim()}</p>
        ) : null}
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
                    <ProductStars rating={review.rating ?? 5} />
                  </div>
                </div>
                <p className="store-review-quote">{review.quote}</p>
              </li>
            ))}
          </ul>
          <ProductReviewFormLazy />
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

      {/* Guaranteed Purchase Box */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
          <ShieldCheck className="size-8" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[var(--store-ink)]">
            7-Days Money Back Guarantee
          </h3>
          <p className="mt-1 text-sm text-[var(--store-muted)]">
            Access link is generated on your screen immediately upon successful checkout and also
            emailed to you for permanent access. If you don&apos;t get access, you will receive a
            full refund — so there is no risk for you.
          </p>
        </div>
      </div>

      {/* Final Call to Action */}
      {(() => {
        const finalCta = product.finalCta ?? {
          headline: "Take Action Now, Don't Regret Later.",
          body: "Next time the price will be higher — don't miss this opportunity.",
        };
        return (
          <section className="store-final-cta !mt-0 !text-center" aria-label="Final call to action">
            <h2 className="store-final-cta-headline">{finalCta.headline}</h2>
            <p className="store-final-cta-body !mx-auto">{finalCta.body}</p>
            <div className="store-final-cta-actions">
              <StoreFinalCtaBuyButton
                pulse
                buttonClassName="min-h-[3.25rem] text-sm sm:text-base lg:text-lg font-black tracking-wide uppercase px-4 sm:px-6"
              >
                <span className="inline-flex items-center gap-2">
                  <span>Download Now</span>
                  <span className="font-black text-white">
                    {product.currencySymbol}{product.price}
                  </span>
                  {product.compareAtPrice ? (
                    <del
                      className="line-through decoration-white text-white/80 text-xs sm:text-sm font-bold"
                      style={{
                        textDecoration: "line-through",
                        textDecorationThickness: "2px",
                        textDecorationColor: "#ffffff",
                      }}
                    >
                      {product.currencySymbol}{product.compareAtPrice}
                    </del>
                  ) : null}
                </span>
              </StoreFinalCtaBuyButton>
              <div className="flex justify-center items-center pt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cloudinaryDeliveryUrl(
                    "https://res.cloudinary.com/ntv0bhpy/image/upload/v1793718383/image-removebg-preview_5.png",
                    { width: 700, quality: "good" },
                  )}
                  alt="Supported Payment Methods: UPI, Google Pay, PhonePe, Cards, NetBanking"
                  loading="lazy"
                  className="h-auto w-auto max-w-[190px] sm:max-w-[220px] max-h-5 object-contain"
                />
              </div>
              <p className="store-final-cta-note">{product.footerNote}</p>
            </div>
          </section>
        );
      })()}

      {children}
    </section>
  );
}
