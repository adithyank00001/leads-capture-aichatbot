import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowDown,
  Building2,
  Check,
  ChevronRight,
  Heart,
  MessageCircle,
  MessageSquare,
  Phone,
  Sparkles,
  Star,
  StarHalf,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { CtaButton } from "@/components/marketing/cta-button";
import {
  DemoChatSection,
  DemoTryButton,
} from "@/components/marketing/demo-chat/demo-chat-section";
import { RecentPurchasesSocialProof } from "@/components/marketing/recent-purchases-social-proof";
import { StickyDesktopCta } from "@/components/marketing/sticky-desktop-cta";
import { StickyMobileCta } from "@/components/marketing/sticky-mobile-cta";
import { Card, CardContent } from "@/components/ui/card";
import { FormattedPrice } from "@/components/ui/formatted-price";
import { Separator } from "@/components/ui/separator";
import { isPublicDemoEnabled } from "@/lib/demo/config";
import { resolveMarketingCta } from "@/lib/marketing/cta";
import { publicConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

const captureFeatures = [
  {
    icon: UserCheck,
    text: "Capture Name, Phone & Email First",
    optionalSuffix: "(customizable)",
  },
  {
    icon: Users,
    text: "Turn anonymous visitors into contactable leads",
  },
  {
    icon: Sparkles,
    text: "Understand what they're looking for",
  },
  {
    icon: MessageSquare,
    text: "Handle their questions and objections",
  },
  {
    icon: Phone,
    text: "Send the lead and conversation to your sales team",
  },
] as const;

const demoHighlights = [
  "No typing needed · No signup",
  "Pre-written message — just tap to send",
  "Sample details already filled in",
] as const;

const steps = [
  {
    number: "1",
    title: "Connect Your Website in Minutes",
  },
  {
    number: "2",
    title: "Customize Your AI Sales Assistant",
    optionalSuffix: "(Optional)",
  },
  {
    number: "3",
    title: "Start Capturing Leads",
  },
] as const;

const comparisonRows = [
  {
    without: "Interested visitors leave anonymous",
    with: "Turn interested visitors into contactable leads",
  },
  {
    without: "No contact details = Lost Revenue",
    with: "Get their contact details = Revenue Potential",
    withPrefix: "Get their contact details =",
    withSuffixStack: ["Revenue", "Potential"],
  },
  {
    without: "Opportunities disappear when visitors leave",
    with: "Capture prospects while their interest is fresh",
  },
  {
    without: "Your team has little or no context",
    with: "Know what prospects want before following up",
  },
  {
    without: "Leads can be missed outside working hours",
    with: "Capture leads 24/7",
  },
  {
    without: "Recurring software costs add up",
    withPrefix: "Pay",
    withPrice: true,
    withSuffix: "once. Use it for life.",
  },
] as const;

const pricingFeatures = [
  "Turn More Visitors Into Leads",
  "Collect Contact Details First",
  "Capture Leads 24/7",
  "Understand Buyer Intent",
  "Handle Questions & Objections",
  "Send Leads + Context to Your Sales Team",
] as const;

const testimonials = [
  {
    quote:
      "I was a bit skeptical at first because we already had ways for people to contact us, but surprisingly, we started getting more leads than before. For the price, it\u2019s really worth it. Highly recommend.",
    highlights: ["more leads than before", "Highly recommend."],
    name: "Zain Khan",
    role: "VERIFIED CUSTOMER",
    rating: 5,
  },
  {
    quote:
      "I thought it would be just another chatbot, but the useful part is getting the potential client\u2019s contact details first. We can also see what they were looking for from their chat with the AI, so our sales team can follow up with better context.",
    highlights: [
      "getting the potential client\u2019s contact details first.",
      "follow up with better context.",
    ],
    name: "Sara Zaabi",
    role: "VERIFIED CUSTOMER",
    rating: 4.5,
  },
  {
    quote:
      "I expected the setup to be complicated, but it was actually very straightforward. Once it was live, we started getting more contactable prospects from the website. That alone made it worth it.",
    highlights: ["setup", "actually very straightforward.", "worth it"],
    name: "Hamad Shamsi",
    role: "VERIFIED CUSTOMER",
    rating: 5,
  },
] as const;

const DESKTOP_CONTAINER =
  "lg:mx-auto lg:w-full lg:max-w-[1180px] lg:px-6 xl:max-w-[1200px]";
const DESKTOP_SECTION = "lg:py-24";

function AccentBullet({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--landing-orange)]",
        className,
      )}
    >
      <span className="size-2 rounded-full bg-[var(--landing-navy)]" />
    </span>
  );
}

function LogoMark({ className }: { className?: string }) {
  return <BrandLogo className={cn("lg:h-6", className)} size="xs" href="/" />;
}

function HeroCheckPoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-left">
      <Check className="mt-1 size-5 shrink-0 stroke-[2.5] text-[#16A34A]" />
      <span className="text-[17px] font-medium leading-relaxed text-[var(--landing-navy)] sm:text-[18px] lg:text-[19px]">
        {children}
      </span>
    </li>
  );
}

function GuaranteeShield({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn("size-7 shrink-0 sm:size-8", className)}
    >
      <path
        fill="#16A34A"
        d="M12 1.5 4 5v5.5c0 5.25 3.5 10 8 11.5 4.5-1.5 8-6.25 8-11.5V5l-8-3.5z"
      />
      <path
        d="M8.5 12.5 11 15l4.5-5"
        fill="none"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoneyBackGuarantee({
  className,
  centered = false,
}: {
  className?: string;
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative w-full rounded-xl border border-[#86EFAC] bg-[#F0FDF4] px-1.5 pb-3 pt-5 sm:px-2",
        className,
      )}
    >
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-[#F0FDF4] px-1.5">
        <GuaranteeShield />
      </div>

      <div
        className={cn(
          "flex flex-col gap-0.5",
          centered ? "text-center" : "text-left",
        )}
      >
        <p className="whitespace-nowrap text-[17px] font-bold uppercase leading-tight text-[#16A34A]">
          100% Money-Back Guarantee
        </p>
        <p className="whitespace-nowrap text-[15px] font-medium italic leading-snug text-[#16A34A]">
          No lead in 30 days? Get full refund.
        </p>
        <p className="whitespace-nowrap text-[16px] font-bold uppercase leading-snug text-[#16A34A]">
          No questions asked
        </p>
      </div>
    </div>
  );
}

function HalfStar({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <Star className={cn("size-full fill-[#D1D5DB] text-[#D1D5DB]")} />
      <StarHalf className="absolute inset-0 size-full fill-[var(--landing-orange)] text-[var(--landing-orange)]" />
    </span>
  );
}

function AverageRatingSummary({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3",
        className,
      )}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <Star
            key={index}
            className="size-5 fill-[var(--landing-orange)] text-[var(--landing-orange)]"
          />
        ))}
        <HalfStar className="size-5" />
      </div>
      <p className="text-[15px] text-white/75 sm:text-[17px]">
        <span className="font-bold text-white">4.5 / 5</span> Average Rating.
      </p>
    </div>
  );
}

function QuoteWithHighlights({
  quote,
  highlights,
}: {
  quote: string;
  highlights?: readonly string[];
}) {
  if (!highlights?.length) {
    return <>&ldquo;{quote}&rdquo;</>;
  }

  const orderedHighlights = [...highlights].sort(
    (a, b) => quote.indexOf(a) - quote.indexOf(b),
  );

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const phrase of orderedHighlights) {
    const start = quote.indexOf(phrase, cursor);
    if (start === -1) continue;

    if (start > cursor) {
      nodes.push(quote.slice(cursor, start));
    }

    nodes.push(
      <span
        key={`${phrase}-${start}`}
        className="text-[18px] font-semibold text-[var(--landing-orange)] sm:text-[21px] lg:text-[17px]"
      >
        {phrase}
      </span>,
    );
    cursor = start + phrase.length;
  }

  if (cursor < quote.length) {
    nodes.push(quote.slice(cursor));
  }

  return <>&ldquo;{nodes}&rdquo;</>;
}

function FiveStarRating({
  className,
  rating = 5,
}: {
  className?: string;
  rating?: number;
}) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: fullStars }).map((_, index) => (
        <Star
          key={`full-${index}`}
          className="size-4 fill-[var(--landing-orange)] text-[var(--landing-orange)]"
        />
      ))}
      {hasHalfStar ? <HalfStar className="size-4" /> : null}
      {Array.from({ length: emptyStars }).map((_, index) => (
        <Star
          key={`empty-${index}`}
          className="size-4 fill-[#D1D5DB] text-[#D1D5DB]"
        />
      ))}
    </div>
  );
}

function ProblemPoint({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-start gap-3 text-[17px] font-normal leading-relaxed text-white lg:flex-col lg:items-center lg:gap-2.5 lg:text-center lg:text-[18px]">
      <Icon
        className="mt-0.5 size-[18px] shrink-0 text-white/35 lg:mt-0"
        strokeWidth={1.5}
      />
      <span>{children}</span>
    </p>
  );
}

function SectionLabel({
  children,
  className,
  light = false,
}: {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-4 py-1.5 text-[15px] font-medium",
        light
          ? "border-[var(--landing-navy)]/15 bg-[var(--landing-navy)]/5 text-[var(--landing-navy)]"
          : "border-white/15 bg-white/5 text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}

function SectionHeading({
  children,
  className,
  onDark = false,
}: {
  children: React.ReactNode;
  className?: string;
  onDark?: boolean;
}) {
  return (
    <h2
      className={cn(
        "text-balance text-[25px] font-bold uppercase tracking-tight sm:text-[31px] lg:text-[37px]",
        onDark ? "text-white" : "text-[var(--landing-navy)]",
        className,
      )}
    >
      {children}
    </h2>
  );
}

function LandingFadeSeparator() {
  return (
    <div aria-hidden className="relative z-[90] bg-white py-5 sm:py-6">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <div className="h-px w-full bg-[linear-gradient(90deg,transparent_0%,#B8C4CE_42%,#B8C4CE_58%,transparent_100%)]" />
      </div>
    </div>
  );
}

export function SalesLandingPage({
  hasLifetimeAccess = false,
}: {
  hasLifetimeAccess?: boolean;
}) {
  const marketingCta = resolveMarketingCta(hasLifetimeAccess);

  return (
    <>
      <div className="relative overflow-x-hidden bg-white [--landing-navy:#112437] [--landing-orange:#FC7B02] [--landing-orange-hover:#E36F02]">
        {/* Hero — ice blue secondary (30%) */}
        {/* Hero — z-[130] hides sticky CTA (z-[120]) and demo chat launcher (z-[100]) */}
        <section id="landing-hero" className="relative z-[130] bg-white">
          <div
            className={cn(
              "relative mx-auto grid min-h-svh max-w-6xl grid-rows-[auto_1fr] px-4 pb-12 pt-2 sm:px-6 sm:pb-16 sm:pt-3 lg:min-h-svh lg:grid-rows-[auto_1fr] lg:pb-12 lg:pt-6",
              DESKTOP_CONTAINER,
            )}
          >
            <header className="shrink-0 lg:pt-1">
              <LogoMark />
            </header>

            <div className="flex flex-col justify-center lg:py-2 lg:pb-4">
              <div className="mx-auto mt-8 w-full max-w-3xl text-center sm:mt-10 lg:mt-2 lg:grid lg:max-w-none lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-10 lg:text-left xl:gap-12">
                <div>
                  <div className="mb-2 flex items-center justify-center gap-1.5 sm:mb-3 lg:mb-4 lg:justify-start">
                    <FiveStarRating
                      className="gap-px [&_svg]:size-3.5"
                      rating={5}
                    />
                    <p className="text-[13px] font-normal whitespace-nowrap text-[#5A6B7D]">
                      <span className="font-bold text-[var(--landing-navy)]">
                        4.9
                      </span>
                      /5 from customers
                    </p>
                  </div>

                  <h1 className="mb-4 w-[calc(100%+1.5rem)] max-w-none -mx-3 text-[31px] font-bold leading-[1.1] tracking-tight text-[var(--landing-navy)] sm:mx-0 sm:mb-5 sm:w-full sm:text-[37px] sm:leading-[1.1] lg:mb-5 lg:text-balance lg:text-[52px] lg:leading-[1.08] xl:text-[56px]">
                    <span className="block lg:inline">Generate More</span>
                    <span className="hidden lg:inline"> </span>
                    <span className="block whitespace-nowrap text-[var(--landing-orange)] lg:inline">
                      Qualified Student Leads
                    </span>
                    <span className="hidden lg:inline"> </span>
                    <span className="block whitespace-nowrap lg:inline">
                      With a 24/7 AI Counselor
                    </span>
                  </h1>

                  <div className="mx-auto mt-8 max-w-2xl sm:mt-10 lg:mx-0 lg:mt-8 lg:max-w-none">
                    <div className="mx-auto w-full max-w-[19.5rem] text-left sm:max-w-md lg:mx-0 lg:max-w-none">
                      <p className="text-left text-[17px] font-medium leading-relaxed text-[var(--landing-navy)] sm:text-[18px] lg:text-[19px]">
                        Turn your anonymous website visitors into qualified
                        student leads.
                      </p>
                      <p className="mt-4 text-left text-[17px] font-medium leading-relaxed text-[var(--landing-navy)] sm:text-[18px] lg:mt-5 lg:text-[19px]">
                        Our AI counselor works 24/7 on your website to:
                      </p>
                      <ul className="mt-3 flex flex-col gap-2.5 sm:mt-4 sm:gap-3">
                        <HeroCheckPoint>
                          <strong className="font-bold">Answering</strong>{" "}
                          student questions
                        </HeroCheckPoint>
                        <HeroCheckPoint>
                          <strong className="font-bold">Qualifying</strong>{" "}
                          students
                        </HeroCheckPoint>
                        <HeroCheckPoint>
                          <strong className="font-bold">Capturing</strong> their
                          contact details before they leave
                        </HeroCheckPoint>
                      </ul>
                    </div>
                  </div>
                </div>

                <div
                  id="landing-hero-cta"
                  className="mt-10 flex flex-col items-center sm:mt-12 lg:mt-4 lg:items-stretch lg:self-start"
                >
                  <div className="mx-auto inline-flex flex-col items-stretch gap-5 sm:gap-6 lg:hidden">
                    <CtaButton variant="secondary" {...marketingCta} />
                    <div className="flex w-full flex-col items-stretch gap-1">
                      <MoneyBackGuarantee
                        centered
                        className="pt-4 [&_p]:whitespace-normal"
                      />
                      <p className="text-center text-[15px] font-bold uppercase tracking-wide text-[#16A34A] sm:text-[16px]">
                        Try It Risk-Free
                      </p>
                    </div>
                  </div>

                  <div className="hidden lg:flex lg:flex-col lg:rounded-2xl lg:border lg:border-[#D8E2EC] lg:bg-white lg:p-8 lg:shadow-[0_6px_28px_rgba(17,36,55,0.1)] xl:p-9">
                    <CtaButton
                      className="w-full"
                      size="large"
                      {...marketingCta}
                    />
                    <div className="mt-6 flex flex-col gap-1.5">
                      <MoneyBackGuarantee
                        centered
                        className="pt-4 lg:[&_p:first-child]:text-[18px]"
                      />
                      <p className="text-center text-[16px] font-bold uppercase tracking-wide text-[#16A34A]">
                        Try It Risk-Free
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem — navy dominant (60%) */}
        {/* Problem — z-[110] hides demo chat launcher (z-[100]) */}
        <section
          id="landing-problem"
          className="relative z-[110] bg-[var(--landing-navy)]"
        >
          <div
            className={cn(
              "mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20",
              DESKTOP_CONTAINER,
              DESKTOP_SECTION,
            )}
          >
            <div className="mx-auto max-w-3xl text-left lg:max-w-[960px] lg:text-center">
              <SectionLabel className="mb-5 text-[14px] uppercase tracking-wider lg:mx-auto">
                The Problem
              </SectionLabel>

              <h2 className="text-[32px] font-bold leading-[1.12] tracking-tight sm:text-[53px] sm:leading-[1.1] lg:mx-auto lg:max-w-[900px] lg:text-[48px] lg:leading-[1.08] xl:text-[50px]">
                <span className="block text-white lg:inline">
                  Interest Doesn&apos;t{" "}
                </span>
                <span className="block text-white lg:inline">
                  Always Turn Into{" "}
                </span>
                <span className="block text-[var(--landing-orange)] lg:inline">
                  An Enquiry
                </span>
              </h2>

              <div className="mt-7 flex flex-col gap-4 lg:hidden">
                <ProblemPoint icon={Building2}>
                  They may like your properties.
                </ProblemPoint>
                <ProblemPoint icon={MessageCircle}>
                  They may have questions.
                </ProblemPoint>
                <ProblemPoint icon={Heart}>
                  They may be seriously considering one.
                </ProblemPoint>
              </div>

              <div className="mt-10 hidden lg:grid lg:grid-cols-3 lg:gap-8">
                <ProblemPoint icon={Building2}>
                  They may like your properties.
                </ProblemPoint>
                <ProblemPoint icon={MessageCircle}>
                  They may have questions.
                </ProblemPoint>
                <ProblemPoint icon={Heart}>
                  They may be seriously considering one.
                </ProblemPoint>
              </div>

              <p className="mt-6 text-[16px] font-medium leading-relaxed text-white/85 sm:text-[17px] lg:mt-8 lg:text-[18px]">
                But they can still leave without contacting you.
              </p>

              <p className="mt-5 border-l-4 border-[var(--landing-orange)] pl-4 text-[17px] font-bold leading-snug text-white sm:pl-5 sm:text-[19px] lg:mx-auto lg:mt-8 lg:max-w-[780px] lg:border-l-0 lg:border-t-4 lg:px-8 lg:py-5 lg:pl-8 lg:text-center lg:text-[22px] lg:font-extrabold lg:leading-[1.35] lg:tracking-tight">
                And once they leave, your sales team may never get another
                chance to follow up.
              </p>
            </div>
          </div>
        </section>

        {/* Solution — z-[110] hides demo chat launcher (z-[100]) */}
        <section className="relative z-[110] bg-white">
          <div
            className={cn(
              "mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20",
              DESKTOP_CONTAINER,
              DESKTOP_SECTION,
            )}
          >
            <div className="mx-auto max-w-3xl text-center lg:max-w-[720px]">
              <SectionLabel light className="mb-6 text-[14px]">
                The Solution
              </SectionLabel>

              <h2 className="text-balance text-[28px] font-bold uppercase tracking-tight text-[var(--landing-navy)] sm:text-[31px] lg:text-[38px]">
                <span className="text-[var(--landing-orange)]">
                  Capture Their Details{" "}
                </span>
                Before They Leave
              </h2>
              <p className="mt-4 text-[17px] font-medium text-[var(--landing-navy)] sm:text-[19px] lg:text-[19px]">
                Our AI sales assistant works 24/7
                <br />
                in your website to:
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:hidden">
              {captureFeatures.map((feature, index) => (
                <Card
                  key={feature.text}
                  className="h-full border-[#D8E2EC] bg-white py-0 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-orange)]/10 text-[var(--landing-orange)]">
                      <feature.icon className="size-[18px]" />
                    </div>
                    <p
                      className={cn(
                        "text-[16px] leading-snug text-[var(--landing-navy)] sm:text-[17px]",
                        index === 0 ? "font-bold" : "font-medium",
                      )}
                    >
                      {feature.text}
                      {"optionalSuffix" in feature && feature.optionalSuffix ? (
                        <>
                          {" "}
                          <span className="font-medium text-[#8B9AAB]">
                            {feature.optionalSuffix}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mx-auto mt-10 hidden max-w-[1140px] lg:block lg:mt-12">
              <div className="grid grid-cols-3 gap-5">
                {captureFeatures.slice(0, 3).map((feature, index) => (
                  <Card
                    key={feature.text}
                    className={cn(
                      "min-h-[88px] border-[#D8E2EC] bg-white py-0 shadow-md",
                      index === 0 && "ring-1 ring-[var(--landing-orange)]/25",
                    )}
                  >
                    <CardContent className="flex h-full items-center gap-3 px-5 py-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-orange)]/10 text-[var(--landing-orange)]">
                        <feature.icon className="size-[18px]" />
                      </div>
                      <p
                        className={cn(
                          "text-[17px] leading-snug text-[var(--landing-navy)]",
                          index === 0 ? "font-bold" : "font-medium",
                        )}
                      >
                        {feature.text}
                        {"optionalSuffix" in feature &&
                        feature.optionalSuffix ? (
                          <>
                            {" "}
                            <span className="font-medium text-[#8B9AAB]">
                              {feature.optionalSuffix}
                            </span>
                          </>
                        ) : null}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mx-auto mt-5 grid max-w-[68%] grid-cols-2 gap-5">
                {captureFeatures.slice(3).map((feature) => (
                  <Card
                    key={feature.text}
                    className="min-h-[88px] border-[#D8E2EC] bg-white py-0 shadow-md"
                  >
                    <CardContent className="flex h-full items-center gap-3 px-5 py-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-orange)]/10 text-[var(--landing-orange)]">
                        <feature.icon className="size-[18px]" />
                      </div>
                      <p className="text-[17px] font-medium leading-snug text-[var(--landing-navy)]">
                        {feature.text}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <p className="mx-auto mt-10 max-w-2xl text-center text-[17px] font-semibold text-[var(--landing-navy)] sm:mt-12 sm:text-[19px] lg:mt-10 lg:max-w-3xl lg:text-[20px]">
              So your team can follow up while the interest is still there.
            </p>
          </div>
        </section>

        {/* Testimonials — z-[110] hides demo chat launcher (z-[100]) */}
        <section className="relative z-[110] bg-[var(--landing-navy)]">
          <div
            className={cn(
              "mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20",
              DESKTOP_CONTAINER,
              DESKTOP_SECTION,
            )}
          >
            <div className="mx-auto max-w-3xl text-center">
              <SectionHeading onDark className="text-[28px] lg:text-[38px]">
                <span className="text-[var(--landing-orange)]">
                  Real Feedback
                </span>{" "}
                From
                <br className="lg:hidden" />
                <span className="hidden lg:inline"> </span>
                Real Estate Pros
              </SectionHeading>

              <AverageRatingSummary className="mt-6 sm:mt-8" />
            </div>

            <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:mt-10 lg:max-w-none lg:grid-cols-3 lg:gap-5">
              {testimonials.map((testimonial) => (
                <Card
                  key={testimonial.quote}
                  className="flex h-full flex-col border-2 border-[var(--landing-orange)] bg-white shadow-md shadow-[var(--landing-navy)]/5 lg:shadow-lg"
                >
                  <CardContent className="flex flex-1 flex-col space-y-4 p-5 sm:p-6 lg:p-7 lg:space-y-5">
                    <FiveStarRating rating={testimonial.rating} />
                    <p className="flex-1 text-[18px] leading-[27px] text-[#3F4F5F] sm:text-[21px] sm:leading-8 lg:text-[17px] lg:leading-[26px]">
                      <QuoteWithHighlights
                        quote={testimonial.quote}
                        highlights={
                          "highlights" in testimonial
                            ? testimonial.highlights
                            : undefined
                        }
                      />
                    </p>
                    <div className="mt-auto">
                      <p className="font-semibold text-[var(--landing-navy)]">
                        {testimonial.name}
                      </p>
                      <p className="mt-1 text-[13px] font-bold uppercase tracking-wide text-[#3B82F6] sm:text-[15px]">
                        {testimonial.role}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mx-auto mt-10 max-w-3xl text-left sm:mt-12 lg:mt-10 lg:text-center">
              {isPublicDemoEnabled ? (
                <p className="border-l-4 border-[var(--landing-orange)] pl-4 text-[17px] font-bold leading-snug text-white sm:pl-5 sm:text-[19px] lg:mx-auto lg:max-w-2xl lg:border-l-0 lg:pl-0 lg:text-[19px]">
                  Now imagine this working on your website.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {isPublicDemoEnabled ? (
          <>
            {/* Live demo — z-[90] shows demo chat launcher (z-[100]) above this section */}
            <section id="landing-demo" className="relative z-[90] bg-white">
              <div
                className={cn(
                  "mx-auto max-w-6xl px-4 pt-14 pb-8 sm:px-6 sm:pt-20 sm:pb-10",
                  DESKTOP_CONTAINER,
                )}
              >
                <div className="mx-auto max-w-3xl text-center lg:max-w-[960px]">
                  <SectionLabel light className="mb-6 text-[14px]">
                    Live Demo
                  </SectionLabel>
                  <h2 className="text-balance text-[28px] font-bold uppercase tracking-tight text-[var(--landing-navy)] sm:text-[31px] lg:text-[38px]">
                    See It in Action
                  </h2>
                  <DemoTryButton />
                  <ul className="mx-auto mt-4 flex w-full max-w-xl flex-col items-start gap-2 text-left sm:mt-5 sm:gap-2.5">
                    {demoHighlights.map((point) => (
                      <li
                        key={point}
                        className="flex w-full items-start gap-2.5 text-left sm:gap-3"
                      >
                        <Check className="mt-0.5 size-5 shrink-0 stroke-[2.5] text-[#16A34A]" />
                        <span className="min-w-0 flex-1 text-left text-[17px] font-medium leading-relaxed text-[var(--landing-navy)] sm:text-[19px]">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mx-auto mt-8 max-w-2xl sm:mt-10">
                  <DemoChatSection hasLifetimeAccess={hasLifetimeAccess} />
                </div>
              </div>
            </section>

            <LandingFadeSeparator />
          </>
        ) : (
          <LandingFadeSeparator />
        )}

        {/* Steps — z-[90] keeps demo chat launcher (z-[100]) visible above */}
        <section id="landing-steps" className="relative z-[90] bg-white">
          <div
            className={cn(
              "mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10",
              DESKTOP_CONTAINER,
            )}
          >
            <div className="mx-auto max-w-3xl text-center">
              <SectionHeading className="lg:text-[38px]">
                Start Capturing Leads in{" "}
                <span className="text-[var(--landing-orange)]">
                  3 Simple Steps
                </span>
              </SectionHeading>
            </div>

            <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-2 sm:mt-12 lg:mt-10 lg:max-w-none lg:flex-row lg:items-stretch lg:gap-4">
              {steps.map((step, index) => (
                <Fragment key={step.number}>
                  <Card className="h-full w-full border-[#D8E2EC] bg-white shadow-sm lg:min-h-[200px] lg:flex-1 lg:shadow-md">
                    <CardContent className="flex h-full items-center gap-4 p-5 sm:p-6 lg:flex-col lg:justify-center lg:px-6 lg:py-8 lg:text-center">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--landing-orange)] text-[19px] font-bold text-white lg:size-14 lg:text-[22px]">
                        {step.number}
                      </div>
                      <h3 className="text-[17px] font-semibold text-[var(--landing-navy)] sm:text-[19px] lg:text-[18px]">
                        {step.title}
                        {"optionalSuffix" in step && step.optionalSuffix ? (
                          <>
                            {" "}
                            <span className="font-medium text-[#8B9AAB]">
                              {step.optionalSuffix}
                            </span>
                          </>
                        ) : null}
                      </h3>
                    </CardContent>
                  </Card>
                  {index < steps.length - 1 ? (
                    <>
                      <ArrowDown className="my-1 size-5 text-[#8B9AAB] lg:hidden" />
                      <ChevronRight
                        className="hidden size-7 shrink-0 self-center text-[#8B9AAB] lg:block"
                        strokeWidth={2}
                      />
                    </>
                  ) : null}
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        <LandingFadeSeparator />

        {/* Comparison — z-[90] keeps demo chat launcher (z-[100]) visible above */}
        <section className="relative z-[90] bg-white">
          <div
            className={cn(
              "mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10",
              DESKTOP_CONTAINER,
            )}
          >
            <div className="mx-auto max-w-3xl text-center">
              <SectionHeading className="text-[28px] lg:text-[38px]">
                <span className="text-[var(--landing-orange)]">Without</span>{" "}
                vs. <span className="text-[var(--landing-orange)]">With</span>
                <br className="lg:hidden" />
                <span className="hidden lg:inline"> </span>
                Our AI Sales Assistant
              </SectionHeading>
            </div>

            <div className="mx-auto mt-10 hidden overflow-hidden rounded-2xl border border-[#D8E2EC] lg:mt-10 lg:grid lg:w-full lg:max-w-[1140px] lg:grid-cols-2">
              <div className="border-b border-[#D8E2EC] bg-[#FEF2F2] px-6 py-4 text-center text-[15px] font-bold uppercase tracking-wide text-[#6B7280] lg:border-r">
                Without
              </div>
              <div className="border-b border-[#D8E2EC] bg-[#EFF6FF] px-6 py-4 text-center text-[15px] font-bold uppercase tracking-wide text-[var(--landing-navy)]">
                With
              </div>
              {comparisonRows.map((row) => (
                <Fragment key={row.without}>
                  <div className="flex min-h-[72px] items-center gap-3 border-b border-[#D8E2EC] bg-[#FEF2F2] px-6 py-5 last:border-b-0 lg:border-r">
                    <X
                      className="size-5 shrink-0 text-[#F87171]"
                      strokeWidth={2.5}
                    />
                    <p className="text-[17px] leading-snug text-[#6B7280]">
                      {row.without}
                    </p>
                  </div>
                  <div className="flex min-h-[72px] items-center gap-3 border-b border-[#D8E2EC] bg-[#EFF6FF] px-6 py-5 last:border-b-0">
                    <Check
                      className="size-5 shrink-0 text-[#3B82F6]"
                      strokeWidth={2.5}
                    />
                    {"withSuffixStack" in row && row.withSuffixStack ? (
                      <p className="text-[17px] font-bold leading-snug text-[var(--landing-navy)]">
                        {row.withPrefix} {row.withSuffixStack[0]}{" "}
                        {row.withSuffixStack[1]}
                      </p>
                    ) : "withPrice" in row && row.withPrice ? (
                      <p className="text-[17px] font-bold leading-snug text-[var(--landing-navy)]">
                        {row.withPrefix}{" "}
                        <FormattedPrice
                          amount={publicConfig.lifetimeAccessPriceUsd}
                        />{" "}
                        {row.withSuffix}
                      </p>
                    ) : "with" in row ? (
                      <p className="text-[17px] font-bold leading-snug text-[var(--landing-navy)]">
                        {row.with}
                      </p>
                    ) : null}
                  </div>
                </Fragment>
              ))}
            </div>

            <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-[14px] sm:mt-12 sm:gap-5 lg:hidden">
              {comparisonRows.map((row) => (
                <div
                  key={row.without}
                  className="overflow-hidden rounded-2xl border border-[#D8E2EC]"
                >
                  <div className="flex items-center gap-3 bg-[#FEF2F2] px-4 py-4 sm:px-5 sm:py-5">
                    <X
                      className="size-5 shrink-0 text-[#F87171]"
                      strokeWidth={2.5}
                    />
                    <p className="text-[15px] leading-snug text-[#6B7280] sm:text-[17px]">
                      {row.without}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-[#EFF6FF] px-4 py-4 sm:px-5 sm:py-5">
                    <Check
                      className="size-5 shrink-0 text-[#3B82F6]"
                      strokeWidth={2.5}
                    />
                    {"withSuffixStack" in row && row.withSuffixStack ? (
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="text-[15px] font-bold leading-snug text-[var(--landing-navy)] sm:text-[17px]">
                          {row.withPrefix}
                        </span>
                        <span className="shrink-0 text-[15px] font-bold leading-tight text-[var(--landing-navy)] sm:text-[17px]">
                          <span className="block">
                            {row.withSuffixStack[0]}
                          </span>
                          <span className="block">
                            {row.withSuffixStack[1]}
                          </span>
                        </span>
                      </div>
                    ) : "withPrice" in row && row.withPrice ? (
                      <p className="text-[15px] font-bold leading-snug text-[var(--landing-navy)] sm:text-[17px]">
                        {row.withPrefix}{" "}
                        <FormattedPrice
                          amount={publicConfig.lifetimeAccessPriceUsd}
                        />{" "}
                        {row.withSuffix}
                      </p>
                    ) : "with" in row ? (
                      <p className="text-[15px] font-bold leading-snug text-[var(--landing-navy)] sm:text-[17px]">
                        {row.with}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing — z-[130] hides sticky mobile CTA (z-[120]) and demo chat launcher (z-[100]) */}
        <section
          id="landing-pricing"
          className="relative z-[130] mt-10 bg-[var(--landing-navy)] sm:mt-12 lg:mt-16"
        >
          <div
            className={cn(
              "mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-24 sm:pb-20",
              DESKTOP_CONTAINER,
              DESKTOP_SECTION,
            )}
          >
            <div className="mx-auto max-w-3xl text-center">
              <SectionHeading onDark className="text-[28px] lg:text-[40px]">
                Stop Losing Potential Leads for Just{" "}
                <span className="text-[#FC9018]">
                  <FormattedPrice
                    amount={publicConfig.lifetimeAccessPriceUsd}
                  />
                </span>
              </SectionHeading>
            </div>

            <Card className="mx-auto mt-10 max-w-2xl overflow-hidden border-white/10 bg-white py-0 shadow-xl sm:mt-12 lg:mt-10 lg:max-w-[1040px] lg:shadow-2xl">
              <CardContent className="space-y-5 px-6 pb-4 pt-6 sm:space-y-6 sm:px-8 sm:pb-5 sm:pt-7 lg:space-y-0 lg:px-10 lg:pb-8 lg:pt-9">
                <p className="text-center text-[21px] font-bold uppercase tracking-wide text-[var(--landing-orange)] sm:text-[25px] lg:hidden">
                  Pay Once. Use Forever.
                </p>

                <div className="lg:grid lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-10 lg:gap-x-10 xl:gap-x-12">
                  <div>
                    <p className="mb-5 hidden text-[24px] font-bold uppercase tracking-wide text-[var(--landing-orange)] lg:block xl:text-[26px]">
                      Pay Once. Use Forever.
                    </p>
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:gap-3.5">
                      {pricingFeatures.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2.5 text-[16px] text-[var(--landing-navy)] sm:text-[17px] lg:text-[18px]"
                        >
                          <Check
                            className="mt-0.5 size-5 shrink-0 text-[#3B82F6]"
                            strokeWidth={2.5}
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col items-center gap-2 text-center sm:gap-3 lg:justify-center lg:gap-4 lg:px-1 lg:py-2">
                    <Separator className="bg-[#D8E2EC] lg:hidden" />

                    <p className="text-[17px] font-semibold text-[var(--landing-navy)] sm:text-[19px] lg:text-[22px] lg:leading-snug">
                      Capture More Leads Without Another Monthly Bill.
                    </p>
                    <div className="flex w-full flex-col items-center gap-3 lg:gap-4">
                      <RecentPurchasesSocialProof className="lg:text-[16px]" />
                      <CtaButton
                        className="w-full sm:w-auto lg:w-full lg:[&_a]:px-7 lg:[&_a]:py-4 lg:[&_a]:text-[20px]"
                        showDiscountBadge={!hasLifetimeAccess}
                        size="large"
                        priceBelow
                        {...marketingCta}
                      />
                    </div>
                    <p className="mb-1 pt-1 text-[13px] font-bold uppercase tracking-wide text-[#16A34A] lg:text-[14px]">
                      Try It Risk-Free
                    </p>
                    <MoneyBackGuarantee
                      centered
                      className="lg:[&_p:first-child]:text-[18px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        {/* Footer — z-[130] hides sticky mobile CTA and demo chat launcher */}
        <section className="relative z-[130] bg-white pb-8 lg:pb-12">
          <div
            className={cn(
              "mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12",
              DESKTOP_CONTAINER,
            )}
          >
            <footer className="flex flex-col items-center gap-3 border-t border-[#D8E2EC] pt-8 text-center">
              <LogoMark />
              <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <Link
                  href="/terms-of-service"
                  className="text-[13px] font-medium text-[#5B6B7C] hover:text-[var(--landing-navy)] hover:underline"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/privacy-policy"
                  className="text-[13px] font-medium text-[#5B6B7C] hover:text-[var(--landing-navy)] hover:underline"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/refund-policy"
                  className="text-[13px] font-medium text-[#5B6B7C] hover:text-[var(--landing-navy)] hover:underline"
                >
                  Refund Policy
                </Link>
              </nav>
              <p className="text-[13px] text-[#8B9AAB]">
                © {new Date().getFullYear()} {publicConfig.appName}. All rights
                reserved.
              </p>
            </footer>
          </div>
        </section>
        <StickyMobileCta hasLifetimeAccess={hasLifetimeAccess} />
        <StickyDesktopCta hasLifetimeAccess={hasLifetimeAccess} />
      </div>
    </>
  );
}
