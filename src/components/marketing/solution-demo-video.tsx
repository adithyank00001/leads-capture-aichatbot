"use client";

import { useEffect, useRef, useState } from "react";

const SOLUTION_VIDEO_SRC =
  "https://res.cloudinary.com/ntv0bhpy/video/upload/v1788455543/0821_2_2.webm";

/**
 * Loads and plays the solution demo video only when it scrolls into view
 * (saves mobile bandwidth before LCP).
 */
export function SolutionDemoVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    void video.play().catch(() => {
      // Autoplay may be blocked; muted + playsInline usually works.
    });
  }, [shouldLoad]);

  return (
    <div
      ref={containerRef}
      className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-xl sm:mt-12 lg:hidden"
    >
      {shouldLoad ? (
        <video
          ref={videoRef}
          src={SOLUTION_VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="metadata"
          aria-hidden
          tabIndex={-1}
          controls={false}
          className="pointer-events-none block h-auto w-full [&::-webkit-media-controls]:hidden"
        />
      ) : (
        <div
          aria-hidden
          className="aspect-[9/16] w-full bg-[#F3F6F9] sm:aspect-video"
        />
      )}
    </div>
  );
}
