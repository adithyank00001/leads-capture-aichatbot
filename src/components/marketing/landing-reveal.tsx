"use client";

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type SlideFrom = "up" | "left" | "right";

type LandingRevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms */
  delay?: number;
  /** Play on mount (hero) instead of on scroll */
  immediate?: boolean;
  as?: ElementType;
  /** Slide direction */
  from?: SlideFrom;
};

const hiddenByDirection: Record<SlideFrom, string> = {
  up: "landing-reveal-from-up",
  left: "landing-reveal-from-left",
  right: "landing-reveal-from-right",
};

export function LandingReveal({
  children,
  className,
  delay = 0,
  immediate = false,
  as: Component = "div",
  from = "up",
}: LandingRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    if (immediate) {
      const timer = window.setTimeout(() => setVisible(true), delay);
      return () => window.clearTimeout(timer);
    }

    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          window.setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delay, immediate]);

  return createElement(
    Component,
    {
      ref,
      className: cn(
        "landing-reveal will-change-transform",
        visible ? "landing-reveal-in" : hiddenByDirection[from],
        className,
      ),
    },
    children,
  );
}

/** Shared keyframes for landing page slide reveals. Mount once on the page. */
export function LandingRevealStyles() {
  return (
    <style>{`
      .landing-reveal {
        opacity: 1;
        transition:
          transform 0.85s cubic-bezier(0.16, 1, 0.3, 1),
          opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .landing-reveal-from-up {
        transform: translate3d(0, 56px, 0);
        opacity: 0.01;
      }
      .landing-reveal-from-left {
        transform: translate3d(-48px, 18px, 0);
        opacity: 0.01;
      }
      .landing-reveal-from-right {
        transform: translate3d(48px, 18px, 0);
        opacity: 0.01;
      }
      .landing-reveal-in {
        transform: translate3d(0, 0, 0);
        opacity: 1;
      }
      @media (prefers-reduced-motion: reduce) {
        .landing-reveal,
        .landing-reveal-from-up,
        .landing-reveal-from-left,
        .landing-reveal-from-right,
        .landing-reveal-in {
          transition: none !important;
          transform: none !important;
          opacity: 1 !important;
        }
      }
    `}</style>
  );
}
