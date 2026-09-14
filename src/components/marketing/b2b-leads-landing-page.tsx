import {
  Check,
  Clock3,
  Database,
  FileSpreadsheet,
  Filter,
  Globe2,
  Infinity,
  MapPin,
  Search,
  ShieldAlert,
  Wallet,
  Zap,
} from "lucide-react";
import { Manrope, Syne } from "next/font/google";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { CtaButton } from "@/components/marketing/cta-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { resolveMarketingCta } from "@/lib/marketing/cta";
import { cn } from "@/lib/utils";

const displayFont = Syne({
  subsets: ["latin"],
  variable: "--font-leads-display",
  display: "swap",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-leads-body",
  display: "swap",
});

const heroChecks = [
  "Live & Daily Updated Data (99% Accuracy)",
  "250 Million+ B2B Leads Ready to Pitch",
  "30-Second Lead Generation Speed",
  "No Hidden Fees (₹999 One-Time Payment)",
] as const;

const problemPoints = [
  {
    icon: Database,
    title: "Dead Data",
    text: "You buy a cheap Excel sheet online, but half the phone numbers are wrong and the emails bounce.",
  },
  {
    icon: Wallet,
    title: "Expensive Monthly Fees",
    text: "Big lead generation platforms charge ₹5,000 to ₹10,000 every single month just to use them.",
  },
  {
    icon: ShieldAlert,
    title: "Hard to Use",
    text: "Most software requires watching hours of tutorials just to find a single customer.",
  },
] as const;

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Enter Your Category",
    text: 'Type who you are looking for (Example: "Real Estate Agents", "Software Companies").',
  },
  {
    number: "02",
    icon: MapPin,
    title: "Pick Your Location",
    text: "Target any location in the world.",
  },
  {
    number: "03",
    icon: FileSpreadsheet,
    title: "Click Generate & Export",
    text: "Wait just 30 seconds. Watch the software build a fresh list of live businesses. Click one button to export everything to a clean Excel or CSV file.",
  },
] as const;

const features = [
  {
    icon: Zap,
    title: "Live & Daily Updated Data (99% Accuracy)",
    text: "You get the freshest information available today. Say goodbye to wrong, outdated B2B lead data.",
  },
  {
    icon: Globe2,
    title: "250 Million+ B2B Leads",
    text: "Our tool gives you access to a massive global network of businesses.",
  },
  {
    icon: Filter,
    title: "Category & Location-Based Filtering",
    text: "Stop pitching to the wrong people. Pinpoint your exact target market by filtering businesses by their specific category and exact location.",
  },
  {
    icon: Clock3,
    title: "30-Second Lead Generation Speed",
    text: "Your time is money. Don't wait hours for a software to run. Get your targeted list in 30 seconds.",
  },
  {
    icon: FileSpreadsheet,
    title: "1-Click CSV / Excel Export",
    text: "Get your B2B lead data ready for action immediately. One click gives you a clean Excel sheet with all needed lead data, ready for your pitching.",
  },
  {
    icon: Infinity,
    title: "Lifetime License & Free Updates",
    text: "When you buy today, you own the software forever. When we add new features or make the software even faster, you get those updates completely free.",
  },
] as const;

const pricingPerks = [
  "Full Lifetime Software License",
  "Live & 99% Accurate Data",
  "Extremely Simple to Use",
  "Free Future Updates included",
  "250 Million+ B2B Leads",
  "Get Leads in 30 Seconds",
  "1-Click CSV / Excel Export",
  "Category & Location Based Filtering",
] as const;

const faqItems = [
  {
    q: "Is it really just a one-time payment of ₹999?",
    a: "Yes. There are absolutely no monthly subscriptions, hidden fees, or surprise charges. You pay ₹999 once and use the software forever.",
  },
  {
    q: "Is the data actually accurate?",
    a: "Yes, we offer 99% accuracy because the software pulls live, daily-updated data based on real locations, rather than selling you an old, outdated static file.",
  },
  {
    q: "Do I need technical skills to use this?",
    a: "Not at all. We built this to be incredibly simple and easy to use. Just type your target audience, type a location, and hit generate.",
  },
  {
    q: "How do I get my leads out of the software?",
    a: 'With a single click. There is a built-in "Export to Excel/CSV" button that instantly saves all your fresh leads into a neat, organized file.',
  },
] as const;

const sampleLeads = [
  { name: "Horizon Dental Clinic", place: "Andheri West, Mumbai", phone: "+91 98••• ••214" },
  { name: "Northline Logistics", place: "Whitefield, Bengaluru", phone: "+91 80••• ••901" },
  { name: "Cedar Real Estate", place: "Koramangala 5th Block", phone: "+91 97••• ••448" },
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[13px] font-semibold tracking-[0.16em] text-[var(--leads-accent)] uppercase">
      {children}
    </p>
  );
}

function CtaNote({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <p
      className={cn(
        "mt-3 text-center text-[15px] leading-snug sm:text-[16px]",
        light ? "text-white/70" : "text-[var(--leads-muted)]",
        className,
      )}
    >
      Instant access. One-time payment.
    </p>
  );
}

function MapBackdrop({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 640 520"
      className={cn("h-full w-full", className)}
      fill="none"
    >
      <path
        d="M70 120C140 70 220 95 280 140C340 185 390 170 450 120C510 70 560 90 590 140"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.55"
      />
      <path
        d="M40 240C120 190 190 230 250 280C310 330 380 300 450 250C520 200 580 230 620 280"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.42"
      />
      <path
        d="M80 380C150 330 230 350 300 390C370 430 440 400 510 350C560 315 600 330 630 360"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.34"
      />
      <circle cx="180" cy="160" r="54" stroke="currentColor" strokeWidth="1.5" opacity="0.28" />
      <circle cx="180" cy="160" r="28" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <circle cx="420" cy="250" r="70" stroke="currentColor" strokeWidth="1.5" opacity="0.22" />
      <circle cx="420" cy="250" r="36" stroke="currentColor" strokeWidth="1.5" opacity="0.34" />
      <circle cx="520" cy="120" r="18" fill="currentColor" opacity="0.28" />
      <circle cx="120" cy="320" r="10" fill="currentColor" opacity="0.32" />
      <circle cx="360" cy="120" r="8" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function FloatingPin({
  className,
  label,
  delay = "0s",
}: {
  className?: string;
  label: string;
  delay?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-20 flex items-center gap-2 rounded-full border border-[#B7CBE2] bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--leads-ink)] shadow-[0_10px_30px_rgba(11,31,51,0.14)]",
        className,
      )}
      style={{ animationDelay: delay }}
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-[var(--leads-accent)] text-white">
        <MapPin className="size-3.5" />
      </span>
      {label}
    </div>
  );
}

function LeadPreviewPanel({ className }: { className?: string }) {
  return (
    <div className={cn("relative px-1 pb-2 pt-3 sm:px-2 sm:pb-3 sm:pt-4", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-4 inset-y-6 -z-10 rounded-[28px] bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.32),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(11,31,51,0.16),transparent_50%)] blur-2xl"
      />

      <div className="relative z-10 overflow-hidden rounded-2xl border border-[#1E3A5F] bg-[#0C1824] shadow-[0_28px_70px_rgba(8,16,28,0.35)]">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <MapBackdrop className="text-[#7BA4D4]" />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-4 size-20 rounded-full border border-[#93B4D8]/45 animate-[leads-pulse_3.5s_ease-out_infinite]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full border border-[#93B4D8]/25 animate-[leads-pulse_3.5s_ease-out_0.6s_infinite]"
        />

        <div className="relative border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[12px] text-white/55">
              <span className="size-2.5 rounded-full bg-white/20" />
              <span className="size-2.5 rounded-full bg-white/20" />
              <span className="size-2.5 rounded-full bg-white/20" />
              <span className="ml-2 font-medium tracking-wide">Lead Generator</span>
            </div>
            <span className="rounded-full bg-[#2563EB]/25 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#93C5FD]">
              LIVE DATA
            </span>
          </div>
        </div>

        <div className="relative space-y-3 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
              <p className="text-[11px] font-semibold tracking-wide text-white/45 uppercase">
                Category
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[14px] font-medium text-white">
                <Search className="size-3.5 shrink-0 text-[#93C5FD]" />
                Software Companies
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
              <p className="text-[11px] font-semibold tracking-wide text-white/45 uppercase">
                Location
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[14px] font-medium text-white">
                <MapPin className="size-3.5 shrink-0 text-[#93C5FD]" />
                Mumbai, 400053
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
            <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2.5">
              <p className="text-[12px] font-semibold text-white">Fresh leads ready</p>
              <p className="text-[12px] font-medium text-[#93C5FD]">Generated in 30s</p>
            </div>
            <ul className="divide-y divide-white/10">
              {sampleLeads.map((lead, index) => (
                <li
                  key={lead.name}
                  className="flex items-start justify-between gap-3 px-3.5 py-3 opacity-0 animate-[leads-rise_0.55s_ease-out_forwards]"
                  style={{ animationDelay: `${0.45 + index * 0.1}s` }}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#2563EB]/20 text-[#93C5FD]">
                      <MapPin className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold text-white">{lead.name}</p>
                      <p className="mt-0.5 text-[12px] text-white/50">{lead.place}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-[12px] font-medium text-white/70">
                    {lead.phone}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Pins overlay the card edges — not the headline above */}
      <FloatingPin
        className="left-0 top-[42%] -translate-y-1/2 animate-[leads-float_4.5s_ease-in-out_infinite] sm:left-1"
        label="Mumbai"
        delay="0s"
      />
      <FloatingPin
        className="right-0 top-[68%] -translate-y-1/2 animate-[leads-float_5.2s_ease-in-out_infinite] sm:right-1"
        label="Bengaluru"
        delay="0.35s"
      />
    </div>
  );
}

function StickyBuyBar({
  label,
  hasLifetimeAccess,
}: {
  label: string;
  hasLifetimeAccess: boolean;
}) {
  const cta = resolveMarketingCta(hasLifetimeAccess, { label });

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[120] border-t border-[#D5DEE8] bg-white/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <CtaButton
          className="w-full max-w-none"
          buttonClassName="text-[16px] sm:text-[18px]"
          {...cta}
        />
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[125] hidden justify-center px-4 lg:flex">
        <div className="pointer-events-auto w-full max-w-[640px] rounded-2xl border border-[#D5DEE8] bg-white px-5 py-3.5 shadow-[0_12px_40px_rgba(11,31,51,0.12)]">
          <CtaButton
            className="w-full max-w-none"
            buttonClassName="text-[17px] sm:text-[19px]"
            {...cta}
          />
        </div>
      </div>
    </>
  );
}

export function B2bLeadsLandingPage({
  hasLifetimeAccess = false,
}: {
  hasLifetimeAccess?: boolean;
}) {
  const heroCta = resolveMarketingCta(hasLifetimeAccess, {
    label: "Get Lifetime Access for ₹999",
  });
  const stepsCta = resolveMarketingCta(hasLifetimeAccess, {
    label: "See How Easy It Is - Get It Now",
  });
  const pricingCta = resolveMarketingCta(hasLifetimeAccess, {
    label: "Claim Your Lifetime License - ₹999",
  });
  const finalCta = resolveMarketingCta(hasLifetimeAccess, {
    label: "Get the Software Now for just ₹999",
  });
  const stickyCtaLabel = hasLifetimeAccess
    ? "Open products"
    : "Get Lifetime Access for ₹999";

  return (
    <div
      className={cn(
        displayFont.variable,
        bodyFont.variable,
        "relative bg-[var(--leads-paper)] text-[var(--leads-ink)] [--leads-paper:#F3F6F9] [--leads-ink:#0B1F33] [--leads-muted:#5B6B7C] [--leads-accent:#2563EB] [--leads-line:#D5DEE8] [--leads-deep:#07131F] font-[family-name:var(--font-leads-body)]",
      )}
    >
      {/* Hero — z-[130] keeps sticky CTA (z-[120]) under the first screen */}
      <section className="relative z-[130] isolate overflow-hidden">
        {/* Background layer (always behind logo + copy) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_12%_0%,rgba(37,99,235,0.16),transparent_55%),radial-gradient(ellipse_70%_50%_at_90%_8%,rgba(11,31,51,0.1),transparent_50%),linear-gradient(180deg,#E4EDF8_0%,#F3F6F9_85%)]" />
          <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(11,31,51,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(11,31,51,0.05)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(180deg,black,transparent_80%)]" />
          <div className="absolute top-10 right-[-20%] h-[18rem] w-[18rem] text-[#5B8FC7] opacity-55 sm:top-16 sm:right-[-8%] sm:h-[26rem] sm:w-[26rem] sm:opacity-70">
            <MapBackdrop />
          </div>
          <div className="absolute bottom-8 left-[-18%] h-[14rem] w-[14rem] text-[#7BA4D4] opacity-40 sm:bottom-0 sm:left-[-8%] sm:h-[18rem] sm:w-[18rem] sm:opacity-50">
            <MapBackdrop />
          </div>
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col px-4 pb-28 pt-5 sm:px-6 lg:min-h-svh lg:pb-24 lg:pt-7">
          <header className="relative z-20 flex items-center opacity-0 animate-[leads-rise_0.5s_ease-out_forwards]">
            <BrandLogo size="md" href="/" className="relative z-20 h-7 w-auto shrink-0 sm:h-8" />
          </header>

          <div className="relative z-10 mt-8 grid flex-1 items-center gap-8 lg:mt-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div className="opacity-0 animate-[leads-rise_0.65s_ease-out_0.08s_forwards]">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#BFD0E6] bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--leads-accent)] shadow-sm">
                <span className="size-1.5 rounded-full bg-[var(--leads-accent)]" />
                Fresh & Live B2B Leads
              </div>
              <h1 className="max-w-xl font-[family-name:var(--font-leads-display)] text-[32px] leading-[1.05] tracking-[-0.03em] text-[var(--leads-ink)] sm:text-[44px] lg:text-[52px]">
                Generate Fresh B2B Leads in 30 Seconds. Pay Only Once.
              </h1>
              <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[var(--leads-muted)] sm:text-[18px]">
                Stop buying dead databases and paying monthly software fees. Get
                the fastest, easiest, reliable, most affordable B2B lead
                generation software and find your perfect clients instantly.
              </p>
              <p className="mt-2 hidden text-[15px] font-medium text-[var(--leads-ink)]/80 sm:mt-3 sm:block sm:text-[16px]">
                Join smart sales teams who generate fresh leads on demand.
              </p>

              <div className="mt-7 hidden flex-col items-start gap-1 lg:flex">
                <CtaButton
                  size="large"
                  className="w-full max-w-[22rem] sm:w-auto sm:max-w-none"
                  {...heroCta}
                />
                {!hasLifetimeAccess ? (
                  <CtaNote className="text-left sm:max-w-[22rem]" />
                ) : null}
              </div>
            </div>

            {/* Preview comes early so graphics show in the first screen on mobile */}
            <div className="opacity-0 animate-[leads-rise_0.7s_ease-out_0.16s_forwards]">
              <LeadPreviewPanel className="mx-auto w-full max-w-lg lg:ml-auto lg:mr-0" />
            </div>
          </div>

          <div className="relative z-10 mt-6 opacity-0 animate-[leads-rise_0.55s_ease-out_0.28s_forwards] lg:mt-8">
            <div className="mb-5 flex flex-col items-center lg:hidden">
              <CtaButton
                size="large"
                className="w-full max-w-[22rem]"
                {...heroCta}
              />
              {!hasLifetimeAccess ? <CtaNote /> : null}
            </div>

            <ul className="mx-auto grid max-w-lg gap-2 lg:ml-auto lg:mr-0 lg:max-w-none lg:grid-cols-2 xl:max-w-5xl">
              {heroChecks.map((item, index) => {
                const [main, extra] = item.split(" (");
                return (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 rounded-xl border border-[#D5DEE8] bg-white px-3 py-2.5 text-[14px] leading-snug text-[var(--leads-ink)] shadow-sm opacity-0 animate-[leads-rise_0.5s_ease-out_forwards] sm:text-[15px]"
                    style={{ animationDelay: `${0.36 + index * 0.07}s` }}
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--leads-accent)]/12 text-[var(--leads-accent)]">
                      <Check className="size-3.5 stroke-[2.5]" />
                    </span>
                    <span>
                      <span className="font-semibold">{main}</span>
                      {extra ? (
                        <span className="text-[var(--leads-muted)]"> ({extra}</span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="relative z-10 overflow-hidden border-t border-[var(--leads-line)] bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-10 size-64 rounded-full bg-[#DBEAFE] blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionLabel>The problem</SectionLabel>
          <h2 className="max-w-3xl font-[family-name:var(--font-leads-display)] text-[30px] leading-[1.1] tracking-tight sm:text-[40px]">
            Are you tired of wasting time and money on bad leads?
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--leads-muted)] sm:text-[17px]">
            If you are trying to sell B2B, you already know the big problems:
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {problemPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div
                  key={point.title}
                  className="relative rounded-2xl border border-[var(--leads-line)] bg-[#F7FAFD] p-6"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute right-3 top-3 size-16 rounded-full bg-[#DBEAFE]/80"
                  />
                  <div className="relative flex size-11 items-center justify-center rounded-xl bg-[var(--leads-accent)] text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)]">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="relative mt-5 text-[18px] font-semibold tracking-tight">
                    {point.title}
                  </h3>
                  <p className="relative mt-2 text-[15px] leading-relaxed text-[var(--leads-muted)]">
                    {point.text}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex items-start gap-3 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-5 py-4">
            <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--leads-accent)] text-white">
              <Zap className="size-4" />
            </span>
            <p className="font-[family-name:var(--font-leads-display)] text-[22px] leading-snug text-[var(--leads-ink)] sm:text-[28px]">
              There is a better, faster, and cheaper way.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 overflow-hidden border-t border-[var(--leads-line)] bg-[#EAF0F6]">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-72 w-72 text-[#9BB6D4] opacity-40"
        >
          <MapBackdrop />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="max-w-3xl font-[family-name:var(--font-leads-display)] text-[30px] leading-[1.1] tracking-tight sm:text-[40px]">
            So simple, anyone can use it. Generate leads in 3 clicks.
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--leads-muted)] sm:text-[17px]">
            We built this software to be{" "}
            <span className="font-semibold text-[var(--leads-ink)]">
              very easy and simple to use
            </span>
            . You don&apos;t need any technical skills. If you can type on a
            keyboard, you can generate B2B leads ready to pitch today.
          </p>

          <ol className="mt-12 grid gap-5 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.number}
                  className="relative rounded-2xl border border-[#C9D7E8] bg-white p-6 shadow-[0_12px_30px_rgba(11,31,51,0.05)]"
                >
                  {index < steps.length - 1 ? (
                    <div
                      aria-hidden
                      className="absolute top-10 right-[-14px] z-10 hidden h-px w-7 bg-[var(--leads-accent)]/40 lg:block"
                    />
                  ) : null}
                  <div className="flex items-center justify-between">
                    <p className="font-[family-name:var(--font-leads-display)] text-[28px] leading-none text-[var(--leads-accent)]">
                      {step.number}
                    </p>
                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[var(--leads-accent)]">
                      <Icon className="size-5" />
                    </span>
                  </div>
                  <h3 className="mt-5 text-[20px] font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--leads-muted)]">
                    {step.text}
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="mt-12 flex flex-col items-start">
            <CtaButton
              size="large"
              className="w-full max-w-[26rem] sm:w-auto"
              {...stepsCta}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 border-t border-[var(--leads-line)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionLabel>What you get</SectionLabel>
          <h2 className="max-w-3xl font-[family-name:var(--font-leads-display)] text-[30px] leading-[1.1] tracking-tight sm:text-[40px]">
            Everything you need to fill your sales pipeline.
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--leads-muted)] sm:text-[17px]">
            We packed this software with only the features that actually make
            you money. No fluff, just results.
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--leads-line)] bg-[#F8FAFC] p-6 transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <div
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1 bg-[var(--leads-accent)]/70"
                  />
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--leads-accent)] shadow-sm ring-1 ring-[#D5DEE8]">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-[18px] font-semibold tracking-tight sm:text-[19px]">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-[var(--leads-muted)]">
                        {feature.text}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 overflow-hidden border-t border-[var(--leads-line)] bg-[#F3F6F9]">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 bottom-0 size-72 rounded-full bg-[#BFDBFE]/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 top-10 size-72 rounded-full bg-[#93C5FD]/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="max-w-3xl font-[family-name:var(--font-leads-display)] text-[30px] leading-[1.1] tracking-tight sm:text-[40px]">
            Why rent your leads when you can own the machine?
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--leads-muted)] sm:text-[17px]">
            Other lead generation tools charge you monthly fees forever or a huge
            upfront payment for a lead database. We do things differently.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--leads-line)] bg-white/90 p-6 backdrop-blur-sm sm:p-8">
              <p className="text-[13px] font-semibold tracking-[0.12em] text-[var(--leads-muted)] uppercase">
                Standard SaaS Tools
              </p>
              <ul className="mt-6 space-y-4 text-[18px] text-[var(--leads-muted)]">
                {["₹5,000 / Month", "Hidden Fees", "Hard to Learn"].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 line-through decoration-[var(--leads-ink)]/30"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-[#FEE2E2] text-[#B91C1C]">
                      ×
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#3B82F6]/30 bg-[var(--leads-deep)] p-6 text-white sm:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-[#2563EB]/35 blur-2xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-0 h-40 w-56 text-[#5B8FC7] opacity-40"
              >
                <MapBackdrop />
              </div>
              <div className="relative">
                <p className="text-[13px] font-semibold tracking-[0.12em] text-white/60 uppercase">
                  Our Lead Generation Software
                </p>
                <p className="mt-5 font-[family-name:var(--font-leads-display)] text-[48px] leading-none tracking-tight sm:text-[56px]">
                  ₹999
                </p>
                <p className="mt-2 text-[15px] text-white/65">One-Time Payment</p>
                <ul className="mt-7 space-y-3">
                  {pricingPerks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-[15px]">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/30 text-[#93C5FD]">
                        <Check className="size-3.5 stroke-[2.5]" />
                      </span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <CtaButton
                    size="large"
                    className="w-full max-w-none"
                    {...pricingCta}
                  />
                  {!hasLifetimeAccess ? <CtaNote light /> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 border-t border-[var(--leads-line)] bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="font-[family-name:var(--font-leads-display)] text-[30px] leading-[1.1] tracking-tight sm:text-[40px]">
            Frequently Asked Questions
          </h2>

          <Accordion type="single" collapsible className="mt-8 w-full">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={item.q}
                value={`faq-${index}`}
                className="border-[var(--leads-line)]"
              >
                <AccordionTrigger className="text-left text-[16px] font-semibold text-[var(--leads-ink)] hover:no-underline sm:text-[17px]">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] leading-relaxed text-[var(--leads-muted)]">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 overflow-hidden bg-[var(--leads-deep)] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.35),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.2),transparent_40%)]" />
          <div className="absolute right-[-5%] top-[-10%] h-[28rem] w-[28rem] text-[#5B8FC7]">
            <MapBackdrop />
          </div>
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="font-[family-name:var(--font-leads-display)] text-[30px] leading-[1.1] tracking-tight sm:text-[42px]">
            Ready to stop searching for clients and start closing them?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-white/70 sm:text-[17px]">
            Stop wasting hours doing manual research. Get the fresh, accurate
            data you need to grow your business today.
          </p>
          <div className="mt-8 flex flex-col items-center">
            <CtaButton
              size="large"
              className="w-full max-w-[28rem]"
              {...finalCta}
            />
            {!hasLifetimeAccess ? <CtaNote light /> : null}
          </div>
        </div>
      </section>

      <footer className="relative z-[130] border-t border-[var(--leads-line)] bg-[#F3F6F9] pb-28 lg:pb-32">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
          <BrandLogo size="sm" href="/" />
          <p className="text-[12px] text-[var(--leads-muted)]">
            © {new Date().getFullYear()} growscalex. All rights reserved.
          </p>
        </div>
      </footer>

      <StickyBuyBar label={stickyCtaLabel} hasLifetimeAccess={hasLifetimeAccess} />

      <style>{`
        @keyframes leads-rise {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes leads-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes leads-pulse {
          0% { transform: scale(0.92); opacity: 0.5; }
          70% { transform: scale(1.1); opacity: 0; }
          100% { transform: scale(1.1); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[leads-rise_0\\.5s_ease-out_forwards\\],
          .animate-\\[leads-rise_0\\.65s_ease-out_0\\.08s_forwards\\],
          .animate-\\[leads-rise_0\\.7s_ease-out_0\\.18s_forwards\\],
          .animate-\\[leads-rise_0\\.55s_ease-out_forwards\\],
          .animate-\\[leads-float_4\\.5s_ease-in-out_infinite\\],
          .animate-\\[leads-float_5\\.2s_ease-in-out_infinite\\],
          .animate-\\[leads-pulse_3\\.5s_ease-out_infinite\\],
          .animate-\\[leads-pulse_3\\.5s_ease-out_0\\.6s_infinite\\] {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
