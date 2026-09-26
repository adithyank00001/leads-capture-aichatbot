import { Check, Plus, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

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
          <div className="store-bonus-wrap">
            <p className="store-bonus-surprise">
              Wait… we have a surprise for you.{" "}
              <span aria-hidden="true">😉👇</span>
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
                    .includes("and many more");
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

      {product.finalCta ? (
        <section className="store-final-cta" aria-label="Final call to action">
          <h2 className="store-final-cta-headline">
            {product.finalCta.headline}
          </h2>
          <p className="store-final-cta-body">{product.finalCta.body}</p>
          <div className="store-final-cta-actions">
            <StoreFinalCtaBuyButton label={product.buyButtonLabel} />
            <p className="store-final-cta-note">{product.footerNote}</p>
          </div>
        </section>
      ) : null}

      {children}
    </section>
  );
}
