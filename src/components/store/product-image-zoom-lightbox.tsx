"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { createPortal } from "react-dom";
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
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);

  const zoomRef = useRef(1);
  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

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

  // Keep drag working even if the pointer leaves the image area
  useEffect(() => {
    function onWindowPointerMove(event: globalThis.PointerEvent) {
      if (!dragging.current || zoomRef.current <= 1) return;
      const dx = event.clientX - lastPoint.current.x;
      const dy = event.clientY - lastPoint.current.y;
      lastPoint.current = { x: event.clientX, y: event.clientY };
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    }

    function onWindowPointerUp() {
      if (!dragging.current) return;
      dragging.current = false;
      setIsDragging(false);
    }

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("pointercancel", onWindowPointerUp);
    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
      window.removeEventListener("pointercancel", onWindowPointerUp);
    };
  }, []);

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
    if (zoomRef.current <= 1) return;
    // Only primary button / touch / pen
    if (event.button !== 0 && event.pointerType === "mouse") return;

    event.preventDefault();
    dragging.current = true;
    setIsDragging(true);
    lastPoint.current = { x: event.clientX, y: event.clientY };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // ignore — window listeners still handle the drag
    }
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    dragging.current = false;
    setIsDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  }

  if (!mounted) return null;

  return createPortal(
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
        ref={stageRef}
        className="store-zoom-stage"
        onClick={(event) => event.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cloudinaryDeliveryUrl(src, { width: 1100, quality: "good" })}
          alt={alt}
          className="store-zoom-image"
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
            transition: isDragging ? "none" : undefined,
          }}
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
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
        Scroll or use + / − to zoom · Drag to move · Esc to close
      </p>
    </div>,
    document.body,
  );
}
