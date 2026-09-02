import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowDown,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Globe,
  MessageSquare,
  Phone,
  Star,
  StarHalf,
  UserCheck,
  X,
} from "lucide-react";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { CtaButton } from "@/components/marketing/cta-button";
import {
  DemoChatSection,
  DemoTryButton,
} from "@/components/marketing/demo-chat/demo-chat-section";
import { StickyDesktopCta } from "@/components/marketing/sticky-desktop-cta";
import { StickyMobileCta } from "@/components/marketing/sticky-mobile-cta";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
    title: "Capture student details before they leave",
    description: "Name, phone & email — fully customizable.",
  },
  {
    icon: ClipboardCheck,
    title: "Qualify students automatically",
    description:
      "Understand what they want, where they want to study, and when.",
  },
  {
    icon: MessageSquare,
    title: "Answer their questions instantly",
    description: "Courses, universities, fees, eligibility, and more.",
  },
  {
    icon: Phone,
    title: "Send qualified leads to your team",
    description: "With the full conversation and student details.",
  },
] as const;

const problemPoints = [
  {
    icon: Globe,
    text: "They may be researching their ideal country or university.",
  },
  {
    icon: CircleHelp,
    text: "They may have questions about courses, fees, or eligibility.",
  },
  {
    icon: ClipboardCheck,
    text: "They may be seriously considering applying.",
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
    title: "Add Your AI Counselor to Your Website",
    description: "Get it running on your website in minutes.",
  },
  {
    number: "2",
    title: "Customize Your AI Counselor",
    description: "Choose what to ask, qualify, and collect from students",
  },
  {
    number: "3",
    title: "Start Capturing Student Leads",
    description:
      "Your AI counselor starts engaging with students 24/7 to qualify and collect their details.",
  },
] as const;

const comparisonRows = [
  {
    without:
      "Students who visit after working hours leave and enroll with competitors.",
    with: "Our AI guides them and captures their details 24/7—even when the office is closed.",
  },
  {
    without: "Counselors follow up cold, with no idea what the student wants.",
    with: "Counselors follow up warm, knowing what the student wants.",
  },
  {
    without: "Endless monthly fees for lead-capturing chat tools.",
    with: "A one-time payment to capture student leads for life.",
  },
] as const;

const pricingFeatures = [
  "Generate More Qualified Student Leads",
  "Capture Their Details While They're Still Interested",
  "Qualify Students Automatically",
  "Know What Each Student Is Looking For Before You Follow Up",
  "Capture & Qualify Leads 24/7",
] as const;

const faqItems = [
  {
    question:
      "Will the AI give students incorrect information about visas or university fees?",
    answer:
      "Absolutely not. Our AI never guesses — we trained it that way. It automatically learns directly from your website's existing content and any additional information you provide in the dashboard. If a student asks a highly complex question that isn't covered in your materials, the AI will not invent an answer. Instead, it will politely provide your agency's direct contact details and guide the student to speak directly with your human counselors.",
  },
  {
    question: "Do I need a developer or IT team to install this?",
    answer:
      "Not at all. If you can copy and paste, you can install this. We provide a small script that you simply paste into your website—regardless of whether you use WordPress, Wix, Squarespace, or a custom-built site. It takes less than two minutes. And if you have any doubts or need a hand, our technical team is always available to help and guide you through the process step-by-step.",
  },
  {
    question:
      "If this is a lifetime deal, who pays for the ongoing AI costs? Are there hidden fees?",
    answer:
      "There are zero hidden fees and no monthly subscriptions. Here is how we do it: Unlike generic AI tools (which use massive, expensive computing power to write essays or code), our AI is highly specialized strictly for student admissions and lead capture. Because it is highly optimized for this one specific task, the computing cost per conversation is microscopic—literally fractions of a penny. This efficiency allows us to comfortably cover typical enrollment volumes of up to 500 messages every single month, easily absorbing this tiny cost into your one-time payment.",
  },
  {
    question:
      "Where do my counselors actually access the captured student leads?",
    answer:
      "All your qualified student leads and complete chat transcripts are securely stored in your centralized AI Dashboard. Instead of losing high-value student phone numbers in a messy folder, your team gets one clean, organized portal. Your counselors can instantly see the newest qualified students, view their target countries, and start following up.",
  },
  {
    question: "Can I customize what information the AI asks the student for?",
    answer:
      "Yes. You can program the AI to ask mandatory qualifying questions—such as their target country, desired intake date, and academic background—before it collects their contact details.",
  },
] as const;

const testimonials = [
  {
    quote:
      "Honestly, I wasn\u2019t sure at first. We were already getting enquiries from our website, so I didn\u2019t expect a huge difference. But after adding the AI counselor, we started getting more student leads than before. For AED 369, I\u2019d say it\u2019s definitely worth it.",
    highlights: [
      "we started getting",
      "more student leads than before",
      "definitely worth it.",
    ],
    name: "Zain Khan",
    role: "VERIFIED CUSTOMER",
    rating: 5,
    image: "/testimonials/review-zain-v2.webp",
  },
  {
    quote:
      "The best part for us is that we don\u2019t just get the student\u2019s contact details. We can actually see what they were asking about and what they\u2019re interested in. So when our counselor calls them, we already have an idea of what they want.",
    highlights: [
      "The best part for us is",
      "We can actually see what they were asking about and what they\u2019re interested in.",
    ],
    name: "Sara Zaabi",
    role: "VERIFIED CUSTOMER",
    rating: 5,
    image: "/testimonials/review-sara-v2.webp",
  },
  {
    quote:
      "I honestly thought the setup would be a bit complicated, but it was simple. We got it running on our website pretty quickly. Even when we\u2019re not in the office, the AI can talk to them and collect their details.",
    highlights: [
      "setup",
      "was simple",
      "Even when we\u2019re not in the office",
      "AI can talk to them and collect their details",
    ],
    name: "Hamad Shamsi",
    role: "VERIFIED CUSTOMER",
    rating: 5,
    image: "/testimonials/review-hamad-v2.webp",
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
  onDark = false,
}: {
  className?: string;
  centered?: boolean;
  onDark?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative w-full rounded-xl border px-1.5 pb-3 pt-5 sm:px-2",
        onDark
          ? "border-[#4ADE80]/45 bg-transparent"
          : "border-[#86EFAC] bg-[#F0FDF4]",
        className,
      )}
    >
      <div
        className={cn(
          "absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 px-1.5",
          onDark ? "bg-[var(--landing-navy)]" : "bg-[#F0FDF4]",
        )}
      >
        <GuaranteeShield />
      </div>

      <div
        className={cn(
          "flex flex-col gap-0.5",
          centered ? "text-center" : "text-left",
        )}
      >
        <p
          className={cn(
            "whitespace-nowrap text-[17px] font-bold uppercase leading-tight",
            onDark ? "text-[#86EFAC]" : "text-[#16A34A]",
          )}
        >
          100% Money-Back Guarantee
        </p>
        <p
          className={cn(
            "whitespace-nowrap text-[15px] font-medium italic leading-snug",
            onDark ? "text-[#86EFAC]/90" : "text-[#16A34A]",
          )}
        >
          No lead in 30 days? Get full refund.
        </p>
        <p
          className={cn(
            "whitespace-nowrap text-[16px] font-bold uppercase leading-snug",
            onDark ? "text-[#86EFAC]" : "text-[#16A34A]",
          )}
        >
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
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className="size-5 fill-[var(--landing-orange)] text-[var(--landing-orange)]"
          />
        ))}
      </div>
      <p className="text-[15px] text-white/75 sm:text-[17px]">
        <span className="font-bold text-white">4.9</span>/5 from customers
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
        className="text-[17px] font-semibold text-[var(--landing-orange)] sm:text-[21px] lg:text-[17px]"
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
  showSolutionVideo = true,
}: {
  hasLifetimeAccess?: boolean;
  /** Mobile looping demo under the Solution section. Off for AB-test variants. */
  showSolutionVideo?: boolean;
}) {
  const marketingCta = resolveMarketingCta(hasLifetimeAccess);
  const pricingCta = resolveMarketingCta(hasLifetimeAccess, {
    showPrice: true,
  });

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

                  <h1 className="mb-4 w-[calc(100%+1.5rem)] max-w-none -mx-3 text-[30px] font-bold leading-[1.1] tracking-tight text-[var(--landing-navy)] sm:mx-0 sm:mb-5 sm:w-full sm:text-[37px] sm:leading-[1.1] lg:mb-5 lg:text-balance lg:text-[52px] lg:leading-[1.08] xl:text-[56px]">
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
                        Stop losing students to competitors after working hours.
                        Our AI guides students and captures their details even
                        when your office is closed.
                      </p>
                      <p className="mt-4 text-left text-[17px] font-medium leading-relaxed text-[var(--landing-navy)] sm:text-[18px] lg:mt-5 lg:text-[19px]">
                        Our AI counselor works 24/7 on your website to:
                      </p>
                      <ul className="mt-3 flex flex-col gap-2.5 sm:mt-4 sm:gap-3">
                        <HeroCheckPoint>
                          <strong className="font-bold">Answer</strong> student
                          questions
                        </HeroCheckPoint>
                        <HeroCheckPoint>
                          <strong className="font-bold">Qualify</strong>{" "}
                          students
                        </HeroCheckPoint>
                        <HeroCheckPoint>
                          <strong className="font-bold">Capture</strong> their
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
                  <div className="mx-auto flex w-full flex-col items-center gap-5 sm:gap-6 lg:hidden">
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
                  Student Interest{" "}
                </span>
                <span className="block whitespace-nowrap text-white lg:inline">
                  Doesn&apos;t Always Turn{" "}
                </span>
                <span className="block whitespace-nowrap text-white lg:inline">
                  Into{" "}
                  <span className="text-[var(--landing-orange)]">
                    An Enquiry
                  </span>
                </span>
              </h2>

              <div className="mt-7 flex flex-col gap-4 lg:hidden">
                {problemPoints.map((point) => (
                  <ProblemPoint key={point.text} icon={point.icon}>
                    {point.text}
                  </ProblemPoint>
                ))}
              </div>

              <div className="mt-10 hidden lg:grid lg:grid-cols-3 lg:gap-8">
                {problemPoints.map((point) => (
                  <ProblemPoint key={point.text} icon={point.icon}>
                    {point.text}
                  </ProblemPoint>
                ))}
              </div>

              <p className="mt-6 text-[16px] font-medium leading-relaxed text-white/85 sm:text-[17px] lg:mt-8 lg:text-[18px]">
                But if they can&apos;t get instant answers, they can still{" "}
                <span className="font-semibold italic text-[var(--landing-orange)]">
                  leave your website
                </span>{" "}
                without making an enquiry.
              </p>

              <p className="mt-5 border-l-4 border-[var(--landing-orange)] pl-4 text-[17px] font-bold leading-snug text-white sm:pl-5 sm:text-[19px] lg:mx-auto lg:mt-8 lg:max-w-[780px] lg:border-l-0 lg:border-t-4 lg:px-8 lg:py-5 lg:pl-8 lg:text-center lg:text-[22px] lg:font-extrabold lg:leading-[1.35] lg:tracking-tight">
                If a student visits after working hours and can&apos;t get
                instant answers, they won&apos;t wait until morning. They will
                simply leave and{" "}
                <span className="italic text-[var(--landing-orange)]">
                  enroll with a competitor
                </span>
                .
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
            <div className="mx-auto max-w-3xl text-center lg:max-w-[900px]">
              <SectionLabel light className="mb-6 text-[14px]">
                The Solution
              </SectionLabel>
            </div>

            <div className="mx-auto max-w-3xl text-center">
              <SectionHeading className="text-[28px] lg:text-[38px]">
                <span className="text-[var(--landing-orange)]">Without</span>{" "}
                vs. <span className="text-[var(--landing-orange)]">With</span>{" "}
                our AI Counselor
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
                    <p className="text-[17px] font-bold leading-snug text-[#6B7280]">
                      {row.without}
                    </p>
                  </div>
                  <div className="flex min-h-[72px] items-center gap-3 border-b border-[#D8E2EC] bg-[#EFF6FF] px-6 py-5 last:border-b-0">
                    <Check
                      className="size-5 shrink-0 text-[#16A34A]"
                      strokeWidth={2.5}
                    />
                    {"with" in row ? (
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
                    <p className="text-[15px] font-bold leading-snug text-[#6B7280] sm:text-[17px]">
                      {row.without}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-[#EFF6FF] px-4 py-4 sm:px-5 sm:py-5">
                    <Check
                      className="size-5 shrink-0 text-[#16A34A]"
                      strokeWidth={2.5}
                    />
                    {"with" in row ? (
                      <p className="text-[15px] font-bold leading-snug text-[var(--landing-navy)] sm:text-[17px]">
                        {row.with}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-10 max-w-3xl text-center sm:mt-12 lg:mt-16 lg:max-w-[900px]">
              <h2 className="text-balance text-[28px] font-bold tracking-tight text-[var(--landing-navy)] sm:text-[31px] lg:text-[38px]">
                Turn More Website Visitors Into{" "}
                <span className="text-[var(--landing-orange)]">
                  Qualified Student Leads
                </span>
              </h2>
              <p className="mt-4 text-[17px] font-medium text-[var(--landing-navy)] sm:text-[19px] lg:text-[19px]">
                Our AI counselor works 24/7 on your website to:
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:hidden">
              {captureFeatures.map((feature) => (
                <Card
                  key={feature.title}
                  className="h-full border-[#D8E2EC] bg-white py-0 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="flex items-start gap-2.5 px-3.5 py-3 sm:px-4 sm:py-3.5">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-orange)]/10 text-[var(--landing-orange)]">
                      <feature.icon className="size-[18px]" />
                    </div>
                    <div>
                      <p className="text-[17px] font-bold leading-snug text-[var(--landing-navy)]">
                        {feature.title}
                      </p>
                      <p className="mt-1 text-[16px] font-medium leading-snug text-[#5A6B7D]">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mx-auto mt-10 hidden max-w-[1140px] grid-cols-2 gap-5 lg:mt-12 lg:grid">
              {captureFeatures.map((feature) => (
                <Card
                  key={feature.title}
                  className="min-h-[88px] border-[#D8E2EC] bg-white py-0 shadow-md"
                >
                  <CardContent className="flex h-full items-start gap-3 px-5 py-5">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-orange)]/10 text-[var(--landing-orange)]">
                      <feature.icon className="size-[18px]" />
                    </div>
                    <div>
                      <p className="text-[17px] font-bold leading-snug text-[var(--landing-navy)]">
                        {feature.title}
                      </p>
                      <p className="mt-1.5 text-[16px] font-medium leading-snug text-[#5A6B7D]">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="mx-auto mt-10 max-w-2xl text-center text-[17px] font-semibold text-[var(--landing-navy)] sm:mt-12 sm:text-[19px] lg:mt-10 lg:max-w-3xl lg:text-[20px]">
              So your team can follow up while the student is still interested.
            </p>

            {showSolutionVideo ? (
              <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-xl sm:mt-12 lg:hidden">
                <video
                  src="/solution-demo.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-hidden
                  tabIndex={-1}
                  className="pointer-events-none block h-auto w-full"
                />
              </div>
            ) : null}
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
                What Study Abroad Agency{" "}
                <span className="text-[var(--landing-orange)]">
                  Owners Are Saying
                </span>
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
                    <p className="flex-1 text-[17px] leading-[26px] text-[#3F4F5F] sm:text-[21px] sm:leading-8 lg:text-[17px] lg:leading-[26px]">
                      <QuoteWithHighlights
                        quote={testimonial.quote}
                        highlights={
                          "highlights" in testimonial
                            ? testimonial.highlights
                            : undefined
                        }
                      />
                    </p>
                    <div className="mt-auto flex items-center gap-3">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-[var(--landing-navy)]">
                          {testimonial.name}
                        </p>
                        <p className="mt-0.5 text-[13px] font-bold uppercase tracking-wide text-[#3B82F6] sm:text-[15px]">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center text-center sm:mt-12 lg:mt-10">
              {isPublicDemoEnabled ? (
                <p className="mb-8 w-full border-l-4 border-[var(--landing-orange)] pl-4 text-left text-[17px] font-bold leading-snug text-white sm:mb-10 sm:pl-5 sm:text-[19px] lg:mb-10 lg:max-w-2xl lg:border-l-0 lg:pl-0 lg:text-center lg:text-[19px]">
                  Now imagine this working on your website.
                </p>
              ) : null}

              <p className="text-balance text-[22px] font-bold leading-snug text-white sm:text-[25px] lg:text-[28px]">
                Want More Qualified Student Leads?
              </p>
              <div className="mt-5 w-full max-w-sm sm:mt-6">
                <CtaButton className="w-full" buttonClassName="text-[18px] sm:text-[22px]" {...marketingCta} />
              </div>
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
                Go Live In{" "}
                <span className="text-[var(--landing-orange)]">5 Minutes</span>
              </SectionHeading>
            </div>

            <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-2 sm:mt-12 lg:mt-10 lg:max-w-none lg:flex-row lg:items-stretch lg:gap-4">
              {steps.map((step, index) => (
                <Fragment key={step.number}>
                  <Card className="h-full w-full border-[#D8E2EC] bg-white py-0 shadow-sm lg:min-h-[200px] lg:flex-1 lg:shadow-md">
                    <CardContent className="flex h-full items-center gap-4 px-5 py-3 sm:px-6 sm:py-4 lg:flex-col lg:justify-center lg:px-6 lg:py-6 lg:text-center">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--landing-orange)] text-[19px] font-bold text-white lg:size-14 lg:text-[22px]">
                        {step.number}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[17px] font-bold text-[var(--landing-navy)] sm:text-[19px] lg:text-[18px]">
                          {step.title}
                        </h3>
                        <p className="mt-1.5 text-[16px] font-medium leading-snug text-[#5A6B7D] lg:mx-auto lg:mt-2 lg:max-w-[18rem]">
                          {step.description}
                        </p>
                      </div>
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
                Stop Losing Potential Students for Just{" "}
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

                    <p className="mt-3 text-[17px] font-semibold text-[var(--landing-navy)] sm:mt-4 sm:text-[19px] lg:mt-0 lg:text-[22px] lg:leading-snug">
                      Capture More Student Leads Without Another Monthly Bill.
                    </p>
                    <div className="flex w-full flex-col items-center gap-3 lg:gap-4">
                      <CtaButton
                        className="w-full sm:w-auto lg:w-full lg:[&_a]:px-7 lg:[&_a]:py-4 lg:[&_a]:text-[20px]"
                        showDiscountBadge={!hasLifetimeAccess}
                        size="large"
                        priceBelow
                        {...pricingCta}
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

        {/* FAQ — below sticky CTAs (z-[120]) so floating CTA stays on top */}
        <section id="landing-faq" className="relative z-[110] bg-white">
          <div
            className={cn(
              "mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16",
              DESKTOP_CONTAINER,
              DESKTOP_SECTION,
            )}
          >
            <div className="mx-auto max-w-3xl text-center">
              <SectionHeading className="text-[28px] text-[var(--landing-orange)] lg:text-[38px]">
                FAQ
              </SectionHeading>
            </div>

            <Accordion
              type="single"
              collapsible
              className="mx-auto mt-6 max-w-3xl gap-0 rounded-xl border border-[#D8E2EC] bg-white px-4 sm:mt-6 sm:px-6 lg:mt-6 lg:max-w-4xl"
            >
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={item.question}
                  value={`faq-${index}`}
                  className="border-[#D8E2EC]"
                >
                  <AccordionTrigger className="py-5 text-[16px] font-semibold text-[var(--landing-navy)] hover:no-underline sm:text-[17px] lg:text-[18px] **:data-[slot=accordion-trigger-icon]:text-[var(--landing-navy)]/55">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-[15px] leading-relaxed text-[#5B6B7C] sm:text-[16px]">
                    <p>{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA — z-[130] hides sticky mobile CTA and demo chat launcher */}
        <section
          id="landing-final-cta"
          className="relative z-[130] bg-[var(--landing-navy)]"
        >
          <div
            className={cn(
              "mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20",
              DESKTOP_CONTAINER,
              DESKTOP_SECTION,
            )}
          >
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <SectionHeading onDark className="text-[28px] lg:text-[38px]">
                Just <span className="text-[var(--landing-orange)]">ONE</span>{" "}
                Extra Student Pays For This AI Forever.
              </SectionHeading>
              <p className="mt-5 max-w-2xl text-[17px] font-medium leading-relaxed text-white/80 sm:mt-6 sm:text-[18px] lg:text-[19px]">
                <strong className="font-bold text-white">
                  Stop losing leads to competitors after hours.
                </strong>{" "}
                Let your AI counselor capture student details 24/7.
              </p>

              <div className="mt-8 flex w-full max-w-md flex-col items-center gap-3 sm:mt-10 lg:mt-10">
                <CtaButton
                  className="w-full sm:w-auto lg:w-full lg:[&_a]:px-8 lg:[&_a]:py-4 lg:[&_a]:text-[22px]"
                  showDiscountBadge={!hasLifetimeAccess}
                  size="large"
                  {...marketingCta}
                  label={
                    hasLifetimeAccess
                      ? marketingCta.label
                      : "Start Capturing Leads Risk-Free"
                  }
                  showPrice={false}
                />
                <p className="mb-1 pt-1 text-[13px] font-bold uppercase tracking-wide text-[#86EFAC] lg:text-[14px]">
                  Try It Risk-Free
                </p>
                <MoneyBackGuarantee
                  centered
                  onDark
                  className="lg:[&_p:first-child]:text-[18px]"
                />
              </div>
            </div>
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
