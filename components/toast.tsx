"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type AnimationEvent,
} from "react";
import { createPortal } from "react-dom";
import { FiCheck } from "react-icons/fi";

type ToastProps = {
  message: string;
  title?: string;
  open: boolean;
  onClose: () => void;
  durationMs?: number;
};

type SwipeDirection = "right" | "left";

function subscribe() {
  return () => {};
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Toast({
  message,
  title = "Ticket created",
  open,
  onClose,
  durationMs = 4200,
}: ToastProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [exiting, setExiting] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>("right");
  const closingRef = useRef(false);
  const nextDirection = useRef<SwipeDirection>("right");

  if (!open && exiting) {
    setExiting(false);
  }

  const requestClose = useCallback(() => {
    if (closingRef.current) {
      return;
    }

    closingRef.current = true;

    if (prefersReducedMotion()) {
      closingRef.current = false;
      onClose();
      return;
    }

    setSwipeDirection(nextDirection.current);
    nextDirection.current =
      nextDirection.current === "right" ? "left" : "right";
    setExiting(true);
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      closingRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      requestClose();
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [open, durationMs, requestClose, message]);

  function handleAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (
      event.target !== event.currentTarget ||
      !event.animationName.startsWith("toast-swipe-")
    ) {
      return;
    }

    onClose();
  }

  if (!isClient || !open) {
    return null;
  }

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      onAnimationEnd={handleAnimationEnd}
      className={`toast-viewport is-visible border border-brass/40 bg-ink px-4 py-3.5 text-paper sm:px-5 sm:py-4 ${
        exiting
          ? `toast-exit toast-exit-${swipeDirection}`
          : "toast-enter"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center border border-brass/50 text-brass">
          <FiCheck aria-hidden className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="font-(family-name:--font-helix-display) text-sm tracking-wide">
            {title}
          </p>
          <p className="mt-1 wrap-break-word text-sm text-mist">{message}</p>
        </div>
        <button
          type="button"
          onClick={requestClose}
          className="cursor-pointer shrink-0 text-sm text-mist transition hover:text-paper"
        >
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}
