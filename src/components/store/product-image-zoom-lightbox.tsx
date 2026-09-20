"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

import { cloudinaryDeliveryUrl } from "@/lib/store/cloudinary";

type Props = {
  src: string;
  alt: string;
  onClose: () => void;
};

/** Full-screen product image zoom — loaded only when the buyer opens zoom. */
export function ProductImageZoomLightbox({ src, alt, onClose }: Props) {
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
