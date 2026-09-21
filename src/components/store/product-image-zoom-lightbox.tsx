"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut } from "lucide-react";

import { cloudinaryDeliveryUrl } from "@/lib/store/cloudinary";

type Props = {
  src: string;
  alt: string;
  onClose: () => void;
};

type Point = { x: number; y: number };

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Full-screen product image zoom — mobile pinch + drag friendly. */
export function ProductImageZoomLightbox({ src, alt, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);

  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, Point>());
  const lastPanPoint = useRef<Point | null>(null);
  const pinchStartDist = useRef(0);
  const pinchStartZoom = useRef(1);
  const movedEnough = useRef(false);
  const tapStart = useRef<Point | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  function applyZoom(next: number, nextOffset?: Point) {
    const clamped = Math.min(4, Math.max(1, Number(next.toFixed(2))));
    zoomRef.current = clamped;
    setZoom(clamped);
    if (clamped === 1) {
      offsetRef.current = { x: 0, y: 0 };
      setOffset({ x: 0, y: 0 });
      return;
    }
    if (nextOffset) {
      offsetRef.current = nextOffset;
      setOffset(nextOffset);
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=") {
        applyZoom(Math.min(4, zoomRef.current + 0.25));
      }
      if (event.key === "-" || event.key === "_") {
        applyZoom(Math.max(1, zoomRef.current - 0.25));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // Non-passive listeners so phones don't steal pinch / scroll gestures
  useEffect(() => {
    if (!mounted) return;
    const stage = stageRef.current;
    if (!stage) return;

    function onPointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();
      try {
        stage!.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }

      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      movedEnough.current = false;

      if (pointers.current.size === 1) {
        tapStart.current = { x: event.clientX, y: event.clientY };
        lastPanPoint.current = { x: event.clientX, y: event.clientY };
        if (zoomRef.current > 1) setIsDragging(true);
      }

      if (pointers.current.size === 2) {
        const pts = Array.from(pointers.current.values());
        pinchStartDist.current = distance(pts[0], pts[1]) || 1;
        pinchStartZoom.current = zoomRef.current;
        lastPanPoint.current = null;
        setIsDragging(false);
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (!pointers.current.has(event.pointerId)) return;
      event.preventDefault();

      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      // Two-finger pinch zoom
      if (pointers.current.size >= 2) {
        const pts = Array.from(pointers.current.values());
        const dist = distance(pts[0], pts[1]);
        if (pinchStartDist.current > 0) {
          const scale = dist / pinchStartDist.current;
          applyZoom(
            Math.min(4, Math.max(1, pinchStartZoom.current * scale)),
          );
          movedEnough.current = true;
        }
        return;
      }

      // One-finger drag when zoomed
      if (
        pointers.current.size === 1 &&
        zoomRef.current > 1 &&
        lastPanPoint.current
      ) {
        const dx = event.clientX - lastPanPoint.current.x;
        const dy = event.clientY - lastPanPoint.current.y;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) movedEnough.current = true;
        lastPanPoint.current = { x: event.clientX, y: event.clientY };
        const next = {
          x: offsetRef.current.x + dx,
          y: offsetRef.current.y + dy,
        };
        offsetRef.current = next;
        setOffset(next);
        setIsDragging(true);
      }
    }

    function endPointer(event: PointerEvent) {
      if (!pointers.current.has(event.pointerId)) return;

      const wasTap =
        pointers.current.size === 1 &&
        !movedEnough.current &&
        tapStart.current != null &&
        distance(tapStart.current, {
          x: event.clientX,
          y: event.clientY,
        }) < 14;

      pointers.current.delete(event.pointerId);
      try {
        stage!.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }

      if (pointers.current.size < 2) pinchStartDist.current = 0;

      if (pointers.current.size === 1) {
        lastPanPoint.current = Array.from(pointers.current.values())[0];
        if (zoomRef.current > 1) setIsDragging(true);
      } else {
        lastPanPoint.current = null;
        setIsDragging(false);
      }

      // Tap image to zoom in (phones have no scroll wheel)
      if (wasTap && zoomRef.current <= 1) {
        applyZoom(2);
      }
    }

    function onTouchMove(event: TouchEvent) {
      // Stop page scroll / browser zoom while interacting
      if (event.cancelable) event.preventDefault();
    }

    stage.addEventListener("pointerdown", onPointerDown, { passive: false });
    stage.addEventListener("pointermove", onPointerMove, { passive: false });
    stage.addEventListener("pointerup", endPointer);
    stage.addEventListener("pointercancel", endPointer);
    stage.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", endPointer);
      stage.removeEventListener("pointercancel", endPointer);
      stage.removeEventListener("touchmove", onTouchMove);
    };
  }, [mounted]);

  function zoomBy(delta: number) {
    applyZoom(zoomRef.current + delta);
  }

  function handleOverlayClick() {
    if (movedEnough.current || pointers.current.size > 0) return;
    onClose();
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="store-zoom-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Zoomed product image"
      onClick={handleOverlayClick}
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
        onWheel={(event) => {
          event.preventDefault();
          zoomBy(event.deltaY < 0 ? 0.2 : -0.2);
        }}
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
        />
      </div>
      <p className="store-zoom-hint">
        Pinch or tap to zoom · Drag to move · Use + / − · Tap outside to close
      </p>
    </div>,
    document.body,
  );
}
